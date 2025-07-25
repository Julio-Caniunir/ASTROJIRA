# 🔧 Solución de Problemas EmailJS

## ❌ Problema: "Email enviado exitosamente" pero no llega nada

### 🔍 Diagnóstico
Si ves en la consola:
```
EmailJS inicializado correctamente
Email enviado exitosamente: EmailJSResponseStatus
```

Pero no recibes emails, el problema está en la **configuración del template** en EmailJS.

### ✅ Solución Paso a Paso

#### 1. Verificar Template en EmailJS

1. Ve a https://dashboard.emailjs.com/admin/templates
2. Edita tu template "JiraDashboard"
3. **IMPORTANTE**: Asegúrate de que el template tenga exactamente estos campos:

**Subject (Asunto):**
```
Contact Us: {{subject}}
```

**Content (Contenido del email):**
```html
A message by {{name}} has been received. Kindly respond at your earliest convenience.

{{name}}
{{email}}

{{{message}}}
```

**⚠️ IMPORTANTE**: Asegúrate de usar **{{{message}}}** (3 llaves) NO **{{message}}** (2 llaves)

**Para HTML completo, usa este template exacto:**
```html
<div style="font-family: system-ui, sans-serif, Arial; font-size: 12px"> 
   <div>A message by {{name}} has been received. Kindly respond at your earliest convenience.</div> 
   <div 
     style=" 
       margin-top: 20px; 
       padding: 15px 0; 
       border-width: 1px 0; 
       border-style: dashed; 
       border-color: lightgrey; 
     " 
   > 
     <table role="presentation"> 
       <tr> 
         <td style="vertical-align: top"> 
           <div 
             style=" 
               padding: 6px 10px; 
               margin: 0 10px; 
               background-color: aliceblue; 
               border-radius: 5px; 
               font-size: 26px; 
             " 
             role="img" 
           > 
             👤 
           </div> 
         </td> 
         <td style="vertical-align: top"> 
           <div style="color: #2c3e50; font-size: 16px"> 
             <strong>{{name}}</strong> 
           </div> 
           <div style="color: #cccccc; font-size: 13px">{{time}}</div> 
           <p style="font-size: 16px">{{{message}}}</p> 
         </td> 
       </tr> 
     </table> 
   </div> 
 </div>
```

**Settings (Configuración):**
- **To Email**: `{{to_email}}`
- **From Name**: `{{name}}`
- **From Email**: Usar "Use Default Email Address"
- **Reply To**: `{{email}}`

#### 2. Verificar Servicio de Email

1. Ve a https://dashboard.emailjs.com/admin
2. Verifica que tu servicio esté **conectado correctamente**
3. Para Gmail:
   - Asegúrate de usar **App Password** (no tu contraseña normal)
   - Verifica que 2FA esté activado
   - El email debe estar verificado

#### 3. Probar Template

1. En EmailJS Dashboard, ve a tu template
2. Haz clic en "Test it"
3. Llena los campos de prueba:
   ```
   name: Tu Nombre
   email: julio.caniunir@estelarbet.com
   message: <p>Este es un mensaje de prueba desde Jira Dashboard</p>
   to_email: tu-email@ejemplo.com
   subject: Prueba de Template
   ```
4. Envía la prueba
5. **Revisa tu bandeja de entrada Y spam**

### 🚨 Errores Comunes

#### Error 1: Campos del Template No Coinciden
**Problema**: Los campos en el código no coinciden con el template

**Solución**: Nuestro código envía:
- `name` (nombre del remitente)
- `email` (email del remitente)
- `message` (contenido del mensaje)
- `to_email` (destinatario)
- `subject` (asunto)
- `time` (fecha y hora actual)

El template DEBE usar exactamente estos nombres.

#### Error 2: HTML no se Renderiza
**Problema**: El contenido HTML aparece como texto plano

**Solución**: En el template, usa `{{{message}}}` (3 llaves) en lugar de `{{message}}` (2 llaves)

#### Error 3: Emails van a Spam
**Problema**: Los emails se envían pero van a spam

**Solución**:
1. Configura SPF/DKIM en tu dominio
2. Usa un email verificado como remitente
3. Evita palabras spam en el asunto
4. Incluye texto plano además de HTML

### 🔧 Template Recomendado Completo

**Subject:**
```
{{subject}}
```

**HTML Content:**
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #0078d4;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: white;
            padding: 30px;
            border: 1px solid #ddd;
        }
        .footer {
            background: #f8f9fa;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-radius: 0 0 8px 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📧 {{subject}}</h1>
    </div>
    <div class="content">
        {{{message}}}
    </div>
    <div class="footer">
        <p>Enviado desde Jira Dashboard</p>
        <p>De: {{from_email}} | Para: {{to_email}}</p>
        <p>📅 Fecha: {{date}}</p>
    </div>
</body>
</html>
```

**Text Content (opcional pero recomendado):**
```
{{subject}}
===================

{{message}}

---
Enviado desde Jira Dashboard
De: {{from_email}}
Para: {{to_email}}
```

**Settings:**
- **To Email**: `{{to_email}}`
- **From Name**: `Jira Dashboard`
- **From Email**: `{{from_email}}`
- **Reply To**: `{{reply_to}}`

### 📊 Verificación Final

1. ✅ Template configurado con campos correctos
2. ✅ Servicio de email conectado y verificado
3. ✅ Variables de entorno correctas en `.env`
4. ✅ Prueba manual desde EmailJS Dashboard exitosa
5. ✅ Email de prueba recibido (revisar spam)

### 🆘 Si Aún No Funciona

1. **Revisa los logs de EmailJS Dashboard**
2. **Verifica el límite de emails** (200/mes en plan gratuito)
3. **Prueba con otro email de destino**
4. **Contacta soporte de EmailJS** si el problema persiste

## 📧 Problema: Email No Llega a Destino

### 🔍 Diagnóstico Paso a Paso

**1. Verifica en EmailJS Dashboard:**
- Ve a https://dashboard.emailjs.com/admin/integration
- Revisa el **historial de emails enviados**
- Verifica el **estado de cada envío**

**2. Revisa la Configuración del Servicio de Email:**

**Para Gmail:**
- ✅ **2FA activado** en tu cuenta Google
- ✅ **App Password generada** (no uses tu contraseña normal)
- ✅ **Servicio conectado** correctamente en EmailJS
- ✅ **"Less secure app access"** deshabilitado (usa App Password)

**Para Outlook/Hotmail:**
- ✅ **App Password generada** en security.microsoft.com
- ✅ **SMTP settings** correctos en EmailJS

**3. Problemas Comunes de Entrega:**

**🚫 Emails van a SPAM:**
- Revisa la carpeta de **spam/junk** del destinatario
- Agrega tu dominio a la **lista blanca**
- Usa un **dominio verificado** como remitente

**🚫 Límites de EmailJS:**
- **Plan gratuito**: 200 emails/mes
- Verifica tu **cuota actual** en el dashboard
- Considera **upgrade** si es necesario

**🚫 Configuración de DNS/SPF:**
- Para dominios personalizados, configura **SPF records**
- Verifica **DKIM** si usas dominio propio

**4. Test de Conectividad:**

```javascript
// Prueba directa en la consola del navegador
emailjs.send('tu_service_id', 'tu_template_id', {
  name: 'Test',
  email: 'test@example.com',
  message: 'Test message',
  to_email: 'tu_email@gmail.com',
  subject: 'Test Subject',
  time: new Date().toLocaleString()
}).then(response => {
  console.log('SUCCESS!', response.status, response.text);
}).catch(error => {
  console.log('FAILED...', error);
});
```

**5. Soluciones Inmediatas:**

**✅ Cambiar email de destino:**
- Prueba con **diferentes proveedores** (Gmail, Outlook, Yahoo)
- Usa un **email diferente** para descartar problemas específicos

**✅ Verificar configuración:**
- **Service ID** correcto
- **Template ID** correcto  
- **Public Key** correcto
- **Template activo** en EmailJS

**✅ Revisar logs:**
- Abre **DevTools** → **Console**
- Busca **errores de EmailJS**
- Verifica **response status**

## 📧 Envío Directo de Emails (Sin Credenciales)
### 🎯 Nueva Funcionalidad

**Cambio**: Ahora puedes enviar emails directamente al destinatario que elijas sin necesidad de configurar credenciales.

**Cómo funciona**:
1. **Envío Rápido**:
   - Ingresa el email del destinatario en el campo "📧 Envío Rápido"
   - Haz clic en "📤 Enviar Reporte"
   - El email se enviará directamente al destinatario especificado

2. **Envío con Reporte Completo**:
   - Haz clic en "📤 Generar Reporte de Promociones"
   - Si no tienes un destinatario configurado, se te pedirá que ingreses uno
   - El email se enviará al destinatario que especifiques

3. **Vista Previa como Fallback**:
   - Si EmailJS no está configurado correctamente, se mostrará una vista previa
   - Desde la vista previa puedes copiar el contenido o abrir tu cliente de correo

**✅ Destinatario Directo**: El email que ingreses (ej: `julio__1995@hotmai.com`)
**ℹ️ Sin Configuración**: Ya no necesitas configurar credenciales de correo

## 📧 Problema: Email No Llega a Destino
### 🆘 Si Nada Funciona

1. **Crea un nuevo servicio** en EmailJS Dashboard
2. **Usa un template básico** para probar
3. **Cambia de proveedor** de email (Gmail → Outlook)
4. **Contacta soporte** de EmailJS si persiste
### 📞 Contacto de Soporte
- EmailJS Support: https://www.emailjs.com/docs/
- Documentación: https://www.emailjs.com/docs/introduction/