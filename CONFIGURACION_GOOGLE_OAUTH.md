# Configuración de Vínculos de Política de Privacidad y Términos de Servicio en Google OAuth

## URLs Públicas Requeridas

Google OAuth requiere que proporciones vínculos públicos a:

1. **Política de Privacidad**: `https://tu-dominio.com/privacy`
2. **Términos de Servicio**: `https://tu-dominio.com/terms`

## URLs Creadas

He creado las siguientes páginas públicas en tu aplicación:

- **Política de Privacidad**: `/privacy` → `https://tu-dominio.com/privacy`
- **Términos de Servicio**: `/terms` → `https://tu-dominio.com/terms`

## Cómo Configurar en Google Cloud Console

### Paso 1: Acceder a la Pantalla de Consentimiento

1. Ve a: https://console.cloud.google.com/apis/credentials/consent
2. Selecciona tu proyecto de Google Cloud
3. Si aún no has configurado la pantalla de consentimiento, haz clic en "CONFIGURAR PANTALLA DE CONSENTIMIENTO"

### Paso 2: Agregar los Vínculos

En la sección **"Información de la aplicación"**, encontrarás dos campos:

1. **Política de privacidad del desarrollador**
   - Ingresa: `https://tu-dominio.com/privacy`
   - Ejemplo: `https://calendable.vercel.app/privacy`

2. **Términos del servicio del desarrollador**
   - Ingresa: `https://tu-dominio.com/terms`
   - Ejemplo: `https://calendable.vercel.app/terms`

### Paso 3: Verificar que las URLs sean Accesibles

Antes de guardar, verifica que las URLs sean accesibles públicamente:

- ✅ No requieren autenticación
- ✅ Son HTTPS (requerido por Google)
- ✅ Están en el mismo dominio o dominio autorizado

### Paso 4: Guardar y Publicar

1. Completa todos los campos requeridos
2. Haz clic en "GUARDAR Y CONTINUAR"
3. Si estás listo para producción, haz clic en "PUBLICAR APP"

## Ejemplo de URLs según tu Hosting

### Si usas Vercel:
```
Política de Privacidad: https://tu-proyecto.vercel.app/privacy
Términos de Servicio: https://tu-proyecto.vercel.app/terms
```

### Si usas Netlify:
```
Política de Privacidad: https://tu-proyecto.netlify.app/privacy
Términos de Servicio: https://tu-proyecto.netlify.app/terms
```

### Si tienes dominio propio:
```
Política de Privacidad: https://calendable.com/privacy
Términos de Servicio: https://calendable.com/terms
```

## Verificación

Después de configurar, puedes verificar que las URLs funcionan:

1. Abre las URLs en una ventana de incógnito
2. Verifica que se muestran correctamente
3. Verifica que no requieren login

## Notas Importantes

- ⚠️ Las URLs **DEBEN** ser HTTPS (Google no acepta HTTP)
- ⚠️ Las URLs deben ser accesibles públicamente (sin autenticación)
- ⚠️ Las URLs deben estar en el mismo dominio o en un dominio autorizado
- ✅ Puedes actualizar estas URLs en cualquier momento desde la consola de Google

## Próximos Pasos

1. Despliega tu aplicación a producción
2. Verifica que las URLs `/privacy` y `/terms` son accesibles
3. Agrega las URLs en Google Cloud Console
4. Completa el proceso de verificación de Google (si es necesario)
5. Publica tu aplicación
