import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, group, instrument, experience } = body;

    if (!name || !email || !phone || !group) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    // 1. Guardamos en la base de datos
    const request = await prisma.joinRequest.create({
      data: {
        name,
        email,
        phone,
        group,
        instrument,
        experience,
        status: "Pendiente"
      }
    });

    // 2. Notificamos al Administrador (Asíncrono pero controlado)
    const { sendAdminJoinNotification } = await import("@/lib/email");
    try {
      await sendAdminJoinNotification({ name, email, phone, group, instrument, experience });
    } catch (e) {
      console.error("Error al notificar al administrador del nuevo unete:", e);
    }

    return NextResponse.json({ 
      success: true, 
      msg: "Tu solicitud ha sido enviada correctamente. Un administrador la revisará pronto.",
      id: request.id
    });

  } catch (error) {
    console.error("Error al procesar solicitud de unión:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
