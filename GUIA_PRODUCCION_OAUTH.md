# Guía: Publicar OAuth en Producción - Evitar Error 403

Este documento explica cómo evitar el error **403: access_denied** cuando tu aplicación está en modo de prueba y cómo publicarla para producción.

## 🔴 Problema: Error 403: access_denied

**Mensaje de error:**
```
Acceso bloqueado: RutinAgent no completó el proceso de verificación de Google
Error 403: access_denied
```

**Causa:** Tu aplicación OAuth está en modo "Testing" (Prueba) y solo los usuarios agregados como "Test users" pueden acceder.

---

## ✅ Solución: Publicar la Aplicación en Producción

Hay dos opciones dependiendo de tus necesidades:

### Opción 1: Modo Testing (Desarrollo/Pruebas) - Solución Rápida

Si solo necesitas que funcionen usuarios específicos durante desarrollo:

1. **Agregar Usuarios de Prueba**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Navega a **"APIs y servicios"** → **"Pantalla de consentimiento OAuth"**
   - En la sección **"Usuarios de prueba"**, haz clic en **"+ AGREGAR USUARIOS"**
   - Agrega los emails de Google de todos los usuarios que necesiten acceso
   - Haz clic en **"Guardar"**

2. **Límites del Modo Testing:**
   - ✅ Funciona inmediatamente
   - ✅ No requiere verificación de Google
   - ❌ Solo funciona para usuarios agregados manualmente
   - ❌ Máximo 100 usuarios de prueba
   - ❌ Los tokens expiran después de 7 días

---

### Opción 2: Publicar en Producción (Recomendado para Producción)

Para que cualquier usuario pueda usar tu aplicación:

#### Paso 1: Completar la Pantalla de Consentimiento

1. **Ir a la Pantalla de Consentimiento**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Navega a **"APIs y servicios"** → **"Pantalla de consentimiento OAuth"**
   - O directamente: https://console.cloud.google.com/apis/credentials/consent

2. **Verificar Información Requerida**
   - **Nombre de la aplicación**: Debe estar completo
   - **Email de soporte**: Tu email de desarrollador
   - **Dominio autorizado**: Si tienes dominio, agrégalo (opcional)
   - **Logo**: Opcional pero recomendado (512x512px)

3. **Configurar Scopes (Ámbitos)**
   - Haz clic en **"Agregar o quitar ámbitos"** o **"Add or Remove Scopes"**
   - Asegúrate de tener estos scopes:
     - ✅ `openid`
     - ✅ `email`
     - ✅ `profile`
     - ✅ `https://www.googleapis.com/auth/calendar`
   - Haz clic en **"Actualizar"** o **"Update"**

4. **Guardar y Continuar**
   - Revisa toda la información
   - Haz clic en **"Guardar y continuar"** en cada paso

#### Paso 2: Publicar la Aplicación

1. **Cambiar a Modo Producción**
   - En la pantalla de consentimiento, verás un banner que dice:
     *"Tu aplicación está en modo de prueba"*
   - Haz clic en **"PUBLICAR APP"** o **"PUBLISH APP"**
   - Confirma la acción

2. **Verificación de Google (Puede ser Necesaria)**
   
   **IMPORTANTE:** Google puede requerir verificación si:
   - Tu aplicación solicita scopes sensibles
   - Tienes más de 100 usuarios
   - Google detecta actividad sospechosa

   **Scopes que requieren verificación:**
   - `https://www.googleapis.com/auth/calendar` - **REQUIERE VERIFICACIÓN**
   - Scopes de acceso a datos sensibles

3. **Proceso de Verificación (Si es Necesario)**
   
   Si Google te pide verificación:
   
   a. **Completar el Formulario de Verificación**
      - Ve a la sección **"Verificación"** en la pantalla de consentimiento
      - Completa el formulario con:
        - Descripción detallada de tu aplicación
        - Qué datos accedes y por qué
        - Política de privacidad (URL)
        - Términos de servicio (URL)
        - Video demo (opcional pero recomendado)
   
   b. **Política de Privacidad Requerida**
      - Debes tener una URL pública con tu política de privacidad
      - Debe explicar qué datos recopilas y cómo los usas
      - Ejemplo de contenido mínimo:
        ```
        - Qué información recopilamos (email, perfil, eventos de calendario)
        - Cómo usamos la información (solo para gestionar calendario)
        - Cómo protegemos la información
        - Cómo contactar al desarrollador
        ```
   
   c. **Términos de Servicio (Opcional pero Recomendado)**
      - URL pública con términos de uso
   
   d. **Enviar para Revisión**
      - Google revisará tu solicitud (puede tardar varios días)
      - Te notificarán por email cuando esté aprobada

#### Paso 3: Configurar Dominios (Opcional pero Recomendado)

1. **Agregar Dominio Autorizado**
   - En la pantalla de consentimiento, sección **"Dominios autorizados"**
   - Agrega tu dominio de producción (ej: `tu-dominio.com`)
   - Si no tienes dominio, puedes usar el dominio de tu hosting (ej: `vercel.app`)

2. **Verificar Dominio (Si es Necesario)**
   - Google puede pedirte verificar que eres dueño del dominio
   - Sigue las instrucciones de verificación

---

## 🚀 Pasos Rápidos para Publicar

### Para Desarrollo/Pruebas (Solución Inmediata):

1. Ve a: https://console.cloud.google.com/apis/credentials/consent
2. Haz clic en **"Usuarios de prueba"** → **"+ AGREGAR USUARIOS"**
3. Agrega los emails que necesitan acceso
4. Guarda

### Para Producción Real:

1. Ve a: https://console.cloud.google.com/apis/credentials/consent
2. Completa toda la información requerida
3. Configura los scopes necesarios
4. Haz clic en **"PUBLICAR APP"**
5. Si te pide verificación:
   - Crea política de privacidad
   - Completa formulario de verificación
   - Envía para revisión
   - Espera aprobación de Google

---

## 📋 Checklist para Producción

Antes de publicar, verifica:

- [ ] Nombre de aplicación completo
- [ ] Email de soporte configurado
- [ ] Logo agregado (opcional pero recomendado)
- [ ] Scopes configurados correctamente
- [ ] Política de privacidad creada y accesible (URL pública)
- [ ] Términos de servicio creados (recomendado)
- [ ] Dominio autorizado agregado (si tienes dominio)
- [ ] URLs de redirección configuradas en credenciales OAuth
- [ ] Aplicación publicada (no en modo testing)

---

## 🔒 Scopes y Verificación

### Scopes que NO requieren verificación:
- `openid`
- `email`
- `profile`

### Scopes que SÍ requieren verificación:
- `https://www.googleapis.com/auth/calendar` ⚠️ **REQUIERE VERIFICACIÓN**

**Nota:** Como tu aplicación usa el scope de Calendar, **DEBES completar el proceso de verificación** para producción.

---

## ⚡ Solución Temporal: Agregar Usuarios de Prueba

Si necesitas que funcione **AHORA** mientras completas la verificación:

1. Ve a: https://console.cloud.google.com/apis/credentials/consent
2. Sección **"Usuarios de prueba"**
3. Haz clic en **"+ AGREGAR USUARIOS"**
4. Agrega: `haroldmedrano33@gmail.com` (y cualquier otro email necesario)
5. Guarda

**Limitación:** Solo estos usuarios podrán acceder hasta que publiques la app.

---

## 📝 Crear Política de Privacidad Rápida

Si necesitas una política de privacidad básica, aquí tienes un template:

```markdown
# Política de Privacidad - Calendable

## Información que Recopilamos

Calendable accede a la siguiente información de tu cuenta de Google:

- **Perfil básico**: Nombre y email
- **Calendario**: Eventos y disponibilidad para crear y gestionar rutinas

## Cómo Usamos la Información

- Solo usamos esta información para:
  - Crear eventos en tu Google Calendar según tus solicitudes
  - Leer tu calendario para verificar disponibilidad
  - Gestionar rutinas personalizadas

## Protección de Datos

- No compartimos tu información con terceros
- No almacenamos tus datos de calendario permanentemente
- Usamos OAuth 2.0 para acceso seguro
- Puedes revocar el acceso en cualquier momento desde tu cuenta de Google

## Contacto

Para preguntas sobre privacidad, contacta a: [tu-email@ejemplo.com]
```

**Hosting de la Política:**
- Puedes subirla a tu repositorio en GitHub y usar GitHub Pages
- O crear una página en tu sitio web
- O usar servicios gratuitos como [Privacy Policy Generator](https://www.privacypolicygenerator.info/)

---

## 🎯 Resumen: Qué Hacer Ahora

### Opción A: Solución Rápida (5 minutos)
1. Agrega tu email como usuario de prueba
2. La app funcionará solo para ti y usuarios agregados

### Opción B: Producción Real (Varios días)
1. Completa la pantalla de consentimiento
2. Crea política de privacidad
3. Publica la aplicación
4. Completa verificación de Google (si es requerida)
5. Espera aprobación

---

## 🔗 Enlaces Útiles

- [Pantalla de Consentimiento OAuth](https://console.cloud.google.com/apis/credentials/consent)
- [Documentación de Verificación de Google](https://support.google.com/cloud/answer/9110914)
- [Política de Privacidad - Template](https://www.privacypolicygenerator.info/)
- [Google OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/web-server#best-practices)

---

## ❓ Preguntas Frecuentes

**P: ¿Cuánto tarda la verificación de Google?**
R: Generalmente 1-2 semanas, pero puede variar.

**P: ¿Puedo usar la app sin verificación?**
R: Sí, pero solo con usuarios de prueba (máximo 100).

**P: ¿Necesito dominio propio?**
R: No es obligatorio, pero es recomendado para producción.

**P: ¿Qué pasa si no completo la verificación?**
R: Tu app seguirá funcionando solo para usuarios de prueba.

---

## ✅ Siguiente Paso Recomendado

1. **Ahora mismo:** Agrega usuarios de prueba para que funcione
2. **Esta semana:** Crea política de privacidad y completa pantalla de consentimiento
3. **Próximas semanas:** Publica y completa verificación para acceso público
