import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Obtenemos los roles/instrumentos del usuario desde su Metadata de Clerk
  const userRoles = (user?.publicMetadata?.roles as string[]) || [];
  const isMaster = !!user?.publicMetadata?.isMaster;
  const isArchiver = !!user?.publicMetadata?.isArchiver;

  try {
    // Si eres Master o Archivero, ves TODO
    if (isMaster || isArchiver) {
      const allScores = await prisma.score.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(allScores);
    }

    // Obtenemos las estructuras reales de la DB para la validación de pares estricta
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        estructuras: {
          where: { activo: true },
          include: { seccion: true, agrupacion: true }
        }
      }
    });

    const userStructures = dbUser?.estructuras || [];
    const clerkRoles = (user?.publicMetadata?.roles as string[]) || [];

    // Traemos las partituras y el catálogo de secciones para diferenciar etiquetas
    const [allScores, seccionesDB] = await Promise.all([
      prisma.score.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.seccion.findMany({ select: { seccion: true } })
    ]);

    const predefinedSecciones = seccionesDB.map(s => s.seccion);

    const filteredScores = allScores.filter(score => {
      // 1. Documentos generales: visibles para todos
      if (score.isDocument) return true;

      // 2. Partituras sin restricciones: visibles para todos
      if (score.allowedRoles.length === 0 && score.allowedAgrupaciones.length === 0) return true;

      // 3. Validar contra las estructuras activas del usuario (Validación de Pares Estricta)
      const hasStrictMatch = userStructures.some(est => {
        // ¿La agrupación de esta estructura es una de las permitidas?
        const matchAgrupacion = score.allowedAgrupaciones.length === 0 || score.allowedAgrupaciones.includes(est.agrupacion.agrupacion);
        
        // ¿La sección de esta estructura es una de las permitidas? (Roles en partitura = Secciones en DB)
        const matchSeccion = score.allowedRoles.length === 0 || score.allowedRoles.includes(est.seccion.seccion);
        
        // El usuario solo ve la partitura si coincide AMBOS en la MISMA estructura
        return matchAgrupacion && matchSeccion;
      });

      if (hasStrictMatch) return true;

      // 4. Comprobación de seguridad para Etiquetas Especiales (como "Tutti" o "Directiva")
      // Esto permite que roles que no son "instrumentos" (ej: "Director") sigan funcionando
      const hasSpecialTag = score.allowedRoles.some(r => 
        clerkRoles.includes(r) && !predefinedSecciones.includes(r)
      );
      
      return hasSpecialTag;
    });

    return NextResponse.json(filteredScores);

    return NextResponse.json(filteredScores);
  } catch (error) {
    console.error("Error fetching scores:", error);
    return new NextResponse("Database Error", { status: 500 });
  }
}
