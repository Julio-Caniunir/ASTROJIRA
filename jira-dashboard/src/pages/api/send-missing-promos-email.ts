import type { APIRoute } from 'astro';
import { serverEmailService } from '../../lib/server-email-service';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🔧 API send-missing-promos-email iniciado');
    // Obtener datos del cuerpo de la petición
    const body = await request.json();
    const emailTo = body.to || import.meta.env.EMAIL_TO; // Usar el email del parámetro o el del .env como fallback
    const analysisOnly = body.analysisOnly || false;
    const targetMonth = body.month; // Mes específico (0-11)
    const targetYear = body.year; // Año específico
    
    // Convertir emailTo a array si no lo es
    const emailRecipients = Array.isArray(emailTo) ? emailTo : [emailTo];
    
    console.log('📧 Destinatarios recibidos:', emailRecipients);
    console.log('🔍 Modo análisis solamente:', analysisOnly);
    console.log('📅 Mes objetivo:', targetMonth !== undefined ? targetMonth : 'actual');
    console.log('📅 Año objetivo:', targetYear !== undefined ? targetYear : 'actual');
    
    // Obtener credenciales de Jira
    const email = import.meta.env.JIRA_EMAIL;
    const token = import.meta.env.JIRA_TOKEN;
    const domain = import.meta.env.JIRA_DOMAIN;
    const project = import.meta.env.JIRA_PROJECT_KEY;
    
    if (!email || !token || !domain || !project) {
      console.log('❌ Error: Faltan credenciales de Jira');
      return new Response(JSON.stringify({ error: 'Faltan credenciales de Jira' }), { status: 500 });
    }

    console.log('🔑 Credenciales de Jira configuradas correctamente');

    if (!emailTo || (Array.isArray(emailTo) && emailTo.length === 0)) {
      console.log('❌ Error: Email destinatario no proporcionado');
      return new Response(JSON.stringify({ error: 'No se especificó destinatario de correo' }), { status: 400 });
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
      console.log('❌ Error al consultar Jira:', res.status, res.statusText);
      return new Response(JSON.stringify({ error: 'Error al consultar Jira' }), { status: 500 });
    }

    const data = await res.json();
    const issues = data.issues || [];
    console.log('📊 Issues obtenidas de Jira:', issues.length);

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
    
    issues.forEach((issue: any) => {
      const extractedDates = extractDateFromTitle(issue.fields.summary);
      extractedDates.forEach(date => {
        titleDates.add(date.toDateString());
      });
    });

    // Generar rango de fechas para el mes especificado o el mes actual
    const today = new Date();
    const reportMonth = targetMonth !== undefined ? targetMonth : today.getMonth();
    const reportYear = targetYear !== undefined ? targetYear : today.getFullYear();
    
    const startDate = new Date(reportYear, reportMonth, 1);
    const endDate = new Date(reportYear, reportMonth + 1, 0); // Último día del mes especificado
    
    const daysWithoutPromos: string[] = [];
    const daysWithPromos: Array<{date: string, promos: Array<{id: string, name: string}>}> = [];
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // Crear un mapa de fechas a issues para obtener detalles
    const dateToIssues = new Map<string, Array<{id: string; summary: string}>>();
    
    issues.forEach((issue: any) => {
      const extractedDates = extractDateFromTitle(issue.fields.summary);
      const uniqueDates = new Set<string>();
      
      // Eliminar fechas duplicadas del mismo issue
      extractedDates.forEach(date => {
        uniqueDates.add(date.toDateString());
      });
      
      uniqueDates.forEach(dateStr => {
        if (!dateToIssues.has(dateStr)) {
          dateToIssues.set(dateStr, []);
        }
        
        // Verificar si el issue ya existe para esta fecha
        const existingIssues = dateToIssues.get(dateStr)!;
        const issueExists = existingIssues.some(existingIssue => existingIssue.id === issue.key);
        
        if (!issueExists) {
          existingIssues.push({
            id: issue.key,
            summary: issue.fields.summary
          });
        }
      });
    });
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toDateString();
      const dayName = dayNames[d.getDay()];
      const formattedDate = `${dayName} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      
      if (!titleDates.has(dateStr)) {
        daysWithoutPromos.push(formattedDate);
      } else {
        const issuesForDate = dateToIssues.get(dateStr) || [];
        const promos = issuesForDate.map(issue => ({
          id: issue.id,
          name: issue.summary
        }));
        daysWithPromos.push({
          date: formattedDate,
          promos: promos
        });
      }
    }

    console.log('📈 Análisis completado:');
    console.log('  - Días sin promociones:', daysWithoutPromos.length);
    console.log('  - Días con promociones:', daysWithPromos.length);

    if (daysWithoutPromos.length === 0) {
      console.log('✅ Todos los días tienen promociones asignadas');
      return new Response(JSON.stringify({ 
        message: 'Todos los días tienen promociones asignadas',
        daysWithoutPromos: []
      }), { status: 200 });
    }

    // Crear contenido del correo
    const reportMonthName = monthNames[reportMonth];
    const totalDays = endDate.getDate();
    const emailSubject = `🚨 Reporte de Promociones ${reportMonthName} ${reportYear} - ${daysWithoutPromos.length} días sin promociones`;
    const emailBody = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Promociones</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155;">
        <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); letter-spacing: 0.5px;">
              📅 Reporte de Promociones
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 18px; font-weight: 300;">
              ${reportMonthName} ${reportYear}
            </p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            
            <!-- Resumen del Mes -->
            <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #667eea; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <h2 style="color: #475569; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                📊 Resumen del Mes
              </h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                  <div style="font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 5px;">${totalDays}</div>
                  <div style="font-size: 14px; color: #64748b; font-weight: 500;">Total de días</div>
                </div>
                <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                  <div style="font-size: 24px; font-weight: 700; color: #059669; margin-bottom: 5px;">${daysWithPromos.length}</div>
                  <div style="font-size: 14px; color: #64748b; font-weight: 500;">Con promociones</div>
                </div>
                <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                  <div style="font-size: 24px; font-weight: 700; color: #dc2626; margin-bottom: 5px;">${daysWithoutPromos.length}</div>
                  <div style="font-size: 14px; color: #64748b; font-weight: 500;">Sin promociones</div>
                </div>
                <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                  <div style="font-size: 24px; font-weight: 700; color: #7c3aed; margin-bottom: 5px;">${Math.round((daysWithPromos.length / totalDays) * 100)}%</div>
                  <div style="font-size: 14px; color: #64748b; font-weight: 500;">Cobertura</div>
                </div>
              </div>
            </div>
            
            ${daysWithPromos.length > 0 ? `
              <!-- Días con Promociones -->
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #059669; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                <h2 style="color: #065f46; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                  ✅ Días con Promociones
                </h2>
                <div style="display: grid; gap: 15px;">
                  ${daysWithPromos.map(dayData => `
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); border-left: 3px solid #10b981;">
                      <div style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        📅 ${dayData.date}
                      </div>
                      <div style="margin-left: 20px;">
                        ${dayData.promos.map(promo => `
                          <div style="margin-bottom: 8px; padding: 8px 12px; background-color: #f8fafc; border-radius: 6px; border-left: 2px solid #10b981;">
                            <span style="font-weight: 600; color: #059669; font-size: 14px;">${promo.id}</span>
                            <span style="color: #475569; margin-left: 8px; font-size: 14px;">${promo.name}</span>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            ${daysWithoutPromos.length > 0 ? `
              <!-- Días sin Promociones -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #f59e0b; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                <h2 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                  🚨 Días sin Promociones
                </h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                  ${daysWithoutPromos.map(day => `
                    <div style="background-color: #ffffff; padding: 12px 16px; border-radius: 8px; font-weight: 500; color: #92400e; text-align: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); border: 1px solid #fbbf24;">
                      ${day}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : `
              <!-- Todos los días cubiertos -->
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 30px; border-radius: 12px; text-align: center; border-left: 5px solid #059669; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
                <h2 style="color: #065f46; margin: 0 0 10px 0; font-size: 24px; font-weight: 700;">¡Excelente trabajo!</h2>
                <p style="color: #047857; margin: 0; font-size: 16px; font-weight: 500;">Todos los días del mes tienen promociones asignadas</p>
              </div>
            `}
            
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 13px; color: #64748b; font-style: italic;">
              📊 Reporte generado automáticamente el ${new Date().toLocaleString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
              Sistema de Gestión de Promociones | Dashboard Jira
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    let emailSent = false;
    let emailError = null;
    const emailResults: Array<{recipient: string, success: boolean, error?: string}> = [];

    // Only send email if there are days without promos and not in analysis mode
    if (daysWithoutPromos.length > 0 && !analysisOnly) {
      console.log('📧 Intentando enviar email a múltiples destinatarios...');
      console.log('  - Para:', emailRecipients);
      console.log('  - Asunto:', emailSubject);
      
      let successCount = 0;
      
      for (const recipient of emailRecipients) {
        try {
          console.log(`📧 Enviando a: ${recipient}`);
          
          const result = await serverEmailService.sendEmail({
            to: recipient,
            subject: emailSubject,
            html: emailBody,
            from: 'ti.estelarbet@estelarbet.com'
          });
          
          console.log(`📧 Resultado para ${recipient}:`, result);
          
          if (result.success) {
            successCount++;
            emailResults.push({ recipient, success: true });
            console.log(`✅ Email enviado exitosamente a ${recipient}`);
          } else {
            emailResults.push({ recipient, success: false, error: result.message });
            console.log(`❌ Error enviando a ${recipient}:`, result.message);
          }
        } catch (error: any) {
          emailResults.push({ recipient, success: false, error: error.message });
          console.error(`❌ Error enviando a ${recipient}:`, error);
        }
      }
      
      emailSent = successCount > 0;
      if (successCount === emailRecipients.length) {
        console.log(`✅ Todos los emails enviados exitosamente (${successCount}/${emailRecipients.length})`);
      } else if (successCount > 0) {
        emailError = `Solo ${successCount} de ${emailRecipients.length} emails fueron enviados exitosamente`;
        console.log(`⚠️ ${emailError}`);
      } else {
        emailError = 'No se pudo enviar ningún email';
        console.log(`❌ ${emailError}`);
      }
    } else if (analysisOnly) {
      console.log('ℹ️ No se envía email porque está en modo análisis');
    } else {
      console.log('ℹ️ No se envía email porque no hay días sin promociones');
    }
    
    return new Response(JSON.stringify({
      message: 'Análisis completado',
      daysWithoutPromos,
      totalDays: daysWithoutPromos.length,
      emailSent: emailSent,
      emailError: emailError,
      emailResults: emailResults,
      emailRecipients: emailRecipients,
      emailSubject,
      emailBody
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error en send-missing-promos-email:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};