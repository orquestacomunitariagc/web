import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding catalogs...");

  // ── Agrupaciones ──
  const agrupaciones = [
    "Orquesta", "Coro", "Ensemble Flautas", "Ensemble Metales", "Ensemble Chelos", "Big Band",
    "Colaboradores", "Invitados", "Empresa Externa"
  ];
  for (const name of agrupaciones) {
    const isPublic = !["Colaboradores", "Invitados", "Empresa Externa"].includes(name);
    await prisma.agrupacion.upsert({
      where: { agrupacion: name },
      create: { agrupacion: name, isVisibleInPublic: isPublic },
      update: { isVisibleInPublic: isPublic },
    });
  }
  console.log(`  ✓ ${agrupaciones.length} agrupaciones`);

  // ── Papeles ──
  const papeles = ["Músico", "Director", "Archivero", "Solista", "Invitado", "Colaborador", "Empresa Externa"];
  for (const name of papeles) {
    const isPublic = !["Director", "Archivero", "Invitado", "Colaborador", "Empresa Externa"].includes(name);
    const isDirector = name === "Director";
    await prisma.papel.upsert({
      where: { papel: name },
      create: { papel: name, isVisibleInPublic: isPublic, isDirector },
      update: { isVisibleInPublic: isPublic, isDirector },
    });
  }
  console.log(`  ✓ ${papeles.length} papeles`);

  // ── Secciones (Estructura y Etiquetas) ──
  const instrumentosDict: Record<string, string[]> = {
    "Cuerda": ["Violín primero", "Violín segundo", "Viola", "Violonchelo", "Contrabajo", "Arpa", "Piano"],
    "Viento Madera": ["Flauta", "Oboe", "Clarinete", "Fagot"],
    "Viento Metal": ["Trompeta", "Trompa", "Trombón", "Tuba", "Bombardino"],
    "Coro": ["Soprano (coro)", "Alto (coro)", "Tenor (coro)", "Bajo (coro)"],
    "Tuttis": ["Orquesta - Tutti", "Coro - Tutti", "Ensemble Flautas - Tutti", "Ensemble Metales - Tutti", "Ensemble Chelos - Tutti", "Big Band - Tutti"],
    "Dirección": [
      "Dirección artística y musical (OCGC y Orquesta)", 
      "Dirección musical (Ensemble Flautas)", 
      "Dirección musical (Ensemble Metales)", 
      "Dirección musical (Ensemble Violonchelos)", 
      "Dirección musical (Coro)"
    ],
    "Generales": [
      "General Orquesta", "General Coro", "General Ensemble Flautas", "General Ensemble Metales", "General Ensemble Chelos", "General Big Band"
    ],
    "Otros": ["Invitados", "Colaboradores", "Productora Pedro Ruiz", "Técnico Sonido", "Transportes", "Rider Service", "LF Sound", "Solista", "Técnico Sala"]
  };

  let seccionCount = 0;
  for (const [familia, nombres] of Object.entries(instrumentosDict)) {
    const isPublic = !["Dirección", "Generales", "Tuttis", "Otros"].includes(familia);
    for (const nombre of nombres) {
      await prisma.seccion.upsert({
        where: { seccion: nombre },
        update: { familia: familia, isVisibleInPublic: isPublic },
        create: { seccion: nombre, familia: familia, isVisibleInPublic: isPublic }
      });
      seccionCount++;
    }
  }
  console.log(`  ✓ ${seccionCount} secciones fusionadas`);

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
