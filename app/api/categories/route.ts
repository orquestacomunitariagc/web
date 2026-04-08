import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logger";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  const isMaster = !!user?.publicMetadata?.isMaster;
  if (!isMaster) return new NextResponse("Forbidden", { status: 403 });

  const { name, eventDate } = await req.json();

  const newCategory = await prisma.category.create({
    data: { 
      name,
      eventDate: eventDate ? new Date(eventDate) : null
    }
  });

  await logActivity("Programa Creado", clerkId, { 
    nombre: name, 
    fecha: eventDate || "Sin fecha" 
  });

  return NextResponse.json(newCategory);
}
