import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {


  const email = import.meta.env.JIRA_EMAIL;
  const token = import.meta.env.JIRA_TOKEN;
  const domain = import.meta.env.JIRA_DOMAIN;
  const project = import.meta.env.JIRA_PROJECT_KEY;

  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  // JQL para traer solo issues del estado "PUBLICACIÓN DE PIEZAS"
  const jql = `project = ${project} AND status = "PUBLICACIÓN DE PIEZAS"`;

  const url = `https://${domain}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=summary,status,duedate,assignee,subtasks,priority,labels`;

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



    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Error en el fetch a Jira:', err);
    return new Response(JSON.stringify({ error: 'Error en la conexión con Jira' }), { status: 500 });
  }
};
