import { createClerkClient } from "@clerk/nextjs/server";
import prisma from "./prisma";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * Sincroniza los metadatos de un usuario en Clerk basándose en su estado en la DB local.
 * Genera roles jerárquicos, etiquetas de agrupación y gestiona bans.
 */
export async function syncUserWithClerk(dbUserId: number) {
  const user = await prisma.user.findUnique({
    where: { id: dbUserId },
    include: {
      estructuras: {
        where: { activo: true },
        include: { agrupacion: true, seccion: true, papel: true }
      }
    }
  });

  if (!user || !user.clerkUserId) return null;

  const clerkId = user.clerkUserId;
  const activeStructures = user.estructuras;
  
  const combinedRoles = new Set<string>();
  const activeAgrupaciones = new Set<string>();
  let hasDirectorRole = false;

  activeStructures.forEach(s => {
    const agrup = s.agrupacion.agrupacion.trim();
    const secc = s.seccion.seccion.trim();
    const papel = s.papel.papel.trim();

    // 1. Etiqueta de Sección simple (Permitir acceso general por instrumento)
    combinedRoles.add(secc);
    
    // 2. Etiqueta de Papel (Permitir acceso por rango/jerarquía)
    combinedRoles.add(papel);

    // 3. Combinación Agrupación:Sección (Permiso específico multicapa)
    combinedRoles.add(`${agrup}:${secc}`);

    // 4. Etiqueta de Agrupación (Acceso a todo lo de un grupo)
    combinedRoles.add(`Agrupación:${agrup}`);
    activeAgrupaciones.add(agrup);

    // 5. Comodines "Tutti" para compatibilidad (usados en la lógica de las tarjetas)
    if (agrup === "Orquesta Comunitaria Gran Canaria") combinedRoles.add("Orquesta - Tutti");
    if (agrup === "Coro Comunitario Gran Canaria") combinedRoles.add("Coro - Tutti");
    if (agrup === "Ensemble de Flautas") combinedRoles.add("Ensemble Flautas - Tutti");
    if (agrup === "Ensemble de Metales") combinedRoles.add("Ensemble Metales - Tutti");
    if (agrup === "Ensemble de Chelos") combinedRoles.add("Ensemble Chelos - Tutti");
    if (agrup === "OCGC Big Band") combinedRoles.add("Big Band - Tutti");

    // 6. Detección de Director/Jefe
    if (papel.toLowerCase().includes("director") || papel.toLowerCase().includes("jefe")) {
        hasDirectorRole = true;
    }
  });

  // Mantener los flags de Master y Archiver si el usuario ya los tiene 
  // (estos no se calculan solo por estructuras artísticas, sino por asignación directa)
  const clerkUser = await (await clerkClient).users.getUser(clerkId);
  const currentMetadata = clerkUser.publicMetadata || {};

  const newMetadata = {
    ...currentMetadata,
    roles: Array.from(combinedRoles),
    agrupaciones: Array.from(activeAgrupaciones),
    isDirector: hasDirectorRole
  };

  // Sincronizar en Clerk
  await (await clerkClient).users.updateUserMetadata(clerkId, {
    publicMetadata: newMetadata
  });

  // Gestión de Ban: Si no tiene ninguna estructura activa, el usuario no debería poder entrar
  // (A menos que sea Master/Archiver/Especial)
  const isSpecialUser = currentMetadata.isMaster || currentMetadata.isArchiver;
  
  if (activeStructures.length > 0 || isSpecialUser) {
    try { await (await clerkClient).users.unbanUser(clerkId); } catch(e){}
  } else {
    try { await (await clerkClient).users.banUser(clerkId); } catch(e){}
  }

  return newMetadata;
}
