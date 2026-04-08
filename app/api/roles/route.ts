import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logger";

// GET devuelve las secciones agrupadas por familia para el diccionario
export async function GET() {
  const secciones = await prisma.seccion.findMany({
    orderBy: [{ familia: 'asc' }, { seccion: 'asc' }]
  });
  
  // Agrupar por familia para el frontend
  const grouped = secciones.reduce((acc: any, curr) => {
    const fam = curr.familia || "Otros";
    if (!acc[fam]) acc[fam] = [];
    acc[fam].push({ id: curr.id, name: curr.seccion });
    return acc;
  }, {});

  return NextResponse.json(grouped);
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  const isMaster = !!user?.publicMetadata?.isMaster;
  if (!isMaster) return new NextResponse("Forbidden", { status: 403 });

  const { name, familia } = await req.json();

  try {
    const newSeccion = await prisma.seccion.create({
      data: { 
        seccion: name,
        familia: familia || "Otros"
      }
    });

    await logActivity("Instrumento/Sección Añadida", clerkId, { 
      nombre: name, 
      familia: familia || "Otros" 
    });

    return NextResponse.json({ id: newSeccion.id, name: newSeccion.seccion, familia: newSeccion.familia });
  } catch (error) {
    console.error("Error creating seccion:", error);
    return new NextResponse("Error creating seccion", { status: 500 });
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
    const seccion = await prisma.seccion.findUnique({ where: { id } });
    await prisma.seccion.delete({ where: { id } });

    await logActivity("Instrumento/Sección Eliminada", clerkId, { 
      id, 
      nombre: seccion?.seccion || "Desconocido" 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Error deleting", { status: 500 });
  }
}
