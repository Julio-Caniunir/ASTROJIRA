import type { APIRoute } from 'astro';
export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const issueKey = params.key;
  const email = import.meta.env.JIRA_EMAIL;
  const token = import.meta.env.JIRA_TOKEN;
  const domain = import.meta.env.JIRA_DOMAIN;

  if (!issueKey || !email || !token || !domain) {
    return new Response(JSON.stringify({ error: 'Datos incompletos' }), { status: 400 });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  // ✅ ¿Piden transiciones?
  const getTransitions = url.searchParams.get('transitions');
  if (getTransitions === 'true') {
    const transitionsUrl = `https://${domain}/rest/api/3/issue/${issueKey}/transitions`;

    try { 
      const transitionsRes = await fetch(transitionsUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
      });

      if (!transitionsRes.ok) {
        return new Response(JSON.stringify({ error: 'No se pudieron obtener transiciones' }), { status: 500 });
      }

      const data = await transitionsRes.json();
      const options = data.transitions.map((t: any) => t.name);
      return new Response(JSON.stringify(options), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Error al obtener transiciones' }), { status: 500 });
    }
  }
  // ✅ Obtener menciones (usuarios asignables)
  if (url.searchParams.get('mentions') === 'true') {
    const query = url.searchParams.get('query') || '';
const usersUrl = `https://${domain}/rest/api/3/user/search?query=${encodeURIComponent(query)}&maxResults=20`;
    try {
      const userRes = await fetch(usersUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
      });

      if (!userRes.ok) {
        return new Response(JSON.stringify({ error: 'No se pudieron obtener usuarios' }), { status: 500 });
      }

      const users = await userRes.json();
      const mentions = users
      .filter((u: any) => u.accountId && u.displayName) // ✅ evita undefined
      .map((u: any) => ({
        id: u.accountId,
        display: u.displayName,
      }));

      return new Response(JSON.stringify(mentions), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Error al obtener usuarios' }), { status: 500 });
    }
  }

  // ✅ Detalle del issue
  const issueUrl = `https://${domain}/rest/api/3/issue/${issueKey}?fields=summary,description,status,assignee,duedate,comment,subtasks,attachment`;

  try {
    const res = await fetch(issueUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Error al obtener la tarea' }), { status: 500 });
    }

    const data = await res.json();

    const comments = data.fields.comment?.comments?.map((c: any) => ({
      id: c.id,
      body: c.body,
      author: c.author.displayName,
      created: c.created,
    })) || [];

    const attachments = data.fields.attachment?.map((att: any) => ({
      id: att.id,
      filename: att.filename,
      mimeType: att.mimeType,
      content: att.content,
      size: att.size,
      created: att.created,
      author: att.author.displayName,
    })) || [];

    return new Response(JSON.stringify({
      key: data.key,
      fields: {
        ...data.fields,
        attachment: attachments,
      },
      comments,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  const issueKey = params.key;
  const email = import.meta.env.JIRA_EMAIL;
  const token = import.meta.env.JIRA_TOKEN;
  const domain = import.meta.env.JIRA_DOMAIN;

  if (!issueKey || !email || !token || !domain) {
    return new Response(JSON.stringify({ error: 'Datos incompletos' }), { status: 400 });
  }

  const { newStatus } = await request.json();
  if (!newStatus) {
    return new Response(JSON.stringify({ error: 'Estado no proporcionado' }), { status: 400 });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const transitionsUrl = `https://${domain}/rest/api/3/issue/${issueKey}/transitions`;

  try {
    // Obtener ID de transición
    const transitionsRes = await fetch(transitionsUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });
    const transitionsData = await transitionsRes.json();
    const matched = transitionsData.transitions.find((t: any) => t.name === newStatus);

    if (!matched) {
      return new Response(JSON.stringify({ error: 'Transición no válida' }), { status: 400 });
    }

    // Aplicar transición
    const result = await fetch(transitionsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transition: { id: matched.id } }),
    });

    if (!result.ok) {
      return new Response(JSON.stringify({ error: 'No se pudo aplicar transición' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};
