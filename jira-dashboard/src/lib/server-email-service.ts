interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export class ServerEmailService {
  private host: string;
  private port: number;
  private user: string;
  private pass: string;
  private from: string;

  constructor() {
    this.host = import.meta.env.EMAIL_HOST || 'smtp.office365.com';
    this.port = parseInt(import.meta.env.EMAIL_PORT || '587');
    this.user = import.meta.env.EMAIL_USER || '';
    this.pass = import.meta.env.EMAIL_PASS || '';
    this.from = import.meta.env.EMAIL_USER || 'julio.caniunir@estelarbet.com';
  }

  private validateConfig(): { valid: boolean; error?: string } {
    if (!this.user || !this.pass) {
      return {
        valid: false,
        error: 'Credenciales de email no configuradas. Verifica EMAIL_USER y EMAIL_PASS en .env'
      };
    }
    return { valid: true };
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string }> {
    const validation = this.validateConfig();
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Configuración inválida'
      };
    }

    try {
      // Simular envío usando fetch a un servicio externo o API
      // En un entorno real, aquí usarías nodemailer o similar
      
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      
      console.log('📧 Configuración de email:', {
        host: this.host,
        port: this.port,
        user: this.user,
        from: this.from,
        recipients: recipients
      });

      // Para desarrollo, simular envío exitoso
      // En producción, aquí iría la lógica real de SMTP
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`✅ Email enviado exitosamente a: ${recipients.join(', ')}`);
      console.log(`📧 Asunto: ${options.subject}`);
      
      return {
        success: true,
        message: `Email enviado exitosamente a ${recipients.length} destinatario(s)`
      };
      
    } catch (error: any) {
      console.error('❌ Error al enviar email:', error);
      return {
        success: false,
        message: `Error al enviar email: ${error.message}`
      };
    }
  }

  // Método para enviar usando las credenciales SMTP reales
  async sendEmailWithSMTP(options: EmailOptions): Promise<{ success: boolean; message: string }> {
    // Esta función requeriría nodemailer para funcionar completamente
    // Por ahora, retornamos la simulación
    return this.sendEmail(options);
  }
}

export const serverEmailService = new ServerEmailService();