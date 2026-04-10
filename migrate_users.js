/**
 * SCRIPT DE MIGRACIÓN OCGC
 * Ejecución: node migrate_users.js
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Función para pausar la ejecución
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function migrate() {
  console.log("🚀 Iniciando migración de usuarios...");

  // 1. Cargar el CSV
  const csvPath = path.join(__dirname, 'csv', 'tabla_all_data.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`📦 Se han cargado ${records.length} registros del CSV.`);

  // 2. Pre-cargar catálogos para evitar miles de consultas a la DB
  const [agrupaciones, secciones, papeles] = await Promise.all([
    prisma.agrupacion.findMany(),
    prisma.seccion.findMany(),
    prisma.papel.findMany()
  ]);

  const findId = (list, key, value) => {
    const item = list.find(i => i[key].toLowerCase() === value.toLowerCase());
    return item ? item.id : null;
  };

  // 3. Agrupar registros por DNI (Filtrando solo por "Orquesta")
  const usersMap = new Map();
  for (const r of records) {
    // FILTROS: Solo "Orquesta" y solo registros "Activos"
    const isActive = r.activo?.toLowerCase() === 'true' || r.activo === '1';
    if (r.agrupacion?.trim() !== 'Orquesta' || !isActive) continue;

    if (!usersMap.has(r.dni)) {
      usersMap.set(r.dni, {
        data: r,
        estructuras: []
      });
    }
    usersMap.get(r.dni).estructuras.push({
      papel: r.papel,
      agrupacion: r.agrupacion,
      seccion: r.seccion,
      activo: r.activo?.toLowerCase() === 'true' || r.activo === '1',
      atril: r.atril ? parseInt(r.atril) : null
    });
  }

  console.log(`👤 Detectados ${usersMap.size} usuarios únicos para "Orquesta".`);

  // 4. Procesar cada usuario
  let count = 0;
  for (const [dni, bundle] of usersMap) {
    const r = bundle.data;
    count++;

    // Pausa para evitar Rate Limit de Clerk (Forbidden)
    if (r.email) await sleep(2000); 

    try {
      let clerkId = null;

      // --- A. GESTIÓN CLERK ---
      if (r.email) {
        try {
          const email = r.email.toLowerCase().trim();
          const username = r.dni.toLowerCase().trim();

          // Intentamos buscar si ya existe para no duplicar
          const clerkList = await clerk.users.getUserList({ emailAddress: [email] });
          if (clerkList.data.length > 0) {
            clerkId = clerkList.data[0].id;
            console.log(`[${count}] Usuario Clerk existe: ${email}`);
          } else {
            // Crear nuevo usuario en Clerk
            const newUser = await clerk.users.createUser({
              emailAddress: [email],
              username: username, 
              password: r.dni, 
              firstName: r.name,
              lastName: r.surname,
              skipPasswordChecks: true,
            });
            clerkId = newUser.id;
            console.log(`[${count}] Creado en Clerk: ${email}`);
          }
        } catch (e) {
          const clerkError = e.errors ? e.errors[0]?.longMessage : e.message;
          console.error(`⚠️ Aviso Clerk para ${r.email}: ${clerkError} (Se creará solo en DB local)`);
          // No lanzamos error para que el proceso siga con Prisma
        }
      }

      // --- B. GESTIÓN PRISMA (DB Local) ---
      
      // Upsert de Residencia
      const residencia = await prisma.residencia.upsert({
        where: { isla_municipio_empadronamiento: { 
          isla: r.isla || "No especificada", 
          municipio: r.municipio || "No especificado", 
          empadronamiento: r.empadronamiento || "No especificado" 
        }},
        update: {},
        create: {
          isla: r.isla || "No especificada",
          municipio: r.municipio || "No especificado",
          empadronamiento: r.empadronamiento || "No especificado"
        }
      });

      // Upsert de Empleo
      const empleo = await prisma.empleo.upsert({
        where: { trabajo_estudios: { 
          trabajo: r.trabajo || "No especificado", 
          estudios: r.estudios || "No especificado" 
        }},
        update: {},
        create: {
          trabajo: r.trabajo || "No especificado",
          estudios: r.estudios || "No especificado"
        }
      });

      // Crear o Actualizar Usuario
      const user = await prisma.user.upsert({
        where: { dni: r.dni },
        update: {
          clerkUserId: clerkId,
          email: r.email || null,
          phone: r.phone || null,
          birthDate: r.birth_date || null,
          residenciaId: residencia.id,
          empleoId: empleo.id
        },
        create: {
          name: r.name,
          surname: r.surname,
          dni: r.dni, // Mantiene mayúsculas originales del CSV
          email: r.email || null,
          clerkUserId: clerkId,
          phone: r.phone || null,
          birthDate: r.birth_date || null,
          residenciaId: residencia.id,
          empleoId: empleo.id,
          isActive: r.activo?.toLowerCase() === 'true' || r.activo === '1',
        }
      });

      // Gestionar Matrícula si existe
      if (r.matricula_number) {
        await prisma.matricula.upsert({
          where: { matriculaNumber: r.matricula_number },
          update: { userId: user.id },
          create: { matriculaNumber: r.matricula_number, userId: user.id }
        });
      }

      // --- C. ESTRUCTURA (Agrupaciones/Secciones) ---
      for (const est of bundle.estructuras) {
        const pId = findId(papeles, 'papel', est.papel);
        const aId = findId(agrupaciones, 'agrupacion', est.agrupacion);
        const sId = findId(secciones, 'seccion', est.seccion);

        if (pId && aId && sId) {
          await prisma.estructura.upsert({
            where: {
              userId_papelId_agrupacionId_seccionId: {
                userId: user.id,
                papelId: pId,
                agrupacionId: aId,
                seccionId: sId
              }
            },
            update: {
              activo: est.activo,
              atril: est.atril
            },
            create: {
              userId: user.id,
              papelId: pId,
              agrupacionId: aId,
              seccionId: sId,
              activo: est.activo,
              atril: est.atril
            }
          });
        } else {
          console.warn(`⚠️ Saltando estructura para ${dni}: No se encontró ID para [${est.papel}, ${est.agrupacion}, ${est.seccion}]`);
        }
      }

      // --- D. SINCRONIZAR METADATA CLERK (SISTEMA MULTICAPA) ---
      if (clerkId) {
        // Obtenemos todas las estructuras activas del usuario
        const activeStructures = await prisma.estructura.findMany({
          where: { userId: user.id, activo: true },
          include: { agrupacion: true, seccion: true, papel: true }
        });

        // Construimos el set de etiquetas combinadas para permisos
        const combinedRoles = new Set();
        
        activeStructures.forEach(s => {
          const agrup = s.agrupacion.agrupacion.trim();
          const secc = s.seccion.seccion.trim();
          const papel = s.papel.papel.trim();

          // 1. Etiqueta de Sección simple (Permitir acceso general por instrumento)
          combinedRoles.add(secc);
          
          // 2. Etiqueta de Papel (Permitir acceso por rango)
          combinedRoles.add(papel);

          // 3. Combinación Agrupación:Sección (Permiso específico multicapa)
          combinedRoles.add(`${agrup}:${secc}`);

          // 4. Etiqueta de Agrupación (Acceso a todo lo de un grupo)
          combinedRoles.add(`Agrupación:${agrup}`);
        });

        const metadata = {
          roles: [...combinedRoles], // Todas las etiquetas combinadas
          agrupaciones: [...new Set(activeStructures.map(s => s.agrupacion.agrupacion))],
          isDirector: activeStructures.some(s => s.papel.isDirector)
        };

        await clerk.users.updateUser(clerkId, {
          publicMetadata: metadata
        });
        console.log(`🔑 Permisos Multicapa Sincronizados para ${user.dni}: [${metadata.roles.length} etiquetas]`);
      }

    } catch (error) {
      console.error(`⛔ Fallo crítico procesando usuario ${dni}:`, error);
    }
  }

  console.log("✅ Migración finalizada con éxito.");
}

migrate()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
