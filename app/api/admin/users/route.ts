import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { logActivity } from "@/lib/logger";

export async function GET() {
  const user = await currentUser();
  
  // Solo el Master puede gestionar músicos
  if (!user?.publicMetadata?.isMaster) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const response = await (await clerkClient()).users.getUserList({ limit: 500 });
    const members = response.data.map(u => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Sin nombre",
      email: u.emailAddresses[0]?.emailAddress || "Sin email",
      roles: (u.publicMetadata?.roles as string[]) || [],
      isArchiver: !!u.publicMetadata?.isArchiver,
      isMaster: !!u.publicMetadata?.isMaster,
      isBanned: !!u.banned
    }));

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return new NextResponse("Clerk Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { userId, roles, action, isArchiver, isMaster } = body;

  try {
     const client = await clerkClient();
     const targetUser = await client.users.getUser(userId);
     const targetName = [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") || targetUser.username || userId;

     // Acción para actualizar Roles (Instrumentos)
     if (action === "update-roles") {
        const currentMetadata = (targetUser.publicMetadata || {}) as any;
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            ...currentMetadata,
            roles
          }
        });
        await logActivity("Actualización de Instrumentos", user.id, { 
          target: targetName, 
          newRoles: roles 
        });
     }

     // Acción para Banear / Desbanear (Bloquear inicio de sesión)
     if (action === "toggle-ban") {
        const { isBanned } = body;
        if (isBanned) {
          await client.users.banUser(userId);
          await logActivity("Usuario Baneado", user.id, { target: targetName });
        } else {
          await client.users.unbanUser(userId);
          await logActivity("Usuario Desbaneado", user.id, { target: targetName });
        }
     }

     // Acción para cambiar permiso de Archivero
     if (action === "toggle-archiver") {
        const currentMetadata = (targetUser.publicMetadata || {}) as any;
        const newValue = isArchiver !== undefined ? isArchiver : !currentMetadata.isArchiver;
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            ...currentMetadata,
            isArchiver: newValue
          }
        });
        await logActivity("Cambio permiso Archivero", user.id, { 
          target: targetName, 
          isArchiver: newValue 
        });
     }

     // Acción para cambiar permiso de Master
     if (action === "toggle-master") {
        const currentMetadata = (targetUser.publicMetadata || {}) as any;
        const newValue = isMaster !== undefined ? isMaster : !currentMetadata.isMaster;
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            ...currentMetadata,
            isMaster: newValue
          }
        });
        await logActivity("Cambio permiso Master", user.id, { 
          target: targetName, 
          isMaster: newValue 
        });
     }

     return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in user action:", err);
    return new NextResponse("Action failed", { status: 500 });
  }
}
