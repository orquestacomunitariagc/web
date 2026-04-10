import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { logActivity } from "@/lib/logger";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  
  // Solo el Master puede gestionar músicos
  if (!user?.publicMetadata?.isMaster) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const [clerkResponse, dbUsers] = await Promise.all([
      (await clerkClient()).users.getUserList({ limit: 500 }),
      prisma.user.findMany({
        include: {
          estructuras: {
            include: {
              agrupacion: true,
              seccion: true,
              papel: true
            }
          }
        }
      })
    ]);

    const members = clerkResponse.data.map(u => {
      const dbUser = dbUsers.find(db => db.clerkUserId === u.id);
      return {
        id: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Sin nombre",
        email: u.emailAddresses[0]?.emailAddress || "Sin email",
        roles: (u.publicMetadata?.roles as string[]) || [], // Roles de Clerk
        isArchiver: !!u.publicMetadata?.isArchiver,
        isMaster: !!u.publicMetadata?.isMaster,
        isBanned: !!u.banned || (dbUser ? !dbUser.isActive : false),
        isActive: dbUser ? dbUser.isActive : true,
        isExternal: false,
        // Datos de nuestra DB
        dbId: dbUser?.id,
        birthDate: dbUser?.birthDate,
        hasCertificate: !!dbUser?.hasCertificate,
        estructuras: dbUser?.estructuras.map(e => ({
          id: e.id,
          agrupacion: e.agrupacion.agrupacion,
          seccion: e.seccion.seccion,
          papel: e.papel.papel,
          activo: e.activo,
          atril: e.atril
        })) || []
      };
    });

    // 4. Añadir usuarios externos (solo en DB)
    const externalUsers = dbUsers
      .filter(db => !db.clerkUserId)
      .map(db => ({
        id: `ext_${db.id}`,
        dbId: db.id,
        name: `${db.name} ${db.surname}`.trim() || "Externo sin nombre",
        email: db.email || "—",
        roles: db.estructuras.map(e => e.seccion.seccion),
        isArchiver: false,
        isMaster: false,
        isBanned: !db.isActive,
        isExternal: db.isExternal,
        isActive: db.isActive,
        birthDate: db.birthDate,
        hasCertificate: !!db.hasCertificate,
        estructuras: db.estructuras.map(e => ({
          id: e.id,
          agrupacion: e.agrupacion.agrupacion,
          seccion: e.seccion.seccion,
          papel: e.papel.papel,
          activo: e.activo,
          atril: e.atril
        }))
      }));

    const allMembers = [...members, ...externalUsers];

    return NextResponse.json(allMembers);
  } catch (error) {
    console.error("Error fetching members:", error);
    return new NextResponse("Clerk Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { userId, roles, action, isArchiver, isMaster, estructuraId, activo, atril } = body;

  try {
     const isLocalOnly = typeof userId === 'string' && userId.startsWith('ext_');
     const client = isLocalOnly ? null : await clerkClient();
     let targetUser: any = null;
     let targetName = userId;

     if (!isLocalOnly) {
       try {
         targetUser = await client!.users.getUser(userId);
         targetName = [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") || targetUser.username || userId;
       } catch (err) {
         console.warn("Clerk User not found even if not ext_ prefix, falling back to local DB check.");
       }
     }

      // Buscar el ID de la base de datos (dbId) para usar con syncUserWithClerk
      const dbUser = await prisma.user.findFirst({ 
        where: isLocalOnly ? { id: parseInt(userId.replace('ext_', '')) } : { clerkUserId: userId } 
      });
      
      if (dbUser) {
        targetName = `${dbUser.name} ${dbUser.surname}`.trim();
      } else {
        return new NextResponse("Usuario no encontrado en la DB local", { status: 404 });
      }

      const dbId = dbUser.id;
      const { syncUserWithClerk } = await import("@/lib/clerk-sync");

      // Acción para actualizar Roles manuales (Legacy / Clerk direct)
      if (action === "update-roles" && !isLocalOnly && targetUser) {
         const currentMetadata = (targetUser.publicMetadata || {}) as any;
         await client!.users.updateUserMetadata(userId, {
           publicMetadata: { ...currentMetadata, roles }
         });
         // Sincronizar después para asegurar coherencia con estructuras
         await syncUserWithClerk(dbId);
         await logActivity("Actualización de Instrumentos", user.id, { target: targetName, newRoles: roles });
      }

      // Acción para Banear / Desbanear
      if (action === "toggle-ban") {
         const { isBanned } = body; 
         
         await prisma.user.update({
           where: { id: dbId },
           data: { 
             isActive: !isBanned,
             estructuras: {
               updateMany: { where: {}, data: { activo: !isBanned } }
             }
           }
         });

         await syncUserWithClerk(dbId);
         await logActivity(`Perfil ${isBanned ? 'Desactivado' : 'Activado'}`, user.id, { target: targetName });
      }

      // Acción para actualizar una estructura específica (Activo/Atril)
      if (action === "update-estructura") {
        if (!estructuraId) return new NextResponse("Falta estructuraId", { status: 400 });

        await prisma.estructura.update({
          where: { id: estructuraId },
          data: {
            activo: activo !== undefined ? activo : undefined,
            atril: atril !== undefined ? (atril === "" ? null : parseInt(atril)) : undefined
          }
        });

        await syncUserWithClerk(dbId);
        await logActivity("Estructura Actualizada", user.id, { target: targetName });
      }

      // Acción para AÑADIR una nueva estructura (UPSERT para seguridad)
      if (action === "add-estructura") {
        const { agrupacionId, seccionId, papelId } = body;
        
        await prisma.estructura.upsert({
          where: {
            userId_papelId_agrupacionId_seccionId: {
              userId: dbId,
              agrupacionId: parseInt(agrupacionId),
              seccionId: parseInt(seccionId),
              papelId: parseInt(papelId)
            }
          },
          update: { activo: true },
          create: {
            userId: dbId,
            agrupacionId: parseInt(agrupacionId),
            seccionId: parseInt(seccionId),
            papelId: parseInt(papelId),
            activo: true
          }
        });

        await syncUserWithClerk(dbId);
        await logActivity("Nueva Estructura Añadida", user.id, { target: targetName });
      }

      // Acción para ELIMINAR una estructura
      if (action === "delete-estructura") {
        if (!estructuraId) return new NextResponse("Falta estructuraId", { status: 400 });

        await prisma.estructura.delete({ where: { id: estructuraId } });

        await syncUserWithClerk(dbId);
        await logActivity("Estructura Eliminada", user.id, { target: targetName });
      }

     // Acción para cambiar permiso de Archivero
     if (action === "toggle-archiver" && !isLocalOnly && targetUser) {
        const currentMetadata = (targetUser.publicMetadata || {}) as any;
        const newValue = isArchiver !== undefined ? isArchiver : !currentMetadata.isArchiver;
        await client!.users.updateUserMetadata(userId, {
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
      if (action === "toggle-master" && !isLocalOnly && targetUser) {
        const currentMetadata = (targetUser.publicMetadata || {}) as any;
        const newValue = isMaster !== undefined ? isMaster : !currentMetadata.isMaster;
        await client!.users.updateUserMetadata(userId, {
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

      // Acción para actualizar datos personales básicos
      if (action === "update-user-profile") {
        const { birthDate, hasCertificate } = body;
        await prisma.user.update({
          where: { id: dbId },
          data: { 
            birthDate: birthDate || null,
            hasCertificate: !!hasCertificate
          }
        });
        await logActivity("Perfil Personal Actualizado", user.id, { target: targetName });
      }

      return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in user action:", err);
    return new NextResponse("Action failed", { status: 500 });
  }
}
