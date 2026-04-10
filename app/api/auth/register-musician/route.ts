import { createClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      firstName, surname, dni, email, phone, dob,
      agrupacion, instrument, desk,
      isla, municipio, empadronamiento,
      trabajo, estudios, vehicleRegistration,
      username, password,
      hasCertificate, // Nuevo campo
      inviteCode // El código de invitación de un solo uso
    } = data;

    // 0. Validar y consumir el código de invitación
    if (!inviteCode) return new NextResponse(JSON.stringify({ error: "Se requiere un código de invitación válido." }), { status: 400 });
    
    const invite = await prisma.invitationCode.findUnique({ where: { code: inviteCode } });
    if (!invite) return new NextResponse(JSON.stringify({ error: "Código de invitación no encontrado." }), { status: 404 });
    if (invite.usedAt) return new NextResponse(JSON.stringify({ error: "Este código ya ha sido utilizado." }), { status: 410 });
    if (new Date(invite.expiresAt) < new Date()) return new NextResponse(JSON.stringify({ error: "Este código ha caducado." }), { status: 410 });

    // Marcar como usado inmediatamente para evitar ataques de carrera (race conditions)
    await prisma.invitationCode.update({
      where: { id: invite.id },
      data: { usedAt: new Date() }
    });

    // 1. Preparar los pares Agrupación/Sección para crear la Estructura en DB
    const groupPairs = [
      { ag: data.agrupacion, inst: data.instrument },
      { ag: data.agrupacion2, inst: data.instrument2 },
      { ag: data.agrupacion3, inst: data.instrument3 }
    ].filter(p => p.ag && p.inst);

    // 2. Crear el usuario en Clerk (solo configuración básica, syncUserWithClerk pondrá los roles después)
    const clerkUser = await clerkClient.users.createUser({
      firstName,
      lastName: surname,
      emailAddress: [email],
      username,
      password,
      publicMetadata: {}, // Se llenará en el paso 6
      skipPasswordRequirement: false,
      skipPasswordChecks: true
    });

    const papelMusico = await prisma.papel.findUnique({ where: { papel: "Músico" } });
    if (!papelMusico) throw new Error("Papel 'Músico' no encontrado en el catálogo. Ejecuta el seed.");

    // 3. Buscar/Crear Residencia y Empleo (obligatorios según el nuevo formulario)
    const [residenciaRecord, empleoRecord] = await Promise.all([
      prisma.residencia.upsert({
        where: {
          isla_municipio_empadronamiento: {
            isla: isla || null,
            municipio: municipio || null,
            empadronamiento: empadronamiento || null
          }
        },
        create: { isla: isla || null, municipio: municipio || null, empadronamiento: empadronamiento || null },
        update: {}
      }),
      prisma.empleo.upsert({
        where: {
          trabajo_estudios: {
            trabajo: trabajo || null,
            estudios: estudios || null
          }
        },
        create: { trabajo: trabajo || null, estudios: estudios || null },
        update: {}
      })
    ]);

    // 4. Crear o Actualizar el usuario principal (UPSERT por DNI)
    const newUser = await prisma.user.upsert({
      where: { dni: dni || "" },
      update: {
        clerkUserId: clerkUser.id,
        name: firstName,
        surname: surname || "",
        email: email,
        phone: phone || null,
        birthDate: dob || null,
        hasCertificate: !!hasCertificate,
        residenciaId: residenciaRecord.id,
        empleoId: empleoRecord.id,
        isExternal: false,
        isActive: true
      },
      create: {
        clerkUserId: clerkUser.id,
        name: firstName,
        surname: surname || "",
        dni: dni || "",
        email: email,
        phone: phone || null,
        birthDate: dob || null,
        hasCertificate: !!hasCertificate,
        residenciaId: residenciaRecord.id,
        empleoId: empleoRecord.id,
        isExternal: false,
        isActive: true
      }
    });

    // 5. Crear todas las filas de Estructura solicitadas (UPSERT para evitar fallos si ya existía administrativamente)
    for (const pair of groupPairs) {
      const dbAgrup = await prisma.agrupacion.findUnique({ where: { agrupacion: pair.ag } });
      const dbInst = await prisma.seccion.findUnique({ where: { seccion: pair.inst } });
      
      if (dbAgrup && dbInst) {
        await prisma.estructura.upsert({
          where: {
            userId_papelId_agrupacionId_seccionId: {
              userId: newUser.id,
              papelId: papelMusico.id,
              agrupacionId: dbAgrup.id,
              seccionId: dbInst.id
            }
          },
          update: { activo: true },
          create: {
            userId: newUser.id,
            papelId: papelMusico.id,
            agrupacionId: dbAgrup.id,
            seccionId: dbInst.id,
            activo: true
          }
        });
      }
    }

    // 6. Sincronizar roles avanzados con Clerk usando la lógica maestra
    const { syncUserWithClerk } = await import("@/lib/clerk-sync");
    await syncUserWithClerk(newUser.id);

    return NextResponse.json({ success: true, userId: clerkUser.id, dbId: newUser.id });
  } catch (error: any) {
    console.error("Error Registrando Miembro:", error);
    
    let errorMessage = "Error desconocido en el registro";
    
    // Si el error viene de Clerk
    if (error.clerkError || error.errors) {
      errorMessage = error.errors?.[0]?.message || error.message || "Error en el servicio de autenticación (Clerk)";
    } 
    // Si el error viene de Prisma por campos duplicados (P2002)
    else if (error.code === 'P2002') {
      const target = error.meta?.target || "";
      if (target.includes("dni")) errorMessage = "El DNI ya está registrado.";
      else if (target.includes("email")) errorMessage = "El correo ya está registrado.";
      else errorMessage = "Ya existe un registro con esos datos.";
    }
    // Otros errores
    else {
      errorMessage = error.message || error.toString();
    }

    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 400 });
  }
}
