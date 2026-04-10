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

    // Traemos las partituras (luego filtramos por pares en JS para máxima exactitud)
    const allScores = await prisma.score.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });

    const filteredScores = allScores.filter(score => {
      // 1. Documentos generales: Todos ven
      if (score.isDocument) return true;

      // 2. Sin restricciones: Todos ven
      if (score.allowedRoles.length === 0 && score.allowedAgrupaciones.length === 0) return true;

      // 3. Validación de Pares Estrictos:
      // El usuario debe tener AL MENOS UNA estructura que coincida con los requisitos de la partitura
      return userStructures.some(est => {
        const matchAgrupacion = score.allowedAgrupaciones.length === 0 || score.allowedAgrupaciones.includes(est.agrupacion.agrupacion);
        const matchSeccion = score.allowedRoles.length === 0 || score.allowedRoles.includes(est.seccion.seccion);
        
        return matchAgrupacion && matchSeccion;
      });
    });

    return NextResponse.json(filteredScores);

    return NextResponse.json(filteredScores);
  } catch (error) {
    console.error("Error fetching scores:", error);
    return new NextResponse("Database Error", { status: 500 });
  }
}
