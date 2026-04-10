import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { logActivity } from "@/lib/logger";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isPublic = searchParams.get("public") === "true";

  const agrupaciones = await prisma.agrupacion.findMany({ 
    where: isPublic ? { isVisibleInPublic: true } : undefined,
    orderBy: { agrupacion: "asc" } 
  });
  return NextResponse.json(agrupaciones);
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  const { name, isVisibleInPublic } = await req.json();
  if (!name) return new NextResponse("Name missing", { status: 400 });

  try {
    const created = await prisma.agrupacion.create({
      data: { 
        agrupacion: name,
        isVisibleInPublic: isVisibleInPublic !== undefined ? isVisibleInPublic : true
      }
    });
    await logActivity("Agrupación Creada", clerkId, { name });
    return NextResponse.json(created);
  } catch (error) {
    return new NextResponse("Error creating agrupación", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("ID missing", { status: 400 });

  try {
    const deleted = await prisma.agrupacion.delete({
      where: { id: parseInt(id) }
    });
    await logActivity("Agrupación Eliminada", clerkId, { name: deleted.agrupacion });
    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Error deleting agrupación", { status: 500 });
  }
}
export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  try {
    const { id, name, isVisibleInPublic } = await req.json();
    if (!id) return new NextResponse("ID missing", { status: 400 });

    const updated = await prisma.agrupacion.update({
      where: { id: parseInt(id) },
      data: { 
        agrupacion: name,
        isVisibleInPublic: isVisibleInPublic !== undefined ? isVisibleInPublic : undefined
      }
    });

    await logActivity("Agrupación Actualizada", clerkId, { id, name });
    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse("Error updating agrupación", { status: 500 });
  }
}
