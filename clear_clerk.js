/**
 * SCRIPT DE LIMPIEZA MASIVA DE CLERK
 * Elimina todos los usuarios de la plataforma Clerk.
 * USO: node clear_clerk.js
 */
const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// ESCRIBE AQUÍ LOS USERNAMES (O DNIS) QUE NO QUIERES BORRAR
const EXCLUDED_USERNAMES = ['admin'];

async function clearAllUsers() {
  console.log("⚠️ PREPARANDO ELIMINACIÓN MASIVA EN CLERK...");
  
  try {
    let hasMore = true;
    let totalDeleted = 0;

    while (hasMore) {
      // Obtenemos una lista de usuarios
      const users = await clerk.users.getUserList({
        limit: 100,
      });

      if (users.data.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`🧹 Eliminando lote de ${users.data.length} usuarios...`);

      for (const user of users.data) {
        try {
          if (user.username && EXCLUDED_USERNAMES.includes(user.username)) {
            console.log(`🛡️ Saltando usuario protegido: ${user.username}`);
            continue;
          }

          // 1. Eliminar de Clerk
          await clerk.users.deleteUser(user.id);
          
          // 2. Desvincular de la base de datos local (Prisma)
          // NO borramos al usuario ni su historial, solo quitamos la vinculación con Clerk
          await prisma.user.updateMany({
            where: { clerkUserId: user.id },
            data: { clerkUserId: null }
          });

          console.log(`🗑️ Eliminado de Clerk y Desvinculado en DB: ${user.username || user.id}`);
          totalDeleted++;
        } catch (e) {
          console.error(`Fallo al borrar ${user.id}: ${e.message}`);
        }
      }

      // Evitar bucle infinito si por alguna razón siguen apareciendo
      if (users.data.length < 5) hasMore = false; 
      
      // Clerk API rate limits: añadimos un pequeño respiro
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n✅ Limpieza completada. Se han eliminado ${totalDeleted} usuarios de Clerk.`);

  } catch (error) {
    console.error("❌ Error durante la limpieza:", error.message);
  }
}

console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
console.log("ESTÁS A PUNTO DE BORRAR TODOS LOS USUARIOS DE CLERK.");
console.log("Tienes 5 segundos para cancelar (Ctrl+C)...");
console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

setTimeout(() => {
  clearAllUsers()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
}, 5000);
