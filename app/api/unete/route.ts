import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, group, instrument, experience } = body;

    if (!name || !email || !phone || !group) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    // --- PROTECCIÓN ANTI-SPAM ---
    // 1. Honeypot check
    // @ts-ignore
    const { fax_number } = body;
    if (fax_number && fax_number.length > 0) {
      console.log("🚫 Bot detectado bloqueado por Honeypot:", { email });
      return NextResponse.json({ error: "Solicitud rechazada por sospecha de bot." }, { status: 400 });
    }

    // 2. Control anti-spam por Email (Max 1 cada 30 min)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existingRequest = await (prisma as any).joinRequest.findFirst({
      where: {
        email,
        createdAt: { gte: thirtyMinutesAgo }
      }
    });

    if (existingRequest) {
      console.log("🚫 Reintento de solicitud bloqueado por tiempo:", { email });
      return NextResponse.json({ 
        error: "Ya hemos recibido una solicitud tuya hace poco. Por favor, espera 30 minutos para enviar otra." 
      }, { status: 429 });
    }
    // ----------------------------

    if (!process.env.DATABASE_URL) {
      console.error("[CRITICAL] DATABASE_URL is not defined in environment variables.");
      return NextResponse.json({ error: "Error de configuración: Base de datos no conectada." }, { status: 500 });
    }

    // 1. Guardamos en la base de datos
    // Nota: El formulario envía 'first_name' y 'last_name' en el body
    const request = await (prisma as any).joinRequest.create({
      data: {
        name: body.first_name || body.name || "Sin nombre",
        surname: body.last_name || body.surname || "",
        email,
        phone,
        group,
        instrument,
        experience,
        status: "Pendiente"
      }
    });

    console.log("✅ Nueva solicitud guardada en DB:", { id: request.id, name: request.name, email: request.email });

    // 2. Notificamos al Administrador
    const { sendAdminJoinNotification } = await import("@/lib/email");
    try {
      await sendAdminJoinNotification({ 
        firstName: body.first_name || body.name || "Sin nombre", 
        lastName: body.last_name || body.surname || "", 
        email, 
        phone, 
        group, 
        instrument, 
        experience 
      });
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
