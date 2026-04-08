import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logger";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  const isArchiver = !!user?.publicMetadata?.isArchiver || !!user?.publicMetadata?.isMaster;
  if (!isArchiver) return new NextResponse("Forbidden", { status: 403 });

  const resolvedParams = await params;
  const scoreId = parseInt(resolvedParams.id);

  try {
    // Obtener info antes de borrar para el log
    const score = await prisma.score.findUnique({ where: { id: scoreId } });
    
    await prisma.score.delete({
      where: { id: scoreId }
    });

    await logActivity("Partitura Eliminada", clerkId, { 
      id: scoreId, 
      titulo: score?.title || "Desconocido" 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error Prisma DELETE score:", error);
    return new NextResponse("Error deleting score", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  const isArchiver = !!user?.publicMetadata?.isArchiver || !!user?.publicMetadata?.isMaster;
  if (!isArchiver) return new NextResponse("Forbidden", { status: 403 });

  const body = await req.json();
  const { title, categoryId, allowedRoles, isDocument } = body;
  
  const resolvedParams = await params;
  const scoreId = parseInt(resolvedParams.id);

  try {
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isDocument !== undefined) updateData.isDocument = isDocument;
    if (allowedRoles !== undefined) updateData.allowedRoles = allowedRoles;

    const updated = await prisma.score.update({
      where: { id: scoreId },
      data: updateData,
      include: { category: true }
    });

    await logActivity("Partitura Editada", clerkId, { 
      id: scoreId, 
      nuevoTitulo: updated.title,
      programa: updated.category?.name || "Sin programa"
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error Prisma PATCH score:", error);
    return new NextResponse("Error updating score", { status: 500 });
  }
}
