import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/logger';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  try {
    const invitations = await prisma.invitationCode.findMany({
      where: { usedAt: null },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.publicMetadata?.isMaster) return new NextResponse("Forbidden", { status: 403 });

  try {
    const { name, email, surname, phone, agrupacion, seccion, agrupacion2, seccion2, agrupacion3, seccion3, sendEmail } = await req.json();

    const code = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitationCode.create({
      data: {
        code,
        name,
        surname,
        phone,
        sentToEmail: email || null,
        expiresAt,
        agrupacion: agrupacion || null,
        seccion: seccion || null,
        agrupacion2: agrupacion2 || null,
        seccion2: seccion2 || null,
        agrupacion3: agrupacion3 || null,
        seccion3: seccion3 || null
      }
    });

    const actuallySent = email && name && sendEmail;

    if (actuallySent) {
      const { sendInvitationEmail } = await import("@/lib/email");
      try {
        await sendInvitationEmail(email, name, code);
      } catch (err) {
        console.error("Error enviando email invitacion:", err);
      }
    }

    await logActivity("Invitación Generada", clerkId, { 
      destinatario: `${name} ${surname || ""}`.trim(), 
      emailSent: actuallySent,
      codigo: code 
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Error creating invitation:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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

    const invitation = await prisma.invitationCode.findUnique({ where: { id } });

    await prisma.invitationCode.delete({
      where: { id }
    });

    await logActivity("Invitación Revocada", clerkId, { 
      id, 
      destinatario: `${invitation?.name || ""} ${invitation?.surname || ""}`.trim() || "Desconocido" 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
