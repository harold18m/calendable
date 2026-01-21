# Migración a Clerk - Guía de Configuración

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env.local`:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Opcional: URLs de redirección
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
```

## Pasos para Configurar Clerk

1. **Crear cuenta en Clerk**:
   - Ve a https://clerk.com
   - Crea una cuenta o inicia sesión
   - Crea una nueva aplicación

2. **Configurar OAuth Providers**:
   - En el dashboard de Clerk, ve a "User & Authentication" > "Social Connections"
   - Habilita Google OAuth
   - Configura las credenciales de Google OAuth (Client ID y Secret)

3. **Obtener las API Keys**:
   - Ve a "API Keys" en el dashboard
   - Copia el "Publishable Key" y el "Secret Key"
   - Pégales en tu `.env.local`

4. **Configurar URLs de redirección en Clerk**:
   - Ve a "Paths" en el dashboard
   - Configura:
     - Sign-in path: `/auth/signin`
     - Sign-up path: `/auth/signup`
     - After sign-in URL: `/app`
     - After sign-up URL: `/app`

## Cambios Realizados

### Archivos Modificados:
- ✅ `package.json` - Agregado `@clerk/nextjs`, removido `next-auth`
- ✅ `src/middleware.ts` - Creado con `clerkMiddleware()`
- ✅ `src/app/layout.tsx` - Reemplazado `AuthProvider` con `ClerkProvider`
- ✅ `src/components/auth-guard.tsx` - Actualizado para usar `useUser()` de Clerk
- ✅ `src/app/auth/signin/page.tsx` - Reemplazado con componente `<SignIn>` de Clerk
- ✅ `src/app/auth/signup/page.tsx` - Creado con componente `<SignUp>` de Clerk
- ✅ `src/app/app/page.tsx` - Actualizado para usar `useUser()` y `useClerk()`
- ✅ `src/app/page.tsx` - Actualizado para usar `useUser()` de Clerk
- ✅ `src/app/api/events/route.ts` - Actualizado para usar `auth()` de Clerk
- ✅ `src/app/api/chat/route.ts` - Actualizado para usar `auth()` de Clerk
- ✅ `src/components/calendar-with-auth.tsx` - Actualizado para usar `useUser()` de Clerk

### Archivos a Eliminar (después de verificar que todo funciona):
- ❌ `src/lib/auth-options.ts` - Ya no se necesita
- ❌ `src/components/auth-provider.tsx` - Reemplazado por ClerkProvider
- ❌ `src/app/api/auth/[...nextauth]/route.ts` - Ya no se necesita
- ❌ `src/components/google-auth-button.tsx` - Puede eliminarse si no se usa

## Notas Importantes

1. **userId vs email**: Clerk usa `userId` (string único) en lugar de email. Para mantener compatibilidad con el código existente, estamos usando `user.primaryEmailAddress.emailAddress` como identificador de usuario en localStorage.

2. **Sin Access Token de Google**: Ya no necesitamos el access token de Google Calendar porque estamos usando el calendario local. Si en el futuro necesitas Google Calendar, puedes obtener tokens OAuth desde Clerk.

3. **Instalación**: Ejecuta `npm install` para instalar `@clerk/nextjs`.

## Próximos Pasos

1. Instalar dependencias: `npm install`
2. Configurar variables de entorno en `.env.local`
3. Configurar Google OAuth en Clerk Dashboard
4. Probar el flujo de autenticación
5. Verificar que los eventos se crean correctamente
6. Eliminar archivos obsoletos de NextAuth
