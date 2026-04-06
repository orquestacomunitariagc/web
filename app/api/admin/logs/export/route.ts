import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const header = "ID,Fecha,Acción,UsuarioMetadata,DNI,Detalles(Estructurado)\n";
    const csvContent = logs.map(l => {
      // Extraemos la info resumida si el details es JSON
      const d = l.details as any;
      const detailsStr = typeof d === 'object' ? JSON.stringify(d).replace(/"/g, '""') : (l.details || '').replace(/"/g, '""');
      return `${l.id},"${new Date(l.createdAt).toLocaleString()}","${l.action}","${l.userClerkId}","${detailsStr}"`;
    }).join('\n');

    return new NextResponse(header + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=logs_auditoria_ocgc_${new Date().toISOString().split('T')[0]}.csv`
      }
    });

  } catch (error) {
    console.error("Error exporting logs:", error);
    return new NextResponse("Error en el servidor", { status: 500 });
  }
}
