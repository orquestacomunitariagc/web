import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { EventType } from '@prisma/client';
import { logActivity } from '@/lib/logger';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.id);

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return new NextResponse("Not found", { status: 404 });

    await prisma.event.delete({ where: { id: eventId } });

    await logActivity("Evento Cancelado/Eliminado", clerkId, { 
      id: eventId, 
      titulo: event.title,
      fecha: event.date
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.id);

  try {
    const body = await req.json();
    const { title, date, location, description, type } = body;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        date: date ? new Date(date) : undefined,
        location,
        description,
        type: type as EventType
      }
    });

    await logActivity("Evento Reprogramado/Editado", clerkId, { 
      id: eventId, 
      nuevoTitulo: updated.title,
      nuevaFecha: updated.date,
      nuevoLugar: updated.location
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating event:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
