import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logger";

// GET devuelve el diccionario de etiquetas (instrumentos) agrupado por familia
export async function GET() {
  try {
    const instrumentos = await prisma.instrumento.findMany({
      orderBy: [
        { familia: 'asc' },
        { nombre: 'asc' }
      ]
    });
    
    // Agrupar exclusivamente los instrumentos/etiquetas para el sistema de partituras
    const grouped = instrumentos.reduce((acc: Record<string, any[]>, curr) => {
      const fam = curr.familia || "Otros";
      if (!acc[fam]) acc[fam] = [];
      acc[fam].push({ 
        id: curr.id, 
        name: curr.nombre, 
        type: 'tag' // Marcador explícito de que es una etiqueta de partitura
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

  const { name, familia } = await req.json();

  try {
    const newInstrumento = await prisma.instrumento.create({
      data: { 
        nombre: name,
        familia: familia || "Otros"
      }
    });

    await logActivity("Etiqueta Creada (Partituras)", clerkId, { 
      nombre: name, 
      familia: familia || "Otros" 
    });

    return NextResponse.json({ id: newInstrumento.id, name: newInstrumento.nombre, familia: newInstrumento.familia });
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
    const instrumento = await prisma.instrumento.findUnique({ where: { id } });
    await prisma.instrumento.delete({ where: { id } });

    await logActivity("Etiqueta Eliminada (Partituras)", clerkId, { 
      id, 
      nombre: instrumento?.nombre || "Desconocido" 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Error deleting tag", { status: 500 });
  }
}
