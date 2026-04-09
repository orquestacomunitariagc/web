import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');

  try {
    const events = await prisma.event.findMany({
      where: categoryId ? { categoryId: parseInt(categoryId) } : undefined,
      orderBy: { date: 'asc' },
      include: { category: { select: { id: true, name: true } } }
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching public events:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
