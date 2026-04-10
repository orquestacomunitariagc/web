import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logger";

// GET devuelve el diccionario de secciones agrupado por familia
export async function GET() {
  try {
    const secciones = await prisma.seccion.findMany({
      orderBy: [
        { familia: 'asc' },
        { seccion: 'asc' }
      ]
    });
    
    // Agrupar exclusivamente las secciones para el sistema de partituras (y formularios)
    const grouped = secciones.reduce((acc: Record<string, any[]>, curr) => {
      const fam = curr.familia || "Otros";
      if (!acc[fam]) acc[fam] = [];
      acc[fam].push({ 
        id: curr.id, 
        name: curr.seccion, 
        familia: curr.familia,
        type: 'tag',
        isVisible: curr.isVisibleInPublic
      });
      return acc;
    }, {});

    return NextResponse.json(grouped);
  } catch (error) {
    console.error("Error fetching dictionary tags:", error);
    return new NextResponse("Error fetching tags", { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  const isMaster = !!user?.publicMetadata?.isMaster;
  if (!isMaster) return new NextResponse("Forbidden", { status: 403 });

  const { name, familia, isVisibleInPublic } = await req.json();

  try {
    const newSeccion = await prisma.seccion.create({
      data: { 
        seccion: name,
        familia: familia || "Otros",
        isVisibleInPublic: isVisibleInPublic !== undefined ? isVisibleInPublic : true
      }
    });

    await logActivity("Sección Creada", clerkId, { 
      nombre: name, 
      familia: familia || "Otros" 
    });

    return NextResponse.json({ id: newSeccion.id, name: newSeccion.seccion, familia: newSeccion.familia, isVisibleInPublic: newSeccion.isVisibleInPublic });
  } catch (error) {
    console.error("Error creating tag:", error);
    return new NextResponse("Error creating tag", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const idStr = searchParams.get("id");

  if (!idStr) return new NextResponse("ID Missing", { status: 400 });
  const id = parseInt(idStr);

  try {
    const seccionDB = await prisma.seccion.findUnique({ where: { id } });
    await prisma.seccion.delete({ where: { id } });

    await logActivity("Sección Eliminada", clerkId, { 
      id, 
      nombre: seccionDB?.seccion || "Desconocida" 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Error deleting tag", { status: 500 });
  }
}
