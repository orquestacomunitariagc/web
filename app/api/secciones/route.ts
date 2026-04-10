import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logger";

// GET devuelve todas las secciones artísticas
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isPublic = searchParams.get("public") === "true";

  try {
    const secciones = await prisma.seccion.findMany({
      where: isPublic ? { isVisibleInPublic: true } : undefined,
      orderBy: { seccion: 'asc' }
    });
    return NextResponse.json(secciones);
  } catch (error) {
    return new NextResponse("Error loading sections", { status: 500 });
  }
}

// POST permite añadir una nueva sección artística a la estructura
export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  const { seccion, familia, isVisibleInPublic } = await req.json();

  try {
    const newSeccion = await prisma.seccion.create({
      data: { 
        seccion,
        familia: familia || "Otros",
        isVisibleInPublic: isVisibleInPublic !== undefined ? isVisibleInPublic : true
      }
    });

    await logActivity("Sección Artística Creada", clerkId, { seccion });

    return NextResponse.json(newSeccion);
  } catch (error) {
    return new NextResponse("Error creating section", { status: 500 });
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

  try {
    const deleted = await prisma.seccion.delete({
      where: { id: parseInt(idStr) }
    });

    await logActivity("Sección Artística Eliminada", clerkId, { seccion: deleted.seccion });

    return NextResponse.json(deleted);
  } catch (error) {
    return new NextResponse("Error deleting section", { status: 500 });
  }
}
export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  try {
    const { id, seccion, familia, isVisibleInPublic } = await req.json();
    if (!id) return new NextResponse("ID missing", { status: 400 });

    const updated = await prisma.seccion.update({
      where: { id: parseInt(id) },
      data: { 
        seccion,
        familia: familia !== undefined ? familia : undefined,
        isVisibleInPublic: isVisibleInPublic !== undefined ? isVisibleInPublic : undefined
      }
    });

    await logActivity("Sección Actualizada", clerkId, { id, seccion });
    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse("Error updating section", { status: 500 });
  }
}
