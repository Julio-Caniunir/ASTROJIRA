# Configuración de Variables de Entorno en Netlify

Como el archivo `.env` no se sube al deployment de Netlify por seguridad, necesitas configurar las variables de entorno directamente en la plataforma de Netlify.

## Métodos para Configurar Variables de Entorno

### 1. A través de la Interfaz Web de Netlify (Recomendado)

1. **Accede a tu dashboard de Netlify**
   - Ve a [netlify.com](https://netlify.com) e inicia sesión
   - Selecciona tu sitio del dashboard

2. **Navega a las Variables de Entorno**
   - Ve a `Site settings` > `Environment variables`
   - O directamente: `Project configuration` > `Environment variables`

3. **Agregar Variables Individualmente**
   - Haz clic en `Add a variable`
   - Ingresa el nombre y valor de cada variable
   - Selecciona el scope apropiado (generalmente `Builds` y `Post processing`)

4. **Importar desde archivo .env**
   - Haz clic en `Add a variable` > `Import from a .env file`
   - Copia y pega el contenido de tu archivo `.env`
   - Netlify automáticamente parseará las variables

### 2. A través de Netlify CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Iniciar sesión
netlify login

# Configurar variables individuales
netlify env:set EMAIL_HOST smtp.office365.com
netlify env:set EMAIL_PORT 587
netlify env:set EMAIL_USER julio.caniunir@estelarbet.com

# Importar desde archivo .env
netlify env:import .env
```

## Variables de Entorno para tu Proyecto

Basándote en tu archivo `.env`, necesitas configurar estas variables en Netlify:

### Variables de Email (Microsoft Outlook)
```
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=julio.caniunir@estelarbet.com
EMAIL_PASS=pcaddictXD23@@
EMAIL_TO=julio__1995@hotmai.com
```

### Variables de Microsoft Azure
```
MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
MICROSOFT_REDIRECT_URI=https://tu-sitio.netlify.app/api/auth/callback
```
**Nota:** Actualiza `MICROSOFT_REDIRECT_URI` con tu URL de producción de Netlify.

### Variables de EmailJS (Públicas)
```
PUBLIC_EMAILJS_SERVICE_ID=service_cecrpcu
PUBLIC_EMAILJS_TEMPLATE_ID=JiraDashboard
PUBLIC_EMAILJS_PUBLIC_KEY=oRYnfWyhgMhe1LDuZ
```

### Variable de Microsoft Teams Webhook
```
PUBLIC_TEAMS_WEBHOOK_URL=https://estelarbetlatam.webhook.office.com/webhookb2/fdabeb19-9bf4-4ce7-8918-13f1d2ab3f80@32cbcc89-955d-4420-8e16-d848eda58eb0/IncomingWebhook/41f36215203e441c958ac05c22457dcd/9f0d7f89-d2ea-4667-8927-d880d2f75ec0/V2-izHe-i7vMnzirv6vTW5YYJfvES8RHs-oSO_W5pf6Ag1
```

## Configuración por Contextos de Deploy

Puedes configurar diferentes valores para diferentes entornos:

- **Production**: Variables para el sitio en producción
- **Deploy Preview**: Variables para previews de pull requests
- **Branch Deploy**: Variables para deploys de ramas específicas

### Usando netlify.toml (Opcional)

Puedes crear un archivo `netlify.toml` en la raíz del proyecto para configurar variables no sensibles:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[context.production.environment]
  NODE_ENV = "production"

[context.deploy-preview.environment]
  NODE_ENV = "preview"

[context.branch-deploy.environment]
  NODE_ENV = "development"
```

## Consideraciones de Seguridad

1. **Variables Sensibles**: Nunca pongas passwords, API keys, o tokens en `netlify.toml` ya que este archivo se commitea al repositorio.

2. **Variables Públicas**: Las variables que empiezan con `PUBLIC_` en Astro son accesibles desde el cliente, úsalas solo para datos no sensibles.

3. **Scope de Variables**: Asegúrate de seleccionar el scope correcto:
   - `Builds`: Para variables usadas durante el build
   - `Post processing`: Para funciones post-build
   - `Runtime`: Para funciones serverless

## Verificación

Después de configurar las variables:

1. **Redeploy tu sitio** para que las variables tomen efecto
2. **Verifica en los logs de build** que las variables se están cargando correctamente
3. **Prueba la funcionalidad** que depende de estas variables

## Troubleshooting

- **Variables no disponibles**: Asegúrate de que el scope incluya `Builds`
- **Valores incorrectos**: Verifica que no haya espacios extra o caracteres especiales
- **Deploy context**: Confirma que estás configurando las variables para el contexto correcto

## Enlaces Útiles

- [Documentación oficial de Variables de Entorno en Netlify](https://docs.netlify.com/build/environment-variables/)
- [Guía de Deploy de Astro en Netlify](https://docs.astro.build/en/guides/deploy/netlify/)
- [Netlify CLI Documentation](https://cli.netlify.com/)