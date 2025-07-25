# Configuración de Microsoft Azure para Autenticación OAuth

Para que funcione la autenticación de Microsoft y el envío de correos, necesitas configurar una aplicación en Microsoft Azure.

## Pasos para configurar Microsoft Azure App Registration

### 1. Crear una App Registration en Azure Portal

1. Ve a [Azure Portal](https://portal.azure.com/)
2. Busca "App registrations" en la barra de búsqueda
3. Haz clic en "+ New registration"
4. Completa los siguientes campos:
   - **Name**: `Jira Dashboard Email Service`
   - **Supported account types**: `Accounts in any organizational directory and personal Microsoft accounts`
   - **Redirect URI**: 
     - Platform: `Web`
     - URI: `http://localhost:4322/api/auth/callback`

### 2. Obtener el Client ID

1. Una vez creada la aplicación, ve a la página "Overview"
2. Copia el **Application (client) ID**
3. Pégalo en el archivo `.env` como `MICROSOFT_CLIENT_ID`

### 3. Crear un Client Secret

1. Ve a "Certificates & secrets" en el menú lateral
2. Haz clic en "+ New client secret"
3. Agrega una descripción: `Jira Dashboard Secret`
4. Selecciona una expiración (recomendado: 24 meses)
5. Haz clic en "Add"
6. **IMPORTANTE**: Copia inmediatamente el **Value** del secret (no el Secret ID)
7. Pégalo en el archivo `.env` como `MICROSOFT_CLIENT_SECRET`

### 4. Configurar Permisos de API

1. Ve a "API permissions" en el menú lateral
2. Haz clic en "+ Add a permission"
3. Selecciona "Microsoft Graph"
4. Selecciona "Delegated permissions"
5. Busca y agrega los siguientes permisos:
   - `Mail.Send`
   - `User.Read`
6. Haz clic en "Add permissions"
7. **Opcional**: Haz clic en "Grant admin consent" si tienes permisos de administrador

### 5. Configurar Authentication

1. Ve a "Authentication" en el menú lateral
2. En "Platform configurations", verifica que esté configurado:
   - **Redirect URIs**: `http://localhost:4322/api/auth/callback`
3. En "Advanced settings":
   - Marca "Allow public client flows": `No`
   - "Supported account types": debe estar en `Accounts in any organizational directory and personal Microsoft accounts`

## Configuración del archivo .env

Después de completar los pasos anteriores, tu archivo `.env` debe verse así:

```env
# Microsoft Azure Configuration
MICROSOFT_CLIENT_ID=tu_client_id_aqui
MICROSOFT_CLIENT_SECRET=tu_client_secret_aqui
MICROSOFT_REDIRECT_URI=http://localhost:4322/api/auth/callback
```

## Verificación

Para verificar que todo está configurado correctamente:

1. Reinicia el servidor de desarrollo: `npm run dev`
2. Ve a `http://localhost:4322/`
3. Haz clic en "🔐 Iniciar sesión con Microsoft"
4. Deberías ser redirigido a la página de login de Microsoft

## Solución de Problemas

### Error: "invalid_client_credential"
- Verifica que `MICROSOFT_CLIENT_SECRET` esté configurado correctamente
- Asegúrate de haber copiado el **Value** del secret, no el **Secret ID**
- Verifica que el secret no haya expirado

### Error: "redirect_uri_mismatch"
- Verifica que la URI de redirección en Azure coincida exactamente con `MICROSOFT_REDIRECT_URI`
- Asegúrate de que no haya espacios extra o caracteres especiales

### Error: "insufficient_scope"
- Verifica que los permisos `Mail.Send` y `User.Read` estén agregados
- Si es posible, otorga consentimiento de administrador

## Notas Importantes

- **Nunca compartas tu Client Secret** en repositorios públicos
- El Client Secret tiene fecha de expiración, necesitarás renovarlo periódicamente
- Para producción, cambia la URI de redirección a tu dominio real
- Los permisos pueden requerir consentimiento del administrador en organizaciones corporativas