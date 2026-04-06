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
    const { email, firstName, lastName, dni, roles, isMaster, isArchiver } = await req.json();

    if (!email || !firstName || !lastName || !dni) {
      return NextResponse.json({ error: "Email, Name, Last Name and DNI are required" }, { status: 400 });
    }

    // 1. Verificar si el usuario ya existe en Clerk por el email
    let clerkUser;
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
      // Nota: Clerk enviará un correo para establecer contraseña o verificar según la config del dashboard
      clerkUser = await (await clerkClient()).users.createUser({
          emailAddress: [email],
          firstName,
          lastName,
          publicMetadata: {
            roles: roles || [],
            isMaster: !!isMaster,
            isArchiver: !!isArchiver
          },
          // Se puede añadir skipPasswordChecks: true o similares dependiendo de la configuración
      });
    }

    // 3. Sincronizar con la Base de Datos Local (Prisma)
    // Buscamos por DNI o por clerkUserId
    const dbUser = await prisma.user.upsert({
      where: { dni: String(dni) },
      update: {
        clerkUserId: clerkUser.id,
        name: firstName,
        surname: lastName,
        email: email
      },
      create: {
        clerkUserId: clerkUser.id,
        name: firstName,
        surname: lastName,
        dni: String(dni),
        email: email
      }
    });

    // 4. Registrar en el Log de Actividad
    await prisma.activityLog.create({
      data: {
        action: "Imported Member",
        details: {
          email,
          clerkId: clerkUser.id,
          dni,
          roles
        },
        userClerkId: requesterId
      }
    });

    return NextResponse.json({ success: true, userId: dbUser.id, clerkId: clerkUser.id });

  } catch (error: any) {
    console.error("Error importing user:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
