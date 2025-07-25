import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const email = import.meta.env.JIRA_EMAIL;
  const token = import.meta.env.JIRA_TOKEN;
  const domain = import.meta.env.JIRA_DOMAIN;
  const project = import.meta.env.JIRA_PROJECT_KEY;

  if (!email || !token || !domain || !project) {
    return new Response(JSON.stringify({ error: 'Error de configuración del servidor' }), { status: 500 });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  
  // Búsqueda amplia sin restricciones de estado
  const jql = `project = ${project} AND (summary ~ "COMBI" OR summary ~ "MISION")`;
  const jiraUrl = `https://${domain}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=summary,status,duedate&maxResults=100`;

  try {
    const res = await fetch(jiraUrl, {
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
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Error en el fetch a Jira:', err);
    return new Response(JSON.stringify({ error: 'Error en la conexión con Jira' }), { status: 500 });
  }
};