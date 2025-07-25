import type { APIRoute } from 'astro';
import { microsoftEmailService } from '../../../lib/microsoft-auth';

export const GET: APIRoute = async ({ redirect }) => {
  try {
    const authUrl = microsoftEmailService.getAuthUrl();
    return redirect(authUrl);
  } catch (error) {
    console.error('Error generando URL de autenticación:', error);
    return new Response(JSON.stringify({ error: 'Error al iniciar autenticación' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};