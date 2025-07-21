import type { APIRoute } from 'astro';
export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  const { key, commentId } = params;
  const email = import.meta.env.JIRA_EMAIL;
  const token = import.meta.env.JIRA_TOKEN;
  const domain = import.meta.env.JIRA_DOMAIN;

  if (!key || !commentId || !email || !token || !domain) {
    return new Response(JSON.stringify({ error: 'Datos incompletos' }), { status: 400 });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  try {
    const res = await fetch(`https://${domain}/rest/api/3/issue/${key}/comment/${commentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'No se pudo eliminar el comentario' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error al eliminar comentario' }), { status: 500 });
  }
};
