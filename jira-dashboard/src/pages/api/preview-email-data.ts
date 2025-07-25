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
      return new Response(JSON.stringify({ error: 'Faltan credenciales de Jira' }), { status: 500 });
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
      return new Response(JSON.stringify({ error: 'Error al consultar Jira' }), { status: 500 });
    }

    const data = await res.json();
    const issues = data.issues || [];

    // Función para extraer fechas de los títulos
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

    // Generar rango de fechas SOLO para el mes actual
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const daysWithoutPromos: string[] = [];
    const daysWithPromos: Array<{date: string, promos: Array<{id: string, name: string}>}> = [];
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // Crear un mapa de fechas a issues para obtener detalles (evitando duplicados)
    const dateToIssues = new Map<string, Map<string, {id: string, summary: string}>>();
    
    issuesWithDates.forEach(({issue, dates}) => {
      dates.forEach(date => {
        const dateStr = date.toDateString();
        if (!dateToIssues.has(dateStr)) {
          dateToIssues.set(dateStr, new Map());
        }
        // Usar el ID del issue como clave para evitar duplicados
        dateToIssues.get(dateStr)!.set(issue.key, {
          id: issue.key,
          summary: issue.fields.summary
        });
      });
    });
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toDateString();
      const dayName = dayNames[d.getDay()];
      const formattedDate = `${dayName} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      
      if (!titleDates.has(dateStr)) {
        daysWithoutPromos.push(formattedDate);
      } else {
        const issuesMapForDate = dateToIssues.get(dateStr) || new Map();
        const promos = Array.from(issuesMapForDate.values()).map(issue => ({
          id: issue.id,
          name: issue.summary
        }));
        daysWithPromos.push({
          date: formattedDate,
          promos: promos
        });
      }
    }

    // Calcular total de días en el mes
    const totalDays = endDate.getDate();
    const currentMonth = monthNames[today.getMonth()];
    
    return new Response(JSON.stringify({
      success: true,
      currentMonth: currentMonth,
      totalDays: totalDays,
      daysWithPromos: daysWithPromos.length,
      daysWithoutPromos: daysWithoutPromos,
      daysWithoutPromosList: daysWithoutPromos,
      daysWithPromosList: daysWithPromos,
      issuesAnalyzed: issues.length,
      issuesWithDates: issuesWithDates.length,
      coverage: Math.round((daysWithPromos.length / totalDays) * 100)
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('Error en preview-email-data:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};