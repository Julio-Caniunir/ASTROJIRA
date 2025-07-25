# 🚀 Guía Rápida de Deploy en Netlify

## Pasos Rápidos para Deploy

### 1. Preparar el Proyecto

```bash
# Asegúrate de que el proyecto compile correctamente
npm run build

# Verifica que no hay errores
npm run preview
```

### 2. Conectar con Netlify

#### Opción A: UI Web (Recomendado para principiantes)

1. Ve a [netlify.com](https://netlify.com) y crea una cuenta
2. Haz clic en "Add new site" > "Import an existing project"
3. Conecta tu repositorio de GitHub/GitLab/Bitbucket
4. Netlify detectará automáticamente la configuración de Astro
5. Verifica que los settings sean:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18.20.8` (se configura automáticamente)

#### Opción B: Netlify CLI

```bash
# Instalar CLI globalmente
npm install -g netlify-cli

# Autenticarse
netlify login

# Inicializar el sitio
netlify init

# Seguir las instrucciones en pantalla
```

### 3. Configurar Variables de Entorno

#### Método Automático (Recomendado)

```bash
# Usar el script automatizado
node setup-netlify-env.js
```

#### Método Manual

1. En el dashboard de Netlify, ve a:
   `Site settings` > `Environment variables`

2. Haz clic en `Add a variable` > `Import from a .env file`

3. Copia y pega el contenido de tu archivo `.env`:

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=julio.caniunir@estelarbet.com
EMAIL_PASS=pcaddictXD23@@
EMAIL_TO=julio__1995@hotmai.com
MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
MICROSOFT_REDIRECT_URI=https://tu-sitio.netlify.app/api/auth/callback
PUBLIC_EMAILJS_SERVICE_ID=service_cecrpcu
PUBLIC_EMAILJS_TEMPLATE_ID=JiraDashboard
PUBLIC_EMAILJS_PUBLIC_KEY=oRYnfWyhgMhe1LDuZ
PUBLIC_TEAMS_WEBHOOK_URL=https://estelarbetlatam.webhook.office.com/webhookb2/fdabeb19-9bf4-4ce7-8918-13f1d2ab3f80@32cbcc89-955d-4420-8e16-d848eda58eb0/IncomingWebhook/41f36215203e441c958ac05c22457dcd/9f0d7f89-d2ea-4667-8927-d880d2f75ec0/V2-izHe-i7vMnzirv6vTW5YYJfvES8RHs-oSO_W5pf6Ag1
```

4. **IMPORTANTE**: Actualiza `MICROSOFT_REDIRECT_URI` con tu URL real de Netlify

### 4. Deploy

#### Deploy Automático
- Cada `git push` a la rama principal activará un deploy automático

#### Deploy Manual
```bash
# Deploy de producción
netlify deploy --build --prod

# Deploy de preview
netlify deploy --build
```

### 5. Verificación Post-Deploy

1. **Verifica que el sitio carga correctamente**
2. **Prueba la funcionalidad de email** (EmailJS)
3. **Verifica las notificaciones de Teams**
4. **Revisa los logs de build** en caso de errores

## ⚠️ Problemas Comunes

### Build Falla

```bash
# Verifica la versión de Node.js
node --version  # Debe ser >= 18.20.8

# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

### Variables de Entorno No Funcionan

1. Verifica que las variables estén configuradas en Netlify UI
2. Asegúrate de que el scope incluya "Builds"
3. Redeploy el sitio después de cambiar variables
4. Revisa los logs de build para errores

### Errores de CORS

- Verifica que las URLs en `netlify.toml` sean correctas
- Asegúrate de que `MICROSOFT_REDIRECT_URI` apunte a tu dominio de Netlify

### Funciones No Funcionan

- Verifica que las funciones estén en `netlify/functions/`
- Revisa los logs de funciones en el dashboard de Netlify

## 📋 Checklist de Deploy

- [ ] Proyecto compila localmente (`npm run build`)
- [ ] Variables de entorno configuradas en Netlify
- [ ] `MICROSOFT_REDIRECT_URI` actualizada con URL de producción
- [ ] `netlify.toml` presente en la raíz del proyecto
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Node version: `18.20.8` o superior
- [ ] Deploy exitoso sin errores
- [ ] Sitio funciona correctamente en producción
- [ ] EmailJS funciona
- [ ] Webhooks de Teams funcionan

## 🔗 Enlaces Útiles

- [Dashboard de Netlify](https://app.netlify.com/)
- [Documentación de Netlify](https://docs.netlify.com/)
- [Netlify CLI Docs](https://cli.netlify.com/)
- [Astro + Netlify Guide](https://docs.astro.build/en/guides/deploy/netlify/)

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs de build en Netlify
2. Verifica la [documentación completa](./NETLIFY_ENV_SETUP.md)
3. Consulta la [documentación oficial de Netlify](https://docs.netlify.com/)