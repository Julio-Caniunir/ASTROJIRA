import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

// Configuración de Microsoft Azure App
const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authority: 'https://login.microsoftonline.com/common'
  }
};

class CustomAuthProvider implements AuthenticationProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

export class MicrosoftEmailService {
  private cca: ConfidentialClientApplication;

  constructor() {
    this.cca = new ConfidentialClientApplication(msalConfig);
  }

  // Obtener URL de autorización para el login
  getAuthUrl(): string {
    const authCodeUrlParameters = {
      scopes: ['https://graph.microsoft.com/Mail.Send', 'https://graph.microsoft.com/User.Read'],
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:4321/auth/callback',
    };

    return this.cca.getAuthCodeUrl(authCodeUrlParameters);
  }

  // Intercambiar código de autorización por token de acceso
  async getTokenFromCode(code: string): Promise<string> {
    const tokenRequest = {
      code,
      scopes: ['https://graph.microsoft.com/Mail.Send', 'https://graph.microsoft.com/User.Read'],
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:4321/auth/callback',
    };

    try {
      const response = await this.cca.acquireTokenByCode(tokenRequest);
      return response?.accessToken || '';
    } catch (error) {
      console.error('Error obteniendo token:', error);
      throw error;
    }
  }

  // Enviar correo usando Microsoft Graph
  async sendEmail(accessToken: string, emailData: {
    to: string;
    subject: string;
    body: string;
    isHtml?: boolean;
  }): Promise<boolean> {
    try {
      const authProvider = new CustomAuthProvider(accessToken);
      const graphClient = Client.initWithMiddleware({ authProvider });

      const mail = {
        message: {
          subject: emailData.subject,
          body: {
            contentType: emailData.isHtml ? 'HTML' : 'Text',
            content: emailData.body
          },
          toRecipients: [
            {
              emailAddress: {
                address: emailData.to
              }
            }
          ]
        },
        saveToSentItems: true
      };

      await graphClient.api('/me/sendMail').post(mail);
      return true;
    } catch (error) {
      console.error('Error enviando correo:', error);
      return false;
    }
  }

  // Obtener información del usuario
  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const authProvider = new CustomAuthProvider(accessToken);
      const graphClient = Client.initWithMiddleware({ authProvider });
      
      const user = await graphClient.api('/me').get();
      return user;
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      return null;
    }
  }
}

export const microsoftEmailService = new MicrosoftEmailService();