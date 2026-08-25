import nodemailer from "nodemailer";
import { config } from "../config/config.js";

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.mailHost,
      port: config.mailPort,
      secure: config.mailPort === 465, // Use SSL/TLS for port 465
      auth: {
        user: config.mailUser,
        pass: config.mailPass,
      },
    });
  }

  async sendTicketConfirmation(toEmail, ticket, event) {
    const mailOptions = {
      from: config.mailFrom,
      to: toEmail,
      subject: `Confirmación de Inscripción: ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">¡Inscripción Confirmada!</h2>
          <p>Hola,</p>
          <p>Tu inscripción para el evento <strong>${event.title}</strong> ha sido procesada con éxito.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #4CAF50;">
            <p style="margin: 5px 0;"><strong>Código de Reserva:</strong> <code style="background: #eef; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${ticket.reservationCode}</code></p>
            <p style="margin: 5px 0;"><strong>Cantidad de Entradas:</strong> ${ticket.quantity}</p>
            <p style="margin: 5px 0;"><strong>Fecha del Evento:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Lugar:</strong> ${event.location}</p>
          </div>
          
          <p>¡Disfrutá del evento!</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">Este es un correo automático heredado del Sistema de Eventos, por favor no respondas a este mensaje.</p>
        </div>
      `,
    };

    try {
      // Si no están configuradas las credenciales o son placeholders por defecto, simulamos el envío para no romper los flujos
      const isPlaceholder = 
        !config.mailUser || 
        !config.mailPass || 
        config.mailUser.includes("test@") || 
        config.mailUser.includes("tu_email@") ||
        config.mailPass === "tu_app_password" ||
        config.mailPass === "fake_pass_123";

      if (isPlaceholder) {
        console.log(`[Mail Mock] Simulación de correo de confirmación enviado a ${toEmail} para el evento "${event.title}"`);
        return { message: "Simulated mail success" };
      }

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("[Mail Error] Error al enviar el email de confirmación:", error.message);
      // Retornar error estructurado pero no arrojar excepción para que la inscripción
      // en base de datos no se revierta si el SMTP falla.
      return { error: error.message };
    }
  }
}

export const mailService = new MailService();
