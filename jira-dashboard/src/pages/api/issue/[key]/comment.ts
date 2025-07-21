import type { APIRoute } from 'astro';
export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const issueKey = params.key;
  const email = import.meta.env.JIRA_EMAIL;
  const token = import.meta.env.JIRA_TOKEN;
  const domain = import.meta.env.JIRA_DOMAIN;

  if (!issueKey || !email || !token || !domain) {
    return new Response(JSON.stringify({ error: 'Datos incompletos' }), { status: 400 });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  const { comment } = await request.json();

  if (!comment || typeof comment !== 'string') {
    return new Response(JSON.stringify({ error: 'Comentario inválido' }), { status: 400 });
  }

  // 🔁 Convertir el comentario desde markup de react-mentions a ADF
  const mentionRegex = /@\[\{(.+?)\}\]\(id:\{(.+?)\}\)/g;
  const contentNodes: any[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(comment)) !== null) {
    const [fullMatch, displayName, accountId] = match;
    const matchIndex = match.index;

    // Texto antes de la mención
    if (matchIndex > lastIndex) {
      const textBefore = comment.slice(lastIndex, matchIndex);
      if (textBefore) {
        contentNodes.push({
          type: 'text',
          text: textBefore,
        });
      }
    }

    // Nodo de mención
    contentNodes.push({
      type: 'mention',
      attrs: {
        id: accountId,
        text: `@${displayName}`,
      },
    });

    lastIndex = matchIndex + fullMatch.length;
  }

  // Texto después de la última mención
  if (lastIndex < comment.length) {
    const remainingText = comment.slice(lastIndex);
    if (remainingText) {
      contentNodes.push({
        type: 'text',
        text: remainingText,
      });
    }
  }

  // Si no hubo menciones, enviar todo como texto
  if (contentNodes.length === 0) {
    contentNodes.push({
      type: 'text',
      text: comment,
    });
  }

  const commentUrl = `https://${domain}/rest/api/3/issue/${issueKey}/comment`;

  const payload = {
    body: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: contentNodes,
        },
      ],
    },
  };

  // Debug opcional: puedes comentar esta línea si ya todo funciona
  console.log('➡️ Payload a enviar a Jira:', JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(commentUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('❌ Jira respondió con error:', res.status, errorBody);
      return new Response(JSON.stringify({ error: 'Error al agregar comentario' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('❌ Error interno al comentar en Jira:', error);
    return new Response(JSON.stringify({ error: 'Error interno al comentar' }), { status: 500 });
  }
};
