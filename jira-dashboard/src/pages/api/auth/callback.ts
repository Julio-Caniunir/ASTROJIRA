import type { APIRoute } from 'astro';
import { microsoftEmailService } from '../../../lib/microsoft-auth';

export const GET: APIRoute = async ({ url, redirect, cookies }) => {
  try {
    const urlParams = new URLSearchParams(url.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      console.error('Error en autenticación:', error);
      return redirect('/?auth=error');
    }

    if (!code) {
      return redirect('/?auth=missing-code');
    }

    // Intercambiar código por token de acceso
    const accessToken = await microsoftEmailService.getTokenFromCode(code);
    
    if (!accessToken) {
      return redirect('/?auth=token-error');
    }

    // Obtener información del usuario
    const userInfo = await microsoftEmailService.getUserInfo(accessToken);
    
    if (!userInfo) {
      return redirect('/?auth=user-error');
    }

    // Guardar token en cookie segura (en producción usar httpOnly y secure)
    cookies.set('microsoft_access_token', accessToken, {
      maxAge: 3600, // 1 hora
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Guardar información del usuario
    cookies.set('user_info', JSON.stringify({
      email: userInfo.mail || userInfo.userPrincipalName,
      name: userInfo.displayName
    }), {
      maxAge: 3600,
      httpOnly: false, // Permitir acceso desde JavaScript para mostrar en UI
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return redirect('/?auth=success');
  } catch (error) {
    console.error('Error en callback de autenticación:', error);
    return redirect('/?auth=callback-error');
  }
};