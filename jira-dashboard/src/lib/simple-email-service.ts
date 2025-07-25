import { emailJSService, type EmailData } from './emailjs-service';
import type { EmailCredentials } from '../types/email';

export class SimpleEmailService {
  private credentials: EmailCredentials | null = null;

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials(): void {
    try {
      const stored = localStorage.getItem('email_credentials');
      if (stored) {
        this.credentials = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading email credentials:', error);
    }
  }

  public saveCredentials(credentials: EmailCredentials): void {
    this.credentials = credentials;
    localStorage.setItem('email_credentials', JSON.stringify(credentials));
    if (credentials.recipientEmail) {
      localStorage.setItem('recipientEmail', credentials.recipientEmail);
    }
  }

  public hasCredentials(): boolean {
    return this.credentials !== null && 
           this.credentials.email !== '' && 
           this.credentials.password !== '';
  }

  public getEmail(): string | null {
    return this.credentials?.email || null;
  }

  public getRecipientEmail(): string | null {
    return localStorage.getItem('recipientEmail');
  }

  public getStoredCredentials(): EmailCredentials | null {
    return this.credentials;
  }

  public clearCredentials(): void {
    this.credentials = null;
    localStorage.removeItem('email_credentials');
  }

  public async sendEmail(emailData: EmailData): Promise<{ success: boolean; message: string }> {
    try {


      // Enviar directamente con EmailJS sin requerir credenciales
       const emailBody = this.formatEmailBody(emailData);
       const result = await emailJSService.sendEmail({
         to: emailData.to,
         subject: emailData.subject,
         html: emailBody,
         from: 'julio.caniunir@estelarbet.com' // Email genérico para el remitente
       });

      if (result.success) {
        return result;
      } else {
        
        // Fallback: mostrar vista previa

         emailJSService.showEmailPreview({
           to: emailData.to,
           subject: emailData.subject,
           html: emailBody,
           from: 'julio.caniunir@estelarbet.com'
         });
        
        return {
          success: false,
          message: `${result.message}. Se mostró vista previa como alternativa.`
        };
      }
    } catch (error) {
      // Fallback: mostrar vista previa
       const emailBody = this.formatEmailBody(emailData);
       emailJSService.showEmailPreview({
         to: emailData.to,
         subject: emailData.subject,
         html: emailBody,
         from: 'usuario@ejemplo.com'
       });
      
      return {
        success: false,
        message: 'Error inesperado. Se mostró vista previa como alternativa.'
      };
    }
  }

  private formatEmailBody(emailData: EmailData): string {
    const fromEmail = 'julio.caniunir@estelarbet.com'; // Email genérico
    
    if (emailData.isHtml) {
      return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${emailData.subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #0078d4; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📧 ${emailData.subject}</h1>
    </div>
    <div class="content">
        ${emailData.body}
    </div>
    <div class="footer">
        <p>Enviado desde Jira Dashboard por ${fromEmail}</p>
        <p>📅 ${new Date().toLocaleString('es-ES')}</p>
    </div>
</body>
</html>`;
    } else {
      return `
${emailData.subject}
${'='.repeat(emailData.subject.length)}

${emailData.body}

---
Enviado desde Jira Dashboard por ${fromEmail}
📅 ${new Date().toLocaleString('es-ES')}
      `;
    }
  }

  private showEmailPreview(emailData: EmailData, formattedBody: string): void {
    const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    
    if (newWindow) {
      const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Vista Previa del Correo</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .preview-header { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .email-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .email-content { border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
        .copy-btn { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px 5px; }
        .copy-btn:hover { background: #218838; }
        .mailto-btn { background: #0078d4; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px 5px; }
        .mailto-btn:hover { background: #106ebe; }
        textarea { width: 100%; height: 200px; margin: 10px 0; font-family: monospace; }
    </style>
</head>
<body>
    <div class="preview-header">
        <h2>📧 Vista Previa del Correo</h2>
        <p>Revisa el contenido antes de enviarlo desde tu cliente de correo.</p>
    </div>
    
    <div class="email-info">
        <p><strong>De:</strong> julio.caniunir@estelarbet.com</p>
        <p><strong>Para:</strong> ${emailData.to}</p>
        <p><strong>Asunto:</strong> ${emailData.subject}</p>
    </div>
    
    <div style="margin-bottom: 20px;">
        <button class="mailto-btn" onclick="openMailto()">📧 Abrir en Cliente de Correo</button>
        <button class="copy-btn" onclick="copyToClipboard('subject')">📋 Copiar Asunto</button>
        <button class="copy-btn" onclick="copyToClipboard('body')">📋 Copiar Contenido</button>
    </div>
    
    <div class="email-content">
        <h3>Contenido del Correo:</h3>
        ${emailData.isHtml ? formattedBody : '<pre>' + formattedBody + '</pre>'}
    </div>
    
    <div style="margin-top: 20px;">
        <h3>Texto para copiar:</h3>
        <textarea id="emailText" readonly>${emailData.body}</textarea>
    </div>
    
    <script>
        function copyToClipboard(type) {
            let text = '';
            if (type === 'subject') {
                text = '${emailData.subject.replace(/'/g, "\\'")}';
            } else if (type === 'body') {
                text = document.getElementById('emailText').value;
            }
            
            navigator.clipboard.writeText(text).then(() => {
                alert('✅ Copiado al portapapeles');
            }).catch(() => {
                // Fallback para navegadores que no soportan clipboard API
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('✅ Copiado al portapapeles');
            });
        }
        
        function openMailto() {
            const subject = encodeURIComponent('${emailData.subject}');
            const body = encodeURIComponent('${emailData.body.replace(/'/g, "\\'").replace(/\n/g, '\\n')}');
            const mailto = \`mailto:${emailData.to}?subject=\${subject}&body=\${body}\`;
            window.location.href = mailto;
        }
    </script>
</body>
</html>`;
      
      newWindow.document.write(content);
      newWindow.document.close();
    } else {
      alert('No se pudo abrir la ventana de vista previa. Por favor, permite las ventanas emergentes.');
    }
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.hasCredentials()) {
      return {
        success: false,
        message: 'No hay credenciales configuradas'
      };
    }

    // Simulación de prueba de conexión
    return {
      success: true,
      message: `Credenciales configuradas para: ${this.credentials?.email}`
    };
  }
}

// Instancia global del servicio
export const emailService = new SimpleEmailService();