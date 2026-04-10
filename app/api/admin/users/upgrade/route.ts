import { createClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function POST(req: Request) {
  const admin = await currentUser();
  
  if (!admin?.publicMetadata?.isMaster) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { dbId, email, username, password, targetRole, targetValue } = await req.json();

    if (!dbId || !email || !username || !password) {
      return NextResponse.json({ error: "Faltan datos obligatorios para la activación" }, { status: 400 });
    }

    // 1. Verificar que el usuario existe en la DB local
    const dbUser = await prisma.user.findUnique({
      where: { id: dbId },
      include: { estructuras: { include: { seccion: true } } }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "El usuario no existe en la base de datos" }, { status: 404 });
    }

    if (dbUser.clerkUserId) {
      return NextResponse.json({ error: "Este usuario ya tiene acceso a la plataforma" }, { status: 400 });
    }

    // 3. Crear el usuario en Clerk (básico)
    const clerkUser = await clerkClient.users.createUser({
      firstName: dbUser.name,
      lastName: dbUser.surname,
      emailAddress: [email],
      username,
      password,
      publicMetadata: { 
        isMaster: targetRole === 'master' ? targetValue : false,
        isArchiver: targetRole === 'archiver' ? targetValue : false
      },
      skipPasswordRequirement: false,
      skipPasswordChecks: true
    });

    // 4. Actualizar el usuario en la DB local con el nuevo ID de Clerk e email
    await prisma.user.update({
      where: { id: dbId },
      data: {
        clerkUserId: clerkUser.id,
        email: email,
        isExternal: false
      }
    });

    // 5. Sincronizar roles avanzados (con etiquetas compuestas y ban logic)
    const { syncUserWithClerk } = await import("@/lib/clerk-sync");
    await syncUserWithClerk(dbId);

    await logActivity("User Upgraded to Platform", admin.id, { 
      dbId, 
      clerkId: clerkUser.id, 
      name: `${dbUser.name} ${dbUser.surname}`,
      targetRole,
      targetValue
    });

    return NextResponse.json({ success: true, clerkId: clerkUser.id });

  } catch (error: any) {
    console.error("Error en Upgrade de Usuario:", error);
    return NextResponse.json({ error: error.message || "Error al activar el acceso" }, { status: 500 });
  }
}
