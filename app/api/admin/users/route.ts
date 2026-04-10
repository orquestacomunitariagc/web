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

     if (isLocalOnly || !targetUser) {
       const dbId = isLocalOnly ? parseInt(userId.replace('ext_', '')) : null;
       // Si no es ext_ pero no está en Clerk, intentamos buscarlo por DB ID si es posible o Clerk ID
       const dbUser = await prisma.user.findFirst({ 
         where: dbId ? { id: dbId } : { clerkUserId: userId } 
       });
        if (dbUser) targetName = `${dbUser.name} ${dbUser.surname}`.trim();
     }

     // --- FUNCIÓN HELPER PARA SINCRONIZACIÓN TOTAL ---
     const syncUserPermissions = async (userId: string, clerkId: string | null) => {
        const allEsts = await prisma.estructura.findMany({
          where: clerkId ? { user: { clerkUserId: clerkId } } : { id: parseInt(userId.replace('ext_', '')) },
          include: { seccion: true, agrupacion: true, papel: true }
        });
        
        const activeEstructuras = allEsts.filter(e => e.activo);
        const roles = new Set<string>();
        
        activeEstructuras.forEach(e => {
          roles.add(e.seccion.seccion);
          roles.add(e.papel.papel);
          roles.add(`${e.agrupacion.agrupacion}:${e.seccion.seccion}`);
          roles.add(`Agrupación:${e.agrupacion.agrupacion}`);
          if (e.agrupacion.agrupacion === "Orquesta Comunitaria Gran Canaria") roles.add("Orquesta - Tutti");
          if (e.agrupacion.agrupacion === "Coro Comunitario Gran Canaria") roles.add("Coro - Tutti");
        });

        if (clerkId) {
          const client = await clerkClient();
          const target = await client.users.getUser(clerkId);
          await client.users.updateUserMetadata(clerkId, {
            publicMetadata: {
              ...(target.publicMetadata || {}),
              roles: Array.from(roles),
              agrupaciones: Array.from(new Set(activeEstructuras.map(e => e.agrupacion.agrupacion))),
              isDirector: activeEstructuras.some(e => e.papel.papel.toLowerCase().includes("director") || e.papel.papel.toLowerCase().includes("jefe"))
            }
          });
          
          if (activeEstructuras.length > 0 && target.banned) await client.users.unbanUser(clerkId);
          if (activeEstructuras.length === 0 && !target.banned) await client.users.banUser(clerkId);
        }

        // Actualizar estado isActive en DB
        await prisma.user.update({
          where: clerkId ? { clerkUserId: clerkId } : { id: parseInt(userId.replace('ext_', '')) },
          data: { isActive: activeEstructuras.length > 0 }
        });
     };

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

       await prisma.estructura.update({
         where: { id: estructuraId },
         data: {
           activo: activo !== undefined ? activo : undefined,
           atril: atril !== undefined ? (atril === "" ? null : parseInt(atril)) : undefined
         }
       });

       await syncUserPermissions(userId, isLocalOnly ? null : userId);
       await logActivity("Estructura Actualizada", user.id, { target: targetName });
     }

     // Acción para AÑADIR una nueva estructura
     if (action === "add-estructura") {
       const { agrupacionId, seccionId, papelId } = body;
       const dbUser = await prisma.user.findFirst({ 
         where: isLocalOnly ? { id: parseInt(userId.replace('ext_', '')) } : { clerkUserId: userId } 
       });
       
       if (!dbUser) return new NextResponse("Usuario no encontrado", { status: 404 });

       await prisma.estructura.create({
         data: {
           userId: dbUser.id,
           agrupacionId: parseInt(agrupacionId),
           seccionId: parseInt(seccionId),
           papelId: parseInt(papelId),
           activo: true
         }
       });

       await syncUserPermissions(userId, isLocalOnly ? null : userId);
       await logActivity("Nueva Estructura Añadida", user.id, { target: targetName });
     }

     // Acción para ELIMINAR una estructura
     if (action === "delete-estructura") {
       if (!estructuraId) return new NextResponse("Falta estructuraId", { status: 400 });

       await prisma.estructura.delete({
         where: { id: estructuraId }
       });

       await syncUserPermissions(userId, isLocalOnly ? null : userId);
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

     return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in user action:", err);
    return new NextResponse("Action failed", { status: 500 });
  }
}
