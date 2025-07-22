import type { APIRoute } from 'astro';
export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const fileId = params.id;
  const email = import.meta.env.JIRA_EMAIL;
  const token = import.meta.env.JIRA_TOKEN;
  const domain = import.meta.env.JIRA_DOMAIN;

  if (!fileId || !email || !token || !domain) {
    return new Response(JSON.stringify({ error: 'Datos incompletos' }), { status: 400 });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const isMediaId = url.searchParams.get('mediaId') === 'true';

  try {
    if (isMediaId) {
      // Si es un Media ID, intentar obtener información a través de la Media API
      const mediaApiUrl = 'https://api.media.atlassian.com/items';
      const mediaRes = await fetch(mediaApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          descriptors: [{
            id: fileId,
            mediaType: 'file',
            mimeType: '*'
          }]
        })
      });

      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        if (mediaData.data && mediaData.data.length > 0) {
          const mediaItem = mediaData.data[0];
          // Intentar descargar usando la URL de la Media API
          if (mediaItem.artifacts && mediaItem.artifacts.length > 0) {
            const artifact = mediaItem.artifacts[0];
            const downloadRes = await fetch(artifact.url, {
              headers: {
                Authorization: `Basic ${auth}`,
              },
            });

            if (downloadRes.ok) {
              const fileBuffer = await downloadRes.arrayBuffer();
              return new Response(fileBuffer, {
                status: 200,
                headers: {
                  'Content-Type': mediaItem.mimeType || 'application/octet-stream',
                  'Content-Disposition': `attachment; filename="${mediaItem.name || 'file'}"`,
                  'Content-Length': fileBuffer.byteLength.toString(),
                },
              });
            }
          }
        }
      }
    }

    // Fallback: intentar como attachment ID normal
    const attachmentUrl = `https://${domain}/rest/api/3/attachment/${fileId}`;
    const attachmentRes = await fetch(attachmentUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (!attachmentRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to get attachment info' }), { status: 404 });
    }

    const attachmentInfo = await attachmentRes.json();

    // Descargar el contenido del archivo
    const contentRes = await fetch(attachmentInfo.content, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!contentRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to download file' }), { status: 404 });
    }

    const fileBuffer = await contentRes.arrayBuffer();

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': attachmentInfo.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${attachmentInfo.filename}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading attachment:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};