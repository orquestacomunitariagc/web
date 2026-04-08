import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { EventType } from '@prisma/client';
import { logActivity } from '@/lib/logger';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' }
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
    const { title, date, location, description, type } = await req.json();

    const validTypes = ['Ensayo', 'Concierto', 'Reunión'];
    if (!validTypes.includes(type)) {
      return new NextResponse("Invalid event type", { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        location,
        description,
        type: type as EventType
      }
    });

    await logActivity("Evento Programado", clerkId, { 
      titulo: title, 
      tipo: type, 
      fecha: date, 
      lugar: location || "N/A" 
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
