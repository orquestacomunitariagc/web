import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding catalogs...");

  // ── Agrupaciones ──
  const agrupaciones = [
    "Orquesta",
    "Coro",
    "Ensemble Flautas",
    "Ensemble Metales",
    "Ensemble Chelos",
    "Big Band",
    "Colaboradores",
    "Invitados"
  ];
  for (const name of agrupaciones) {
    await prisma.agrupacion.upsert({
      where: { agrupacion: name },
      create: { agrupacion: name },
      update: {},
    });
  }
  console.log(`  ✓ ${agrupaciones.length} agrupaciones`);

  // ── Papeles ──
  const papeles = ["Músico", "Director", "Archivero", "Solista", "Invitado", "Colaborador"];
  for (const name of papeles) {
    await prisma.papel.upsert({
      where: { papel: name },
      create: { papel: name },
      update: {},
    });
  }
  console.log(`  ✓ ${papeles.length} papeles`);

  // ── Secciones (Instrumentos) con Familia ──
  const instrumentosDict = {
    "Cuerda": ["Violín primero", "Violín segundo", "Viola", "Violonchelo", "Contrabajo", "Arpa", "Piano", "Órgano"],
    "Viento Madera": ["Flauta", "Oboe", "Clarinete", "Fagot", "Requinto", "Contrafagot", "Saxofón"],
    "Viento Metal": ["Trompeta", "Trompa", "Trombón", "Tuba", "Bombardino"],
    "Percusión": ["Percusión"],
    "Coro": ["Soprano (coro)", "Alto (coro)", "Tenor (coro)", "Bajo (coro)", "Coach vocal"],
    "Tuttis": ["Orquesta - Tutti", "Coro - Tutti", "Ensemble Flautas - Tutti", "Ensemble Metales - Tutti", "Ensemble Chelos - Tutti", "Big Band - Tutti"],
    "Dirección": [
      "Dirección artística y musical (OCGC y Orquesta)", 
      "Dirección musical (Ensemble Flautas)", 
      "Dirección musical (Ensemble Metales)", 
      "Dirección musical (Ensemble Violonchelos)", 
      "Dirección musical (Coro)"
    ],
    "Generales": [
      "General Orquesta",
      "General Coro",
      "General Ensemble Flautas",
      "General Ensemble Metales",
      "General Ensemble Chelos",
      "General Big Band"
    ]
  };

  let seccionCount = 0;
  for (const [familia, instrumentos] of Object.entries(instrumentosDict)) {
    for (const nombre of instrumentos) {
      await prisma.seccion.upsert({
        where: { seccion: nombre },
        update: { familia: familia },
        create: { seccion: nombre, familia: familia }
      });
      seccionCount++;
    }
  }
  console.log(`  ✓ ${seccionCount} secciones sincronizadas con familias`);

  console.log("✅ Seed completado");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
