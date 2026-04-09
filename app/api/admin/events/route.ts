import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { EventType } from '@prisma/client';
import { logActivity } from '@/lib/logger';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster && !user?.publicMetadata?.isArchiver)
    return new NextResponse("Forbidden", { status: 403 });

  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
      include: { category: { select: { id: true, name: true } } }
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  try {
    const body = await req.json();

    // Soporte de importación en lote (array)
    if (Array.isArray(body)) {
      const VALID_TYPES = ['Ensayo', 'Concierto', 'Reunión'];
      const created = await Promise.all(
        body.map(async (ev: any) => {
          const type = VALID_TYPES.includes(ev.type) ? ev.type : 'Ensayo';
          return prisma.event.create({
            data: {
              title: ev.title || 'Sin título',
              date: new Date(ev.date),
              location: ev.location || null,
              description: ev.description || null,
              type: type as EventType,
              categoryId: ev.categoryId ? parseInt(ev.categoryId) : null,
            }
          });
        })
      );
      await logActivity("Importación de Eventos", clerkId, { count: created.length });
      return NextResponse.json({ imported: created.length });
    }

    // Creación individual
    const { title, date, location, description, type, categoryId } = body;
    const VALID_TYPES = ['Ensayo', 'Concierto', 'Reunión'];
    if (!VALID_TYPES.includes(type)) return new NextResponse("Invalid event type", { status: 400 });

    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        location: location || null,
        description: description || null,
        type: type as EventType,
        categoryId: categoryId ? parseInt(categoryId) : null,
      },
      include: { category: { select: { id: true, name: true } } }
    });

    await logActivity("Evento Programado", clerkId, {
      titulo: title, tipo: type, fecha: date, lugar: location || "N/A"
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
