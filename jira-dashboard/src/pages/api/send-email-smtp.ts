import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { to, subject, body, isHtml } = await request.json();

    if (!to || !subject || !body) {
      return new Response(JSON.stringify({ 
        error: 'Faltan campos requeridos: to, subject, body' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return new Response(JSON.stringify({ 
        error: 'Configuración de email no encontrada en variables de entorno' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Configuración específica para Office 365 / Microsoft Online
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.office365.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
    });

    // Verificar la conexión SMTP
    await transporter.verify();

    // Configurar el correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      [isHtml ? 'html' : 'text']: body
    };

    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Correo enviado exitosamente',
      messageId: info.messageId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error enviando correo SMTP:', error);
    
    let errorMessage = 'Error desconocido';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Error de autenticación. Verifica tu correo y contraseña.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Error de conexión con el servidor SMTP.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.code || 'UNKNOWN_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};