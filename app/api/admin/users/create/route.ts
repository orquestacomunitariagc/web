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
      // 1. Preparar roles para Clerk
      const roles = artisticProfiles?.map((p: any) => p.seccion) || [];
      const agrupacionesSet = new Set(artisticProfiles?.map((p: any) => p.agrupacion) || []);
      
      // Auto-añadir roles Tutti para acceso a carpetas
      if (agrupacionesSet.has("Orquesta Comunitaria Gran Canaria")) roles.push("Orquesta - Tutti");
      if (agrupacionesSet.has("Coro Comunitario Gran Canaria")) roles.push("Coro - Tutti");
      if (agrupacionesSet.has("Ensemble de Flautas")) roles.push("Ensemble Flautas - Tutti");
      if (agrupacionesSet.has("Ensemble de Metales")) roles.push("Ensemble Metales - Tutti");
      if (agrupacionesSet.has("Ensemble de Chelos")) roles.push("Ensemble Chelos - Tutti");
      if (agrupacionesSet.has("OCGC Big Band")) roles.push("Big Band - Tutti");

      uniqueRoles = Array.from(new Set(roles));

      // 2. Crear el usuario en Clerk
      clerkUser = await clerkClient.users.createUser({
        firstName,
        lastName: surname,
        emailAddress: [email],
        username,
        password,
        publicMetadata: { 
          roles: uniqueRoles,
          isMaster: !!isMaster,
          isArchiver: !!isArchiver
        },
        skipPasswordRequirement: false,
        skipPasswordChecks: true
      });
    }

    // 3. Crear el usuario en la DB Local (UPSERT por DNI para evitar duplicados si ya existía como externo)
    const newUser = await prisma.user.upsert({
      where: { dni: String(dni) },
      update: {
        clerkUserId: clerkUser?.id || null,
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

    // 3.1 Manejar Matrícula si se proporciona
    if (matricula) {
      await prisma.matricula.upsert({
        where: { matriculaNumber: String(matricula) },
        update: { userId: newUser.id },
        create: {
          matriculaNumber: String(matricula),
          userId: newUser.id
        }
      });
    }

    // 4. Crear las estructuras (perfiles artísticos)
    if (artisticProfiles && artisticProfiles.length > 0) {
      for (const profile of artisticProfiles) {
        const dbAgrup = await prisma.agrupacion.findUnique({ where: { agrupacion: profile.agrupacion } });
        const dbSeccion = await prisma.seccion.findUnique({ where: { seccion: profile.seccion } });
        const dbPapel = await prisma.papel.findUnique({ where: { papel: profile.papel || "Músico" } });

        if (dbAgrup && dbSeccion && dbPapel) {
          await prisma.estructura.create({
            data: {
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

    await logActivity("Manual User Created", admin.id, { 
      clerkId: clerkUser?.id, 
      name: `${firstName} ${surname}`, 
      isExternal, 
      dni, 
      matricula,
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
