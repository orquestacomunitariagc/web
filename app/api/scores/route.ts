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

    // Obtenemos los roles y agrupaciones reales desde la DB para mayor precision
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        estructuras: {
          include: { seccion: true, agrupacion: true }
        }
      }
    });

    const dbRoles = dbUser?.estructuras.map(e => e.seccion.seccion) || [];
    const dbAgrupaciones = dbUser?.estructuras.map(e => e.agrupacion.agrupacion) || [];

    const effectiveRoles = [...new Set([...userRoles, ...dbRoles])];
    const effectiveAgrupaciones = [...new Set([...dbAgrupaciones])];

    // Para directores o roles especiales, damos acceso a todos los de esa agrupación
    const isDirectorOrquesta = effectiveRoles.some(r => r.includes("Orquesta") && r.toLowerCase().includes("direcci"));
    if (isDirectorOrquesta && !effectiveAgrupaciones.includes("Orquesta")) effectiveAgrupaciones.push("Orquesta");
    // (A futuro se pueden mapear mas directores)

    const filteredScores = await prisma.score.findMany({
      where: {
        OR: [
          { isDocument: true },
          { allowedRoles: { isEmpty: true }, allowedAgrupaciones: { isEmpty: true } },
          {
             AND: [
               { allowedRoles: { hasSome: effectiveRoles } },
               { allowedAgrupaciones: { hasSome: effectiveAgrupaciones } }
             ]
          }
        ]
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(filteredScores);
  } catch (error) {
    console.error("Error fetching scores:", error);
    return new NextResponse("Database Error", { status: 500 });
  }
}
