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
              seccion: true
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
        estructuras: dbUser?.estructuras.map(e => ({
          id: e.id,
          agrupacion: e.agrupacion.agrupacion,
          seccion: e.seccion.seccion,
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
        estructuras: db.estructuras.map(e => ({
          id: e.id,
          agrupacion: e.agrupacion.agrupacion,
          seccion: e.seccion.seccion,
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

     if (isLocalOnly || !targetUser) {
       const dbId = isLocalOnly ? parseInt(userId.replace('ext_', '')) : null;
       // Si no es ext_ pero no está en Clerk, intentamos buscarlo por DB ID si es posible o Clerk ID
       const dbUser = await prisma.user.findFirst({ 
         where: dbId ? { id: dbId } : { clerkUserId: userId } 
       });
       if (dbUser) targetName = `${dbUser.name} ${dbUser.surname}`.trim();
     }

     // Acción para actualizar Roles (Instrumentos)
     if (action === "update-roles" && !isLocalOnly && targetUser) {
        const currentMetadata = (targetUser.publicMetadata || {}) as any;
        await client!.users.updateUserMetadata(userId, {
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

     // Acción para Banear / Desbanear (Bloquear inicio de sesión / Perfil)
     if (action === "toggle-ban") {
        const { isBanned } = body; // true = desactivar perfil, false = activar perfil
        
        // 1. Actualizar estado local en DB (Cascade)
        await prisma.user.update({
          where: isLocalOnly ? { id: parseInt(userId.replace('ext_', '')) } : { clerkUserId: userId },
          data: { 
            isActive: !isBanned,
            // Si activamos el perfil, activamos todas sus agrupaciones
            // Si desactivamos el perfil, desactivamos todas sus agrupaciones
            estructuras: {
              updateMany: {
                where: {},
                data: { activo: !isBanned }
              }
            }
          }
        });

        if (!isLocalOnly && targetUser) {
          const currentMetadata = (targetUser.publicMetadata || {}) as any;
          if (isBanned) {
            await client!.users.banUser(userId);
            // Limpiar roles de Clerk
            await client!.users.updateUserMetadata(userId, {
              publicMetadata: { ...currentMetadata, roles: [] }
            });
            await logActivity("Perfil Desactivado (Global)", user.id, { target: targetName });
          } else {
            await client!.users.unbanUser(userId);
            
            // Recuperar todas para sincronizar roles en Clerk
            const allEsts = await prisma.estructura.findMany({
              where: { user: { clerkUserId: userId } },
              include: { seccion: true, agrupacion: true }
            });

            const newRoles = allEsts.map(e => e.seccion.seccion);
            const activeGroups = new Set(allEsts.map(e => e.agrupacion.agrupacion));
            
            if (activeGroups.has("Orquesta Comunitaria Gran Canaria")) newRoles.push("Orquesta - Tutti");
            if (activeGroups.has("Coro Comunitario Gran Canaria")) newRoles.push("Coro - Tutti");
            if (activeGroups.has("Ensemble de Flautas")) newRoles.push("Ensemble Flautas - Tutti");
            if (activeGroups.has("Ensemble de Metales")) newRoles.push("Ensemble Metales - Tutti");
            if (activeGroups.has("Ensemble de Chelos")) newRoles.push("Ensemble Chelos - Tutti");
            if (activeGroups.has("OCGC Big Band")) newRoles.push("Big Band - Tutti");

            await client!.users.updateUserMetadata(userId, {
              publicMetadata: { ...currentMetadata, roles: Array.from(new Set(newRoles)) }
            });
            
            await logActivity("Perfil Activado (Activación Masiva)", user.id, { target: targetName });
          }
        } else {
          await logActivity(`Perfil Local ${isBanned ? 'Desactivado' : 'Activado'}`, user.id, { target: targetName });
        }
     }

     // Acción para actualizar una estructura específica (Activo/Atril)
     if (action === "update-estructura") {
       if (!estructuraId) return new NextResponse("Falta estructuraId", { status: 400 });

       const updatedEst = await prisma.estructura.update({
         where: { id: estructuraId },
         data: {
           activo: activo !== undefined ? activo : undefined,
           atril: atril !== undefined ? (atril === "" ? null : parseInt(atril)) : undefined
         },
         include: {
           user: true
         }
       });

       const allUserEstructuras = await prisma.estructura.findMany({
         where: { userId: updatedEst.userId },
         include: { seccion: true, agrupacion: true }
       });
       
       const activeEstructuras = allUserEstructuras.filter(e => e.activo);
       const activeCount = activeEstructuras.length;

       // 1. Sincronizar estado global en DB
       await prisma.user.update({
         where: { id: updatedEst.userId },
         data: { isActive: activeCount > 0 }
       });

       // 2. Si el usuario tiene Clerk, sincronizamos roles y estado de ban
       if (!isLocalOnly && targetUser) {
          const activeRoles = activeEstructuras.map(e => e.seccion.seccion);
          const activeGroups = new Set(activeEstructuras.map(e => e.agrupacion.agrupacion));
          
          if (activeGroups.has("Orquesta Comunitaria Gran Canaria")) activeRoles.push("Orquesta - Tutti");
          if (activeGroups.has("Coro Comunitario Gran Canaria")) activeRoles.push("Coro - Tutti");
          if (activeGroups.has("Ensemble de Flautas")) activeRoles.push("Ensemble Flautas - Tutti");
          if (activeGroups.has("Ensemble de Metales")) activeRoles.push("Ensemble Metales - Tutti");
          if (activeGroups.has("Ensemble de Chelos")) activeRoles.push("Ensemble Chelos - Tutti");
          if (activeGroups.has("OCGC Big Band")) activeRoles.push("Big Band - Tutti");

          const currentMetadata = (targetUser.publicMetadata || {}) as any;
          await client!.users.updateUserMetadata(userId, {
            publicMetadata: {
              ...currentMetadata,
              roles: Array.from(new Set(activeRoles))
            }
          });

          if (activeCount > 0 && targetUser.banned) {
            await client!.users.unbanUser(userId);
            await logActivity("Unban automático por activación de grupo", user.id, { target: targetName });
          } else if (activeCount === 0 && !targetUser.banned) {
            await client!.users.banUser(userId);
            await logActivity("Ban automático por desactivación de todos los grupos", user.id, { target: targetName });
          }
       } else {
          await logActivity("Estado Operativo Actualizado", user.id, { 
            target: targetName, 
            activo: activo !== undefined ? activo : "sin cambios",
            atril: atril !== undefined ? atril : "sin cambios",
            profileActive: activeCount > 0
          });
       }
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

     return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in user action:", err);
    return new NextResponse("Action failed", { status: 500 });
  }
}
