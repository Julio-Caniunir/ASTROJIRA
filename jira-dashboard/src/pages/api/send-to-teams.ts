import type { APIRoute } from 'astro';
export const prerender = false;

interface TeamsCard {
  "@type": string;
  "@context": string;
  themeColor: string;
  summary: string;
  sections: Array<{
    activityTitle: string;
    activitySubtitle?: string;
    facts?: Array<{
      name: string;
      value: string;
    }>;
    text?: string;
  }>;
  potentialAction?: Array<{
    "@type": string;
    name: string;
    targets: Array<{
      os: string;
      uri: string;
    }>;
  }>;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { webhookUrl } = await request.json();

    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: 'URL del webhook es requerida' }), { status: 400 });
    }

    // Obtener los issues de Jira
    const email = import.meta.env.JIRA_EMAIL;
    const token = import.meta.env.JIRA_TOKEN;
    const domain = import.meta.env.JIRA_DOMAIN;
    const project = import.meta.env.JIRA_PROJECT_KEY;

    if (!email || !token || !domain || !project) {
      return new Response(JSON.stringify({ error: 'Error de configuración del servidor' }), { status: 500 });
    }

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const jql = `project = ${project} AND status IN ("To Do", "director creativo", "piezas graficas", "T&C", "creador de campaña", "configuración e información", "PUBLICACIÓN DE PIEZAS", "Publicación de piezas")`;
    const url = `https://${domain}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=summary,status,duedate,assignee,subtasks,priority,labels&maxResults=200`;

    const jiraResponse = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (!jiraResponse.ok) {
      return new Response(JSON.stringify({ error: 'Error al consultar Jira' }), { status: 500 });
    }

    const jiraData = await jiraResponse.json();
    const issues = jiraData.issues || [];
    
    // Función para extraer fechas de los títulos (misma lógica que Calendar.tsx)
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
          } else if (index === 2 || index === 3) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            
            if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
              const date = new Date(currentYear, month, day);
              dates.push(date);
            }
          } else if (index === 4) {
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

    // Extraer fechas de los títulos de todos los issues
    const issueDates = new Set<string>();
    
    issues.forEach((issue: any) => {
      const dates = extractDateFromTitle(issue.fields.summary);
      dates.forEach(date => {
        issueDates.add(date.toISOString().split('T')[0]);
      });
    });

    // Obtener días del mes actual
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const daysWithoutPromos: string[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      if (!issueDates.has(dateString)) {
        const formattedDate = `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
        daysWithoutPromos.push(formattedDate);
      }
    }

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const currentMonth = monthNames[month];
    const totalDays = daysInMonth;
    const daysWithPromos = totalDays - daysWithoutPromos.length;
    const coveragePercentage = Math.round((daysWithPromos / totalDays) * 100);

    // Determinar el color y estado basado en la cobertura
    let themeColor = "4CAF50"; // Verde por defecto
    let statusIcon = "🎉";
    let statusText = "Excelente";
    
    if (coveragePercentage < 50) {
      themeColor = "FF4444"; // Rojo crítico
      statusIcon = "🚨";
      statusText = "Crítico";
    } else if (coveragePercentage < 80) {
      themeColor = "FF9800"; // Naranja advertencia
      statusIcon = "⚠️";
      statusText = "Atención";
    } else if (coveragePercentage < 100) {
      themeColor = "2196F3"; // Azul bueno
      statusIcon = "📈";
      statusText = "Bueno";
    }

    // Crear la tarjeta de Teams mejorada
    const teamsCard: TeamsCard = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": themeColor,
      "summary": `${statusIcon} Reporte Promocional ${currentMonth} ${year} - ${statusText}`,
      "sections": [
        {
          "activityTitle": `🎯 **Dashboard Promocional - ${currentMonth} ${year}**`,
          "activitySubtitle": `${statusIcon} Estado: **${statusText}** | Cobertura: **${coveragePercentage}%**`,
          "facts": [
            {
              "name": "📅 **Total días del mes**",
              "value": `**${totalDays}** días`
            },
            {
              "name": "✅ **Días con promociones**",
              "value": `**${daysWithPromos}** días`
            },
            {
              "name": "❌ **Días sin promociones**",
              "value": `**${daysWithoutPromos.length}** días`
            },
            {
              "name": "📊 **Cobertura promocional**",
              "value": `**${coveragePercentage}%** ${coveragePercentage >= 90 ? '🏆' : coveragePercentage >= 70 ? '👍' : '⚠️'}`
            }
          ]
        }
      ]
    };

    // Agregar sección con días sin promociones si existen
    if (daysWithoutPromos.length > 0) {
      // Agrupar días por semanas para mejor visualización
      const groupedDays: string[] = [];
      let currentWeek: string[] = [];
      
      daysWithoutPromos.forEach((day, index) => {
        currentWeek.push(day.split('/')[0]); // Solo el día
        
        // Cada 7 días o al final, agregar la semana
        if (currentWeek.length === 7 || index === daysWithoutPromos.length - 1) {
          groupedDays.push(`📅 **Semana ${Math.ceil((index + 1) / 7)}:** ${currentWeek.join(', ')}`);
          currentWeek = [];
        }
      });
      
      const urgencyLevel = daysWithoutPromos.length > 15 ? "🚨 **URGENTE**" : daysWithoutPromos.length > 7 ? "⚠️ **ATENCIÓN**" : "📋 **REVISAR**";
      
      teamsCard.sections.push({
        "activityTitle": `${urgencyLevel} - Días sin promociones (${daysWithoutPromos.length})`,
        "text": `**${daysWithoutPromos.length} días** requieren atención inmediata:\n\n${groupedDays.join('\n\n')}\n\n---\n\n💡 **Recomendación:** Programar promociones para estos días lo antes posible.`
      });
    } else {
      teamsCard.sections.push({
        "activityTitle": "🏆 ¡Cobertura Perfecta!",
        "text": "🎉 **¡Felicitaciones!** Todos los días del mes tienen promociones programadas.\n\n✨ El equipo ha logrado una cobertura del **100%** para este mes."
      });
    }

    // Agregar sección de métricas avanzadas y acciones
    const today = new Date();
    const currentDay = today.getDate();
    const remainingDays = daysInMonth - currentDay;
    const daysPassedWithoutPromos = daysWithoutPromos.filter(day => {
      const dayNum = parseInt(day.split('/')[0]);
      return dayNum <= currentDay;
    }).length;
    
    teamsCard.sections.push({
      "activityTitle": "📈 Métricas y Acciones Recomendadas",
      "facts": [
        {
          "name": "📍 **Día actual**",
          "value": `${currentDay}/${daysInMonth} (${Math.round((currentDay/daysInMonth)*100)}% del mes)`
        },
        {
          "name": "⏰ **Días restantes**",
          "value": `${remainingDays} días`
        },
        {
          "name": "🔍 **Días perdidos**",
          "value": `${daysPassedWithoutPromos} días sin promo`
        },
        {
          "name": "🎯 **Objetivo sugerido**",
          "value": coveragePercentage >= 90 ? "Mantener excelencia" : coveragePercentage >= 70 ? "Mejorar cobertura" : "Acción inmediata"
        }
      ],
      "text": `\n**🚀 Próximos pasos:**\n${coveragePercentage < 70 ? '• 🚨 Reunión de emergencia para planificar promociones\n• 📋 Revisar calendario de contenidos\n• 👥 Asignar responsables por día' : coveragePercentage < 90 ? '• 📅 Completar días faltantes\n• 🔄 Revisar estrategia promocional\n• ✅ Validar contenidos pendientes' : '• 🏆 ¡Mantener el excelente trabajo!\n• 📊 Monitorear métricas de engagement\n• 🎉 Celebrar logros del equipo'}`
    });

    // Enviar a Teams
    const teamsResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamsCard),
    });

    if (!teamsResponse.ok) {
      const errorText = await teamsResponse.text();
      throw new Error(`Error al enviar a Teams: ${teamsResponse.status} - ${errorText}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Mensaje enviado a Teams exitosamente',
      daysWithoutPromos: daysWithoutPromos.length,
      totalDays,
      coveragePercentage,
      details: {
        month: currentMonth,
        year,
        daysWithPromos,
        missingDays: daysWithoutPromos
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error al enviar a Teams:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};