import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/logger';

// 🔍 Listar solicitudes (Admin Only)
export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  try {
    const requests = await (prisma as any).joinRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching join requests:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// ✍️ Actualizar estado (Admin Only)
export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  try {
    const { id, status } = await req.json();
    if (!id || !status) return new NextResponse("Missing fields", { status: 400 });

    const updated = await (prisma as any).joinRequest.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    await logActivity("Solicitud de unión Actualizada", clerkId, { 
      músico: updated.name, 
      nuevoEstado: status 
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating join request:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// 🗑️ Eliminar solicitud (Admin Only)
export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get('id');

    if (!idStr) return new NextResponse("Missing ID", { status: 400 });
    const id = parseInt(idStr);

    const request = await (prisma as any).joinRequest.findUnique({ where: { id } });

    await (prisma as any).joinRequest.delete({
      where: { id }
    });

    await logActivity("Solicitud de unión Eliminada", clerkId, { 
      id, 
      músico: request?.name || "Desconocido" 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting join request:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
