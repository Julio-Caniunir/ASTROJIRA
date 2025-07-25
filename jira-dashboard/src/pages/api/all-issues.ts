import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {


  const email = import.meta.env.JIRA_EMAIL;
  const token = import.meta.env.JIRA_TOKEN;
  const domain = import.meta.env.JIRA_DOMAIN;
  const project = import.meta.env.JIRA_PROJECT_KEY;

  if (!email || !token || !domain || !project) {
    console.error('Faltan variables de entorno de Jira. Asegúrate de que JIRA_EMAIL, JIRA_TOKEN, JIRA_DOMAIN y JIRA_PROJECT_KEY estén configuradas en Netlify.');
    return new Response(JSON.stringify({ error: 'Error de configuración del servidor: faltan credenciales de Jira.' }), { status: 500 });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  // JQL para traer issues de múltiples estados
  const jql = `project = ${project} AND status IN ("To Do", "director creativo", "piezas graficas", "T&C", "creador de campaña", "configuración e información", "PUBLICACIÓN DE PIEZAS", "Publicación de piezas")`;

  const url = `https://${domain}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=summary,status,duedate,assignee,subtasks,priority,labels&maxResults=200`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`Jira API Error: ${res.status} ${res.statusText}`);
      return new Response(JSON.stringify({ error: 'Error al consultar Jira' }), { status: 500 });
    }

    const data = await res.json();

    // DEBUG: Log de issues para días específicos
    console.log('📊 Total de issues encontrados:', data.issues?.length || 0);
    
    if (data.issues) {
      const issuesWithDates = data.issues.filter(issue => {
        const hasTitle = issue.fields?.summary;
        const hasDueDate = issue.fields?.duedate;
        return hasTitle || hasDueDate;
      });
      
      console.log('📅 Issues con fechas (título o duedate):', issuesWithDates.length);
      
      // Log específico para issues que podrían afectar días 17, 21, 22
      issuesWithDates.forEach(issue => {
        const title = issue.fields?.summary || '';
        const duedate = issue.fields?.duedate;
        
        // Buscar fechas en el título que contengan 17, 21 o 22
        if (title.includes('17') || title.includes('21') || title.includes('22')) {
          console.log(`🎯 Issue con fecha en título (17/21/22): ${issue.key} - ${title}`);
        }
        
        // Verificar duedate para días 17, 21, 22
        if (duedate) {
          const dueDateObj = new Date(duedate);
          const day = dueDateObj.getDate();
          if ([17, 21, 22].includes(day)) {
            console.log(`📆 Issue con duedate (17/21/22): ${issue.key} - ${duedate} (día ${day})`);
          }
        }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Error en el fetch a Jira:', err);
    return new Response(JSON.stringify({ error: 'Error en la conexión con Jira' }), { status: 500 });
  }
};