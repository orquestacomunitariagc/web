import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/auth/validate-invite
// Verifica si un código de invitación es válido (existe, no ha caducado y no ha sido usado)
export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) return new NextResponse(JSON.stringify({ error: "No se proporcionó el código" }), { status: 400 });

    const invitation = await prisma.invitationCode.findUnique({
      where: { code }
    });

    if (!invitation) {
      return new NextResponse(JSON.stringify({ error: "Código inválido o no encontrado" }), { status: 404 });
    }

    if (invitation.usedAt) {
      return new NextResponse(JSON.stringify({ error: "Este código ya ha sido utilizado" }), { status: 410 });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return new NextResponse(JSON.stringify({ error: "Este código ha caducado (7 días transcurridos)" }), { status: 410 });
    }

    return NextResponse.json({ 
      success: true,
      name: invitation.name || '',
      email: invitation.sentToEmail,
      surname: invitation.surname || '',
      phone: invitation.phone || '',
      agrupacion: invitation.agrupacion,
      seccion: invitation.seccion,
      agrupacion2: invitation.agrupacion2,
      seccion2: invitation.seccion2,
      agrupacion3: invitation.agrupacion3,
      seccion3: invitation.seccion3,
      birthDate: invitation.birthDate,
      isla: invitation.isla,
      hasCertificate: invitation.hasCertificate
    });
  } catch (error) {
    console.error("Error validando código:", error);
    return new NextResponse(JSON.stringify({ error: "Error interno del servidor" }), { status: 500 });
  }
}
