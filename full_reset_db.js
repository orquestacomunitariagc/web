const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DATOS_PREDETERMINADOS = {
  agrupaciones: [
    "Orquesta Comunitaria Gran Canaria",
    "Coro Comunitario Gran Canaria",
    "Ensemble de Flautas",
    "Ensemble de Metales",
    "Ensemble de Chelos",
    "OCGC Big Band"
  ],
  papeles: ["Músico", "Director", "Archivero", "Solista"],
  instrumentos: {
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
      "General Orquesta",
      "General Coro",
      "General Ensemble Flautas",
      "General Ensemble Metales",
      "General Ensemble Chelos",
      "General Big Band"
    ]
  }
};

async function main() {
  console.log("⚠️  BORRANDO TODO EL CONTENIDO DE LA BASE DE DATOS...");

  // Borrar en orden para respetar claves foráneas
  await prisma.estructura.deleteMany({});
  await prisma.matricula.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.residencia.deleteMany({});
  await prisma.empleo.deleteMany({});
  await prisma.score.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.seccion.deleteMany({});
  await prisma.agrupacion.deleteMany({});
  await prisma.papel.deleteMany({});
  await prisma.systemConfig.deleteMany({});

  console.log("✅ Base de datos vacía.");

  console.log("🌱 POBLANDO TABLAS CON DATOS PREDETERMINADOS...");

  // 1. Agrupaciones
  for (const ag of DATOS_PREDETERMINADOS.agrupaciones) {
    await prisma.agrupacion.create({ data: { agrupacion: ag } });
  }
  console.log("- Agrupaciones creadas.");

  // 2. Papeles
  for (const p of DATOS_PREDETERMINADOS.papeles) {
    await prisma.papel.create({ data: { papel: p } });
  }
  console.log("- Papeles creados.");

  // 3. Instrumentos (Secciones) con Familia
  for (const [familia, nombres] of Object.entries(DATOS_PREDETERMINADOS.instrumentos)) {
    for (const nombre of nombres) {
      await prisma.seccion.create({
        data: { seccion: nombre, familia: familia }
      });
    }
  }
  console.log("- Instrumentos y familias creados.");

  console.log("\n✨ PROCESO COMPLETADO: Base de Datos Limpia y Configurada ✨");
}

main()
  .catch(e => {
    console.error("❌ ERROR CRÍTICO DURANTE EL RESET:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
