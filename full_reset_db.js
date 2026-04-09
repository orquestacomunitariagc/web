const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DATOS_PREDETERMINADOS = {
  agrupaciones: [
    "Orquesta",
    "Coro",
    "Ensemble de Flautas",
    "Ensemble de Metales",
    "Ensemble de Chelos",
    "Big Band",
    "Invitados",
    "Colaboradores",
    "Empresa Externa"
  ],
  papeles: ["Músico", "Director", "Archivero", "Invitado", "Colaborador", "Empresa Externa"],
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
  },
  secciones: [
    "Alto (coro)", "Bajo (coro)", "Dirección musical (Coro)", "Soprano (coro)", "Tenor (coro)",
    "Violonchelo", "Dirección musical (Ensemble Flautas)", "Flauta", "Bombardino", "Percusión",
    "Trombón", "Trompa", "Trompeta", "Tuba", "Arpa", "Clarinete", "Contrabajo", 
    "Dirección artística y musical (OCGC y Orquesta)", "Fagot", "Oboe", "Órgano", "Piano", 
    "Viola", "Violín primero", "Violín segundo", "Invitados", "Dirección musical (Ensemble Metales)",
    "Colaboradores", "Productora Pedro Ruiz", "Técnico Sonido", "Transportes", "Rider Service",
    "LF Sound", "Solista", "Técnico Sala"
  ]
};

async function main() {
  console.log("⚠️  BORRANDO TODO EL CONTENIDO DE LA BASE DE DATOS...");

  // Borrar en orden para respetar claves foráneas
  await prisma.estructura.deleteMany({});
  await prisma.matricula.deleteMany({});
  //await prisma.user.deleteMany({});
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
    const isPublic = !["Invitados", "Colaboradores", "Empresa Externa"].includes(ag);
    await prisma.agrupacion.create({ data: { agrupacion: ag, isVisibleInPublic: isPublic } });
  }
  console.log("- Agrupaciones creadas.");

  // 2. Papeles
  for (const p of DATOS_PREDETERMINADOS.papeles) {
    const isPublic = !["Director", "Archivero", "Invitado", "Colaborador", "Empresa Externa"].includes(p);
    const isDirector = p === "Director";
    await prisma.papel.create({ data: { papel: p, isVisibleInPublic: isPublic, isDirector } });
  }
  console.log("- Papeles creados.");

  // 3. Secciones Artísticas (Estructura y Etiquetas fusionados)
  for (const [familia, nombres] of Object.entries(DATOS_PREDETERMINADOS.instrumentos)) {
    const isPublic = !["Dirección", "Generales", "Tuttis"].includes(familia); // Ocultar familias internas
    for (const nombre of nombres) {
      await prisma.seccion.create({
        data: { seccion: nombre, familia, isVisibleInPublic: isPublic }
      });
    }
  }

  // Secciones extra que no estaban en el diccionario anterior
  const seccionesExtra = DATOS_PREDETERMINADOS.secciones.filter(
    s => !Object.values(DATOS_PREDETERMINADOS.instrumentos).flat().includes(s)
  );
  for (const s of seccionesExtra) {
    await prisma.seccion.create({
      data: { seccion: s, familia: "Otros", isVisibleInPublic: false }
    });
  }
  console.log("- Secciones artísticas (con familias) creadas.");
  
  // 4. Habilitar RLS en todas las tablas (Mandatorio por política OCGC)
  console.log("🔒 ACTIVANDO ROW LEVEL SECURITY (RLS)...");
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ 
      DECLARE 
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
          LOOP
              EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
              EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' FORCE ROW LEVEL SECURITY;';
          END LOOP;
      END $$;
    `);
    console.log("✅ RLS habilitado en todas las tablas.");
  } catch (rlsError) {
    console.warn("⚠️ Advertencia: No se pudo habilitar RLS (¿Es una base de datos local no-Postgres?):", rlsError.message);
  }

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
