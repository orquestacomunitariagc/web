import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId: requesterId } = await auth();
  if (!requesterId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) {
    return new NextResponse("Forbidden - Only Masters can import users", { status: 403 });
  }

  try {
    const data = await req.json();
    const { email, firstName, lastName, dni, roles, isMaster, isArchiver, isExternal, agrupacion, seccion, papel, matricula } = data;

    if (!firstName || !lastName || !dni) {
      return NextResponse.json({ error: "Nombre, Apellidos y DNI son obligatorios" }, { status: 400 });
    }

    // El email solo es obligatorio si queremos crear cuenta en Clerk (para acceso)
    // Si no hay email, simplemente se crea en la DB local como registro administrativo

    let clerkUser: any = null;

    if (!isExternal && email) {
      // 1. Verificar si el usuario ya existe en Clerk por el email
      const existingClerkUsers = await (await clerkClient()).users.getUserList({ emailAddress: [email] });
      
      if (existingClerkUsers.data.length > 0) {
        clerkUser = existingClerkUsers.data[0];
        // Actualizar metadatos si ya existe
        await (await clerkClient()).users.updateUserMetadata(clerkUser.id, {
          publicMetadata: {
            roles: roles || [],
            isMaster: !!isMaster,
            isArchiver: !!isArchiver
          }
        });
      } else {
        // 2. Crear usuario en Clerk si no existe
        clerkUser = await (await clerkClient()).users.createUser({
            emailAddress: [email],
            firstName,
            lastName,
            publicMetadata: {
              roles: roles || [],
              isMaster: !!isMaster,
              isArchiver: !!isArchiver
            },
        });
      }
    }

    // 3. Sincronizar con la Base de Datos Local (Prisma)
    const dbUser = await prisma.user.upsert({
      where: { dni: String(dni) },
      update: {
        clerkUserId: clerkUser?.id || null, // Si es externo o no tiene Clerk ID, se pone a null si está vacío (o se mantiene)
        name: firstName,
        surname: lastName,
        email: email || null,
        isExternal: !!isExternal,
        isActive: true
      },
      create: {
        clerkUserId: clerkUser?.id || null,
        name: firstName,
        surname: lastName,
        dni: String(dni),
        email: email || null,
        isExternal: !!isExternal,
        isActive: true
      }
    });

    // 3.1 Manejar Matrícula si se proporciona
    if (matricula) {
      await prisma.matricula.upsert({
        where: { matriculaNumber: String(matricula) },
        update: { userId: dbUser.id },
        create: {
          matriculaNumber: String(matricula),
          userId: dbUser.id
        }
      });
    }

    // 4. Crear Estructura (Perfil Artístico) si se proporcionan datos
    if (agrupacion && seccion && papel) {
      const [dbAgrup, dbSeccion, dbPapel] = await Promise.all([
        prisma.agrupacion.findUnique({ where: { agrupacion } }),
        prisma.seccion.findUnique({ where: { seccion } }),
        prisma.papel.findUnique({ where: { papel } })
      ]);

      if (dbAgrup && dbSeccion && dbPapel) {
        await prisma.estructura.upsert({
          where: {
            userId_papelId_agrupacionId_seccionId: {
              userId: dbUser.id,
              papelId: dbPapel.id,
              agrupacionId: dbAgrup.id,
              seccionId: dbSeccion.id
            }
          },
          update: { activo: true },
          create: {
            userId: dbUser.id,
            papelId: dbPapel.id,
            agrupacionId: dbAgrup.id,
            seccionId: dbSeccion.id,
            activo: true
          }
        });
      }
    }

    // 5. Registrar en el Log de Actividad
    await prisma.activityLog.create({
      data: {
        action: "Imported Member",
        details: {
          email,
          clerkId: clerkUser?.id,
          dni,
          roles,
          agrupacion,
          seccion,
          papel,
          matricula
        },
        userClerkId: requesterId
      }
    });

    return NextResponse.json({ success: true, userId: dbUser.id, clerkId: clerkUser?.id });

  } catch (error: any) {
    console.error("Error importing user:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
