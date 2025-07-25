import emailjs from '@emailjs/browser';

// Configuración de EmailJS
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.PUBLIC_EMAILJS_SERVICE_ID || 'your_service_id',
  templateId: import.meta.env.PUBLIC_EMAILJS_TEMPLATE_ID || 'your_template_id',
  publicKey: import.meta.env.PUBLIC_EMAILJS_PUBLIC_KEY || 'your_public_key'
};

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: any[];
}

export class EmailJSService {
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      console.log('🔧 Configuración EmailJS:', {
        serviceId: EMAILJS_CONFIG.serviceId,
        templateId: EMAILJS_CONFIG.templateId,
        publicKey: EMAILJS_CONFIG.publicKey ? `${EMAILJS_CONFIG.publicKey.substring(0, 8)}...` : 'NO DEFINIDO',
        hasServiceId: !!EMAILJS_CONFIG.serviceId,
        hasTemplateId: !!EMAILJS_CONFIG.templateId,
        hasPublicKey: !!EMAILJS_CONFIG.publicKey
      });
      
      emailjs.init(EMAILJS_CONFIG.publicKey);
      this.initialized = true;
      console.log('✅ EmailJS inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar EmailJS:', error);
    }
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; message: string }> {
    if (!this.initialized) {
      return {
        success: false,
        message: 'EmailJS no está inicializado correctamente'
      };
    }

    // Verificar configuración
    if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId || !EMAILJS_CONFIG.publicKey) {
      return {
        success: false,
        message: 'Configuración de EmailJS incompleta. Verifica las variables de entorno.'
      };
    }

    try {
      // Preparar los parámetros del template (coincidiendo con el template de EmailJS)
      const templateParams = {
        name: emailData.from || 'Usuario',
        email: emailData.from || 'julio.caniunir@estelarbet.com',
        message: emailData.html,
        to_email: emailData.to, // Usar el destinatario real del emailData
        subject: emailData.subject,
        time: new Date().toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      console.log('Enviando email con EmailJS...', {
        serviceId: EMAILJS_CONFIG.serviceId,
        templateId: EMAILJS_CONFIG.templateId,
        to: emailData.to,
        subject: emailData.subject
      });

      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      console.log('Email enviado exitosamente:', response);

      return {
        success: true,
        message: `Email enviado exitosamente a ${emailData.to} usando EmailJS`
      };

    } catch (error: any) {
      console.error('Error al enviar email con EmailJS:', error);
      
      let errorMessage = 'Error desconocido al enviar email';
      
      if (error.status === 400) {
        errorMessage = 'Error de configuración: Verifica tu Service ID, Template ID y Public Key';
      } else if (error.status === 401) {
        errorMessage = 'Error de autenticación: Verifica tu Public Key';
      } else if (error.status === 402) {
        errorMessage = 'Límite de emails alcanzado. Considera actualizar tu plan de EmailJS';
      } else if (error.status === 403) {
        errorMessage = 'Acceso denegado: Verifica la configuración de tu servicio';
      } else if (error.text) {
        errorMessage = error.text;
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Método para mostrar vista previa como fallback
  showEmailPreview(emailData: EmailData): void {
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Vista Previa del Email</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .email-header { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .email-content { border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="email-header">
            <h2>Vista Previa del Email</h2>
            <p><strong>Para:</strong> ${emailData.to}</p>
            <p><strong>De:</strong> ${emailData.from || 'usuario@ejemplo.com'}</p>
            <p><strong>Asunto:</strong> ${emailData.subject}</p>
          </div>
          <div class="email-content">
            ${emailData.html}
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;">
            <p><strong>Nota:</strong> Esta es una vista previa. Para enviar emails reales, configura EmailJS correctamente.</p>
          </div>
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  }
}

// Instancia singleton
export const emailJSService = new EmailJSService();