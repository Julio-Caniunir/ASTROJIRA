import type { APIRoute } from 'astro';
import { microsoftEmailService } from '../../lib/microsoft-auth';

// Función para extraer fechas del título (reutilizada del sistema anterior)
function extractDateFromTitle(title: string): Date[] {
  const monthMap: { [key: string]: number } = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
    'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
  };

  const regexes = [
    /\b(\d{1,2})\s+DE\s+(\w+)\b/gi,
    /\b(\d{1,2})\s*\/\s*(\d{1,2})\b/g,
    /\b(\d{2})(\d{2})\b/g,
    /\b(\d{1,2})\s+(\w+)\b/gi,
    /\b(\d{1,2})-(\d{1,2})\s+DE\s+(\w+)\b/gi,
    /\b(\d{1,2})\s*-\s*(\d{1,2})\s*\/\s*(\d{1,2})\b/g
  ];

  const dates: Date[] = [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  for (const regex of regexes) {
    let match;
    while ((match = regex.exec(title)) !== null) {
      if (regex === regexes[0] || regex === regexes[3]) {
        const day = parseInt(match[1]);
        const monthName = match[2].toLowerCase();
        const month = monthMap[monthName];
        if (month && day >= 1 && day <= 31) {
          dates.push(new Date(currentYear, month - 1, day));
        }
      } else if (regex === regexes[1]) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          dates.push(new Date(currentYear, month - 1, day));
        }
      } else if (regex === regexes[2]) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          dates.push(new Date(currentYear, month - 1, day));
        }
      } else if (regex === regexes[4]) {
        const startDay = parseInt(match[1]);
        const endDay = parseInt(match[2]);
        const monthName = match[3].toLowerCase();
        const month = monthMap[monthName];
        if (month && startDay >= 1 && endDay <= 31 && startDay <= endDay) {
          for (let day = startDay; day <= endDay; day++) {
            dates.push(new Date(currentYear, month - 1, day));
          }
        }
      } else if (regex === regexes[5]) {
        const startDay = parseInt(match[1]);
        const endDay = parseInt(match[2]);
        const month = parseInt(match[3]);
        if (month >= 1 && month <= 12 && startDay >= 1 && endDay <= 31 && startDay <= endDay) {
          for (let day = startDay; day <= endDay; day++) {
            dates.push(new Date(currentYear, month - 1, day));
          }
        }
      }
    }
  }

  return dates;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verificar autenticación
    const accessToken = cookies.get('microsoft_access_token')?.value;
    const userInfo = cookies.get('user_info')?.value;

    if (!accessToken || !userInfo) {
      return new Response(JSON.stringify({ 
        error: 'No autenticado. Por favor, inicia sesión con Microsoft primero.' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = JSON.parse(userInfo);
    
    // Obtener issues de Jira
    const jiraResponse = await fetch(`${request.url.split('/api')[0]}/api/issues`);
    if (!jiraResponse.ok) {
      throw new Error('Error al obtener issues de Jira');
    }
    
    const issues = await jiraResponse.json();
    
    // Procesar fechas y calcular métricas
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const issueDates = new Set<string>();
    
    issues.forEach((issue: any) => {
      const datesFromTitle = extractDateFromTitle(issue.summary);
      datesFromTitle.forEach(date => {
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          issueDates.add(date.getDate().toString());
        }
      });
      
      if (issue.duedate) {
        const dueDate = new Date(issue.duedate);
        if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
          issueDates.add(dueDate.getDate().toString());
        }
      }
    });
    
    const daysWithPromotions = issueDates.size;
    const daysWithoutPromotions = daysInMonth - daysWithPromotions;
    const coveragePercentage = Math.round((daysWithPromotions / daysInMonth) * 100);
    
    // Generar HTML del correo
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reporte de Promociones - ${monthNames[currentMonth]} ${currentYear}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .metric { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #667eea; }
            .metric h3 { margin: 0 0 10px 0; color: #333; }
            .metric .value { font-size: 24px; font-weight: bold; color: #667eea; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Reporte de Promociones</h1>
                <p>${monthNames[currentMonth]} ${currentYear}</p>
                <p>Enviado por: ${user.name} (${user.email})</p>
            </div>
            <div class="content">
                <div class="metric">
                    <h3>📅 Días con Promociones</h3>
                    <div class="value">${daysWithPromotions} días</div>
                </div>
                <div class="metric">
                    <h3>❌ Días sin Promociones</h3>
                    <div class="value">${daysWithoutPromotions} días</div>
                </div>
                <div class="metric">
                    <h3>📈 Cobertura del Mes</h3>
                    <div class="value">${coveragePercentage}%</div>
                </div>
                <div class="metric">
                    <h3>📊 Total de Issues</h3>
                    <div class="value">${issues.length} issues</div>
                </div>
            </div>
            <div class="footer">
                <p>Reporte generado automáticamente desde Jira Dashboard</p>
                <p>Autenticado con Microsoft Graph API</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    // Enviar correo
    const emailSent = await microsoftEmailService.sendEmail(accessToken, {
      to: user.email,
      subject: `📊 Reporte de Promociones - ${monthNames[currentMonth]} ${currentYear}`,
      body: emailHtml,
      isHtml: true
    });
    
    if (emailSent) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Correo enviado exitosamente a ${user.email}`,
        metrics: {
          daysWithPromotions,
          daysWithoutPromotions,
          coveragePercentage,
          totalIssues: issues.length
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        error: 'Error al enviar el correo' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Error enviando correo:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};