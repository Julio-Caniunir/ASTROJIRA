# Jira Dashboard - Astro Project

Un dashboard moderno para gestión de issues de Jira construido con Astro, que incluye integración con EmailJS, Microsoft Teams y funcionalidades de calendario.

## ✨ Características

- 📊 Dashboard interactivo para issues de Jira
- 📧 Integración con EmailJS para envío de correos
- 🔔 Notificaciones a Microsoft Teams via webhooks
- 📅 Vista de calendario para gestión de tareas
- 🎨 Interfaz moderna y responsive
- ⚡ Construido con Astro para máximo rendimiento

## 🚀 Estructura del Proyecto

```text
/
├── public/
│   ├── background.jpg
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Calendar.tsx
│   │   ├── EmailController.tsx
│   │   ├── JiraIssues.tsx
│   │   └── Navigation.tsx
│   ├── config/
│   ├── hooks/
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   │   └── index.astro
│   ├── styles/
│   └── types/
├── .env (local only)
├── netlify.toml
└── package.json
```

## 🛠️ Configuración

### Variables de Entorno

1. **Para desarrollo local**: Crea un archivo `.env` en la raíz del proyecto
2. **Para producción en Netlify**: Configura las variables en el dashboard de Netlify

📖 **Guía completa**: Ver [NETLIFY_ENV_SETUP.md](./NETLIFY_ENV_SETUP.md)

### Variables Requeridas

```env
# Email Configuration (Microsoft Outlook)
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=tu-email@dominio.com
EMAIL_PASS=tu-password-de-aplicacion
EMAIL_TO=destinatario@dominio.com

# Microsoft Azure Configuration
MICROSOFT_CLIENT_ID=tu_client_id
MICROSOFT_CLIENT_SECRET=tu_client_secret
MICROSOFT_REDIRECT_URI=https://tu-sitio.netlify.app/api/auth/callback

# EmailJS Configuration
PUBLIC_EMAILJS_SERVICE_ID=tu_service_id
PUBLIC_EMAILJS_TEMPLATE_ID=tu_template_id
PUBLIC_EMAILJS_PUBLIC_KEY=tu_public_key

# Microsoft Teams Webhook
PUBLIC_TEAMS_WEBHOOK_URL=tu_webhook_url
```

## 🧞 Comandos

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando                   | Acción                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Instala las dependencias                        |
| `npm run dev`             | Inicia servidor de desarrollo en `localhost:4321` |
| `npm run build`           | Construye el sitio para producción en `./dist/`  |
| `npm run preview`         | Previsualiza la build localmente                |
| `npm run astro ...`       | Ejecuta comandos CLI de Astro                   |
| `node setup-netlify-env.js` | Configura variables de entorno en Netlify    |

## 🚀 Deploy en Netlify

### Método Automático

1. **Conecta tu repositorio** en [netlify.com](https://netlify.com)
2. **Configura las variables de entorno** usando la UI de Netlify o el script automatizado:
   ```bash
   node setup-netlify-env.js
   ```
3. **Deploy automático** se activará en cada push

### Método Manual con CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Autenticarse
netlify login

# Configurar variables de entorno
node setup-netlify-env.js

# Deploy
netlify deploy --build --prod
```

## 📚 Documentación Adicional

- [NETLIFY_ENV_SETUP.md](./NETLIFY_ENV_SETUP.md) - Configuración de variables de entorno
- [EMAILJS_SETUP.md](./EMAILJS_SETUP.md) - Configuración de EmailJS
- [MICROSOFT_SETUP.md](./MICROSOFT_SETUP.md) - Configuración de Microsoft Azure

## 🔗 Enlaces Útiles

- [Documentación de Astro](https://docs.astro.build)
- [Documentación de Netlify](https://docs.netlify.com)
- [EmailJS](https://www.emailjs.com/)
- [Microsoft Azure Portal](https://portal.azure.com/)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request
