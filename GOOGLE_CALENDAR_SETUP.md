# Configuración de Google Calendar

Esta aplicación ahora usa Google Calendar para gestionar eventos del calendario.

## Pasos de Configuración

### 1. Configurar Google OAuth en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** → **Credentials**
4. Crea **OAuth 2.0 Client ID**
5. Configura las URLs de redirección:
   - **Authorized JavaScript origins**: `http://localhost:3000` (y tu dominio de producción)
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google` (y tu dominio de producción)
6. Habilita la **Google Calendar API** en **APIs & Services** → **Library**
7. Copia el **Client ID** y **Client Secret**

### 2. Configurar Variables de Entorno

Agrega las siguientes variables de entorno en tu archivo `.env.local`:

```env
# Google OAuth (para Google Calendar)
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
NEXTAUTH_SECRET=tu_secret_aleatorio
NEXTAUTH_URL=http://localhost:3000
```

### 3. Conectar Google Calendar en la Aplicación

El usuario necesita conectarse a Google Calendar:

1. La aplicación debe tener un botón o flujo para conectar Google Calendar
2. Usar OAuth 2.0 para obtener el access token
3. Almacenar el access token en `localStorage` con la clave `google_calendar_access_token`

### 4. Implementar OAuth Flow

Puedes usar NextAuth.js o implementar OAuth manualmente:

**Opción A: Usar NextAuth.js (recomendado)**

```typescript
// En tu componente de autenticación
import { signIn } from "next-auth/react";

const handleGoogleCalendarConnect = async () => {
  const result = await signIn("google", {
    callbackUrl: "/app",
    redirect: false,
  });
  
  // El access token estará disponible en la sesión
  // Necesitarás extraerlo y guardarlo en localStorage
};
```

**Opción B: OAuth Manual**

```typescript
const handleGoogleCalendarConnect = () => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${window.location.origin}/api/auth/callback/google`;
  const scope = "https://www.googleapis.com/auth/calendar";
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&access_type=offline&prompt=consent`;
  
  window.location.href = authUrl;
};
```

### 5. Guardar Access Token

Después de obtener el access token (ya sea de NextAuth o OAuth manual), guárdalo:

```typescript
// En el callback de OAuth o después de signIn
if (accessToken) {
  localStorage.setItem("google_calendar_access_token", accessToken);
}
```

## Funcionalidades

El agente ahora puede:
- ✅ Crear eventos en Google Calendar
- ✅ Leer eventos del calendario
- ✅ Actualizar eventos existentes
- ✅ Eliminar eventos
- ✅ Mover eventos a nuevas fechas/horas
- ✅ Analizar disponibilidad
- ✅ Sugerir actividades en tiempo libre

## Notas Importantes

- El access token se almacena en `localStorage` del navegador
- El token puede expirar - necesitarás implementar refresh token logic
- Todos los eventos se crean en fechas futuras (no se permiten eventos pasados)
- El calendario mostrará automáticamente los eventos de Google Calendar

## Solución de Problemas

### Error: "Google Calendar access token requerido"
- Verifica que el usuario haya conectado su cuenta de Google Calendar
- Revisa que el token esté guardado en `localStorage` con la clave `google_calendar_access_token`

### Error: "Token inválido o expirado"
- El access token ha expirado. Necesitas implementar refresh token logic
- O el usuario necesita reconectarse a Google Calendar

### Los eventos no aparecen en el calendario
- Verifica que el access token sea válido
- Revisa la consola del navegador para errores
- Asegúrate de que las fechas de los eventos sean futuras
- Verifica que la Google Calendar API esté habilitada en Google Cloud Console

### Error 403: "Insufficient Permission"
- Verifica que el scope incluya `https://www.googleapis.com/auth/calendar`
- Asegúrate de que el usuario haya dado consentimiento para acceder al calendario
