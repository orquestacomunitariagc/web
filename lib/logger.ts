import prisma from "./prisma";

/**
 * Registra una acción administrativa en el log de actividad.
 * @param action - Descripción breve de la acción (ej: "Subida de Partitura")
 * @param clerkId - ID de Clerk del administrador que realiza la acción
 * @param details - Objeto con detalles adicionales (ids, nombres antiguos/nuevos, etc.)
 */
export async function logActivity(action: string, clerkId: string | null, details: any = {}) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        userClerkId: clerkId,
        details: details || {},
      },
    });
  } catch (error) {
    console.error("Error al registrar actividad en el log:", error);
    // No lanzamos el error para no bloquear la operación principal si falla el log
  }
}
