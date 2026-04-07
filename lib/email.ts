/**
 * OCGC Email Service
 * Centraliza las notificaciones del sistema.
 * Recomendado: Configurar RESEND_API_KEY en .env
 */

export async function sendInvitationEmail(to: string, name: string, code: string) {
  const registerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/registro-usuarios?code=${code}`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
      <div style="background: #0D1B2A; padding: 30px; text-align: center;">
        <img src="https://ocgc.es/wp-content/uploads/2021/05/logo-ocgc-blanco.png" alt="OCGC" width="120">
      </div>
      <div style="padding: 40px; color: #333; line-height: 1.6;">
        <h2 style="color: #0D1B2A; margin-top: 0;">¡Hola, ${name}!</h2>
        <p>Has sido invitado a formar parte del área privada de la <strong>Orquesta Comunitaria de Gran Canaria</strong>.</p>
        <p>A través de este portal podrás acceder a tus partituras, calendarios de ensayos y toda la información operativa del archivo digital.</p>
        <div style="margin: 40px 0; text-align: center;">
          <a href="${registerUrl}" style="background: #C9A84C; color: #0D1B2A; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Completar mi Ficha de Músico
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">
          Este enlace es personal y de un solo uso. Caducará automáticamente en 7 días.<br>
          Si tienes problemas con el botón, copia y pega este enlace en tu navegador:<br>
          <span style="color: #478AC9;">${registerUrl}</span>
        </p>
      </div>
      <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} Orquesta Comunitaria de Gran Canaria · Asociación sin ánimo de lucro
      </div>
    </div>
  `;

  console.log(`[Email Service] Simulación de envío a ${to}: Invitación nominativa para ${name}`);
  
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "OCGC <no-reply@ocgc.es>",
          to: [to],
          subject: "Invitación al Portal de Músicos — OCGC",
          html: html
        })
      });
      return await res.json();
    } catch (e) {
      console.error("Error enviando email con Resend:", e);
    }
  }
  
  return { success: true, simulated: true };
}

export async function sendAdminJoinNotification(data: any) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "archivo@ocgc.es";
  
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #0D1B2A;">Nueva solicitud de unión (Web)</h2>
      <p>Se ha recibido una nueva solicitud desde la sección <strong>/unete</strong>.</p>
      <hr>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Nombre:</strong> ${data.name}</li>
        <li><strong>Email:</strong> ${data.email}</li>
        <li><strong>Teléfono:</strong> ${data.phone}</li>
        <li><strong>Agrupación:</strong> ${data.group}</li>
        <li><strong>Instrumento:</strong> ${data.instrument || 'No especificado'}</li>
      </ul>
      <p><strong>Experiencia:</strong><br>${data.experience || 'Sin comentarios'}</p>
      <div style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/miembros/gestion" style="color: #478AC9; font-weight: bold;">Ver en el Panel de Gestión</a>
      </div>
    </div>
  `;

  console.log(`[Email Service] Notificando administrador: Nueva solicitud de ${data.name}`);

  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "OCGC Sistema <sistema@ocgc.es>",
          to: [adminEmail],
          subject: `Nueva Solicitud: ${data.name} (${data.group})`,
          html: html
        })
      });
    } catch (e) {
      console.error("Error notificando al admin:", e);
    }
  }
}
