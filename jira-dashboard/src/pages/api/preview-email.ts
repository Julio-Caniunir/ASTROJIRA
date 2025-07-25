import type { APIRoute } from 'astro';

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    created: string;
    status: {
      name: string;
    };
  };
}

export const GET: APIRoute = async ({ request }) => {
  try {
    // Obtener credenciales de Jira
    const email = import.meta.env.JIRA_EMAIL;
    const token = import.meta.env.JIRA_TOKEN;
    const domain = import.meta.env.JIRA_DOMAIN;
    const project = import.meta.env.JIRA_PROJECT_KEY;

    if (!email || !token || !domain || !project) {
      return new Response('Faltan credenciales de Jira', { status: 500 });
    }

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const jql = `project = ${project} AND status IN ("To Do", "director creativo", "piezas graficas", "T&C", "creador de campaña", "configuración e información", "PUBLICACIÓN DE PIEZAS", "Publicación de piezas")`;
    const url = `https://${domain}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=summary,status,duedate,assignee,subtasks,priority,labels&maxResults=200`;

    // Obtener issues de Jira
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return new Response('Error al consultar Jira', { status: 500 });
    }

    const data = await res.json();
    const issues = data.issues || [];

    // Función para extraer fechas de los títulos (misma lógica que en Calendar.tsx)
    const extractDateFromTitle = (title: string): Date[] => {
      const dates: Date[] = [];
      const currentYear = new Date().getFullYear();
      
      const patterns = [
        /\b(\d{1,2})\s+DE\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/gi,
        /\b(\d{1,2})\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE|ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\b/gi,
        /\b(\d{1,2})\/(\d{1,2})\)/g,
        /\b(\d{1,2})\/(\d{1,2})\b/g,
        /\b(\d{2})(\d{2})\b/g,
        /\b(\d{1,2})\s+Y\s+(\d{1,2})\s+DE\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/gi
      ];
      
      const monthMap: { [key: string]: number } = {
        'ENERO': 0, 'ENE': 0, 'FEBRERO': 1, 'FEB': 1, 'MARZO': 2, 'MAR': 2,
        'ABRIL': 3, 'ABR': 3, 'MAYO': 4, 'MAY': 4, 'JUNIO': 5, 'JUN': 5,
        'JULIO': 6, 'JUL': 6, 'AGOSTO': 7, 'AGO': 7, 'SEPTIEMBRE': 8, 'SEP': 8,
        'OCTUBRE': 9, 'OCT': 9, 'NOVIEMBRE': 10, 'NOV': 10, 'DICIEMBRE': 11, 'DIC': 11
      };
      
      patterns.forEach((pattern, index) => {
        let match;
        while ((match = pattern.exec(title)) !== null) {
          if (index <= 1) {
            const day = parseInt(match[1]);
            const monthStr = match[2].toUpperCase();
            const month = monthMap[monthStr];
            
            if (month !== undefined && day >= 1 && day <= 31) {
              const date = new Date(currentYear, month, day);
              dates.push(date);
            }
          } else if (index === 2 || index === 3 || index === 4) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            
            if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
              const date = new Date(currentYear, month, day);
              dates.push(date);
            }
          } else if (index === 5) {
            const day1 = parseInt(match[1]);
            const day2 = parseInt(match[2]);
            const monthStr = match[3].toUpperCase();
            const month = monthMap[monthStr];
            
            if (month !== undefined) {
              [day1, day2].forEach(day => {
                if (day >= 1 && day <= 31) {
                  const date = new Date(currentYear, month, day);
                  dates.push(date);
                }
              });
            }
          }
        }
      });
      
      return dates;
    };

    // Procesar issues y extraer fechas
    const titleDates = new Set<string>();
    const issuesWithDates: { issue: any, dates: Date[] }[] = [];
    
    issues.forEach((issue: any) => {
      const extractedDates = extractDateFromTitle(issue.fields.summary);
      if (extractedDates.length > 0) {
        issuesWithDates.push({ issue, dates: extractedDates });
        extractedDates.forEach(date => {
          titleDates.add(date.toDateString());
        });
      }
    });

    // Generar rango de fechas para el mes actual y siguiente
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0); // Último día del próximo mes
    
    const daysWithoutPromos: string[] = [];
    const daysWithPromos: string[] = [];
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toDateString();
      const dayName = dayNames[d.getDay()];
      const formattedDate = `${dayName} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      
      if (!titleDates.has(dateStr)) {
        daysWithoutPromos.push(formattedDate);
      } else {
        daysWithPromos.push(formattedDate);
      }
    }

    // Crear contenido del correo HTML con estilos mejorados
    const emailHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Promociones</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #667eea;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #667eea;
                margin: 0;
                font-size: 28px;
            }
            .summary {
                background-color: #f8f9ff;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #667eea;
            }
            .summary h2 {
                color: #667eea;
                margin-top: 0;
            }
            .stats {
                display: flex;
                justify-content: space-around;
                margin: 20px 0;
                flex-wrap: wrap;
            }
            .stat-item {
                text-align: center;
                padding: 15px;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                margin: 5px;
                min-width: 120px;
            }
            .stat-number {
                font-size: 24px;
                font-weight: bold;
                color: #667eea;
            }
            .stat-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
            }
            .section {
                margin-bottom: 30px;
            }
            .section h3 {
                color: #333;
                border-bottom: 2px solid #eee;
                padding-bottom: 10px;
            }
            .days-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 10px;
                margin-top: 15px;
            }
            .day-item {
                padding: 8px 12px;
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                font-size: 14px;
            }
            .day-item.with-promo {
                background-color: #d4edda;
                border-color: #c3e6cb;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 12px;
            }
            .alert {
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }
            .success {
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📅 Reporte de Promociones</h1>
                <p>Análisis de cobertura promocional</p>
            </div>

            <div class="summary">
                <h2>📊 Resumen Ejecutivo</h2>
                <div class="stats">
                    <div class="stat-item">
                        <div class="stat-number">${daysWithoutPromos.length + daysWithPromos.length}</div>
                        <div class="stat-label">Total Días</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${daysWithPromos.length}</div>
                        <div class="stat-label">Con Promociones</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${daysWithoutPromos.length}</div>
                        <div class="stat-label">Sin Promociones</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${Math.round((daysWithPromos.length / (daysWithoutPromos.length + daysWithPromos.length)) * 100)}%</div>
                        <div class="stat-label">Cobertura</div>
                    </div>
                </div>
            </div>

            ${daysWithoutPromos.length > 0 ? `
                <div class="alert">
                    <strong>⚠️ Atención:</strong> Se encontraron ${daysWithoutPromos.length} días sin promociones asignadas.
                </div>

                <div class="section">
                    <h3>🚨 Días sin Promociones</h3>
                    <div class="days-grid">
                        ${daysWithoutPromos.map(day => `<div class="day-item">${day}</div>`).join('')}
                    </div>
                </div>
            ` : `
                <div class="success">
                    <strong>✅ Excelente:</strong> Todos los días tienen promociones asignadas.
                </div>
            `}

            <div class="section">
                <h3>✅ Días con Promociones (${daysWithPromos.length})</h3>
                <div class="days-grid">
                    ${daysWithPromos.slice(0, 20).map(day => `<div class="day-item with-promo">${day}</div>`).join('')}
                    ${daysWithPromos.length > 20 ? `<div class="day-item with-promo"><em>... y ${daysWithPromos.length - 20} días más</em></div>` : ''}
                </div>
            </div>

            <div class="section">
                <h3>📋 Issues Analizadas</h3>
                <p><strong>Total de issues procesadas:</strong> ${issues.length}</p>
                <p><strong>Issues con fechas válidas:</strong> ${issuesWithDates.length}</p>
                <details style="margin-top: 15px;">
                    <summary style="cursor: pointer; font-weight: bold;">Ver detalles de issues con fechas</summary>
                    <div style="margin-top: 10px; max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                        ${issuesWithDates.slice(0, 10).map(item => `
                            <div style="margin-bottom: 10px; padding: 8px; background-color: #f8f9fa; border-radius: 3px;">
                                <strong>${item.issue.key}:</strong> ${item.issue.fields.summary}<br>
                                <small style="color: #666;">Fechas: ${item.dates.map(d => d.toLocaleDateString('es-ES')).join(', ')}</small>
                            </div>
                        `).join('')}
                        ${issuesWithDates.length > 10 ? `<p><em>... y ${issuesWithDates.length - 10} issues más</em></p>` : ''}
                    </div>
                </details>
            </div>

            <div class="footer">
                <p>Reporte generado automáticamente el ${new Date().toLocaleString('es-ES')}</p>
                <p>Sistema de Gestión de Promociones - Jira Dashboard</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return new Response(emailHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });

  } catch (error: any) {
    console.error('Error en preview-email:', error);
    return new Response(`Error interno del servidor: ${error.message}`, { status: 500 });
  }
};