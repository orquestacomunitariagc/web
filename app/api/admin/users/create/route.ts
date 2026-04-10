import { createClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function POST(req: Request) {
  const admin = await currentUser();
  
  // Solo el Master puede crear usuarios manualmente
  if (!admin?.publicMetadata?.isMaster) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const data = await req.json();
    const {
      firstName, surname, email, username, password, dni, phone, matricula,
      isMaster, isArchiver, isExternal,
      artisticProfiles // Array de { agrupacion, seccion, papel }
    } = data;

    if (!firstName || !dni) {
      return new NextResponse(JSON.stringify({ error: "Faltan campos obligatorios para el registro interno (Nombre y DNI)" }), { status: 400 });
    }

    // El email/usuario/con sólo son obligatorios si queremos acceso al sistema
    // Si faltan, se asume que es un registro puramente de base de datos local

    let clerkUser: any = null;
    let uniqueRoles: string[] = [];

    const canCreateClerkAccount = !isExternal && email && username && password;

    if (canCreateClerkAccount) {
      // 1. Crear el usuario en Clerk (básico)
      clerkUser = await clerkClient.users.createUser({
        firstName,
        lastName: surname,
        emailAddress: [email],
        username,
        password,
        publicMetadata: { 
          isMaster: !!isMaster,
          isArchiver: !!isArchiver
        },
        skipPasswordRequirement: false,
        skipPasswordChecks: true
      });
    }

    // 2. Crear el usuario en la DB Local
    const newUser = await prisma.user.upsert({
      where: { dni: String(dni) },
      update: {
        clerkUserId: clerkUser?.id || undefined, // No pisar si ya tenía uno y ahora no pasamos clerkUser
        name: firstName,
        surname: surname,
        email: email || null,
        phone: phone || null,
        isExternal: !!isExternal,
        isActive: true
      },
      create: {
        clerkUserId: clerkUser?.id || null,
        name: firstName,
        surname: surname || "",
        dni: String(dni),
        email: email || null,
        phone: phone || null,
        isExternal: !!isExternal,
        isActive: true
      }
    });

    // 3. Matrícula
    if (matricula) {
      await prisma.matricula.upsert({
        where: { matriculaNumber: String(matricula) },
        update: { userId: newUser.id },
        create: { matriculaNumber: String(matricula), userId: newUser.id }
      });
    }

    // 4. Estructuras (UPSERT)
    if (artisticProfiles && artisticProfiles.length > 0) {
      for (const profile of artisticProfiles) {
        const dbAgrup = await prisma.agrupacion.findUnique({ where: { agrupacion: profile.agrupacion } });
        const dbSeccion = await prisma.seccion.findUnique({ where: { seccion: profile.seccion } });
        const dbPapel = await prisma.papel.findUnique({ where: { papel: profile.papel || "Músico" } });

        if (dbAgrup && dbSeccion && dbPapel) {
          await prisma.estructura.upsert({
            where: {
              userId_papelId_agrupacionId_seccionId: {
                userId: newUser.id,
                papelId: dbPapel.id,
                agrupacionId: dbAgrup.id,
                seccionId: dbSeccion.id
              }
            },
            update: { activo: true },
            create: {
              userId: newUser.id,
              papelId: dbPapel.id,
              agrupacionId: dbAgrup.id,
              seccionId: dbSeccion.id,
              activo: true
            }
          });
        }
      }
    }

    // 5. Sincronizar roles avanzados con Clerk
    const { syncUserWithClerk } = await import("@/lib/clerk-sync");
    await syncUserWithClerk(newUser.id);

    await logActivity("Manual User Created", admin.id, { 
      clerkId: clerkUser?.id, 
      name: `${firstName} ${surname}`, 
      isExternal, 
      dni, 
      artisticProfilesCount: artisticProfiles?.length 
    });

    return NextResponse.json({ success: true, user: newUser });

  } catch (error: any) {
    console.error("Error en Creación Manual:", error);
    
    let errorMessage = "Error desconocido en el registro";
    
    // 1. Errores específicos de Clerk (API)
    if (error.clerkError || error.errors) {
      errorMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Error en el servicio de Clerk.";
    } 
    // 2. Errores de Prisma (Base de Datos)
    else if (error.code === 'P2002') {
      const target = error.meta?.target || "";
      if (target.includes("dni")) errorMessage = "El DNI ya está registrado en la base de datos local.";
      else if (target.includes("email")) errorMessage = "El correo ya está registrado en la base de datos local.";
      else errorMessage = "Ya existe un registro con esos datos únicos.";
    }
    // 3. Otros errores genéricos
    else {
      errorMessage = error.message || error.toString();
    }

    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 400 });
  }
}
