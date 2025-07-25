# Configuración de EmailJS

EmailJS permite enviar emails directamente desde el navegador sin necesidad de un servidor backend. Es una solución más simple y segura que no requiere configurar contraseñas de aplicación.

## Ventajas de EmailJS

✅ **Sin configuración de servidor**: Funciona directamente desde el cliente  
✅ **Sin contraseñas**: No necesitas contraseñas de aplicación  
✅ **Seguro**: Las credenciales se mantienen en el servidor de EmailJS  
✅ **Fácil configuración**: Solo necesitas 3 valores de configuración  
✅ **Soporte múltiple**: Compatible con Gmail, Outlook, Yahoo, etc.  

## Pasos de Configuración

### 1. Crear cuenta en EmailJS

1. Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
2. Haz clic en "Create Free Account"
3. Completa el registro con tu email

### 2. Conectar tu servicio de email

1. En el dashboard, ve a "Email Services"
2. Haz clic en "Add New Service"
3. Selecciona tu proveedor de email:
   - **Gmail**: Para cuentas @gmail.com
   - **Outlook**: Para cuentas @outlook.com, @hotmail.com
   - **Office 365**: Para cuentas corporativas como @estelarbet.com
4. Sigue las instrucciones para conectar tu cuenta
5. Copia el **Service ID** que se genera

### 3. Crear template de email

1. Ve a "Email Templates"
2. Haz clic en "Create New Template"
3. Configura el template con estos campos:
   ```
   To: {{to_email}}
   From: {{from_email}}
   Subject: {{subject}}
   Content: {{message}}
   ```
4. Guarda el template y copia el **Template ID**

### 4. Obtener Public Key

1. Ve a "Account" → "General"
2. Copia tu **Public Key**

### 5. Configurar variables de entorno

Actualiza tu archivo `.env` con los valores obtenidos:

```env
# EmailJS configuration
PUBLIC_EMAILJS_SERVICE_ID=service_xxxxxxx
PUBLIC_EMAILJS_TEMPLATE_ID=template_xxxxxxx
PUBLIC_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
```

## Ejemplo de Template

Aquí tienes un ejemplo de template que puedes usar:

**Subject:** `{{subject}}`

**Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Nuevo mensaje desde Jira Dashboard</h2>
        </div>
        <div class="content">
            {{message}}
        </div>
        <div class="footer">
            <p>Enviado desde: {{from_email}}</p>
        </div>
    </div>
</body>
</html>
```

## Límites del Plan Gratuito

- **200 emails/mes** en el plan gratuito
- **Sin límite de templates**
- **Soporte básico**

Para más emails, considera actualizar a un plan de pago.

## Solución de Problemas

### Error: "Service ID not found"
- Verifica que el Service ID sea correcto
- Asegúrate de que el servicio esté activo

### Error: "Template ID not found"
- Verifica que el Template ID sea correcto
- Asegúrate de que el template esté publicado

### Error: "Public Key invalid"
- Verifica que el Public Key sea correcto
- Regenera el Public Key si es necesario

### Emails no llegan
- Revisa la carpeta de spam
- Verifica que el email de destino sea válido
- Comprueba los límites de tu plan

## Migración desde SMTP

Este proyecto ahora usa EmailJS en lugar del sistema SMTP anterior. Las ventajas incluyen:

- ❌ **Antes**: Configuración compleja de SMTP + contraseñas de aplicación
- ✅ **Ahora**: Configuración simple con 3 variables de entorno

- ❌ **Antes**: Problemas de autenticación y seguridad
- ✅ **Ahora**: Autenticación manejada por EmailJS

- ❌ **Antes**: Dependiente del servidor backend
- ✅ **Ahora**: Funciona directamente desde el cliente

## Soporte

Si tienes problemas con la configuración:

1. Revisa la [documentación oficial de EmailJS](https://www.emailjs.com/docs/)
2. Verifica que todas las variables de entorno estén configuradas
3. Comprueba la consola del navegador para errores específicos