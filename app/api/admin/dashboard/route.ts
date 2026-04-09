import { NextResponse } from 'next/server';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  try {
    const totalUsers = await prisma.user.count();
    const totalScores = await prisma.score.count();
    const totalEvents = await prisma.event.count();

    const clerk = await clerkClient();
    const clerkUsersResponse = await clerk.users.getUserList();
    const clerkUsers = clerkUsersResponse.data;
    
    // Contamos usuarios Clerk baneados localmente
    const totalBanned = clerkUsers.filter(u => u.publicMetadata?.isBanned).length;

    // Contar usuarios por agrupación y desglosar por sección
    const agrupaciones = await prisma.agrupacion.findMany({
      include: {
        estructuras: {
          include: {
            seccion: true
          }
        }
      }
    });

    const statsArray = agrupaciones.map(a => {
      const sectionCounts: Record<string, number> = {};
      a.estructuras.forEach(e => {
        const secName = e.seccion?.seccion || "Otro";
        sectionCounts[secName] = (sectionCounts[secName] || 0) + 1;
      });

      return {
        name: a.agrupacion,
        count: a.estructuras.length,
        sections: Object.entries(sectionCounts).map(([name, count]) => ({ name, count }))
      };
    });

    return NextResponse.json({
      totalUsers,
      totalScores,
      totalEvents,
      totalBanned,
      agrupacionesStats: statsArray,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
