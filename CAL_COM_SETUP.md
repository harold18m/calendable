# Configuración de Cal.com

Esta aplicación ahora usa Cal.com para gestionar eventos del calendario en lugar del calendario local.

## Pasos de Configuración

### 1. Crear cuenta en Cal.com

1. Ve a [cal.com](https://cal.com) y crea una cuenta
2. Completa el proceso de registro

### 2. Obtener API Key

1. Inicia sesión en tu cuenta de Cal.com
2. Ve a **Settings** → **Security** → **API Keys**
3. Crea una nueva API Key
4. Copia la API Key (comienza con `cal_` o `cal_live_`)

### 3. Configurar Variables de Entorno

Agrega las siguientes variables de entorno en tu archivo `.env.local`:

```env
# Cal.com API Configuration
CAL_COM_API_KEY=cal_xxxxxxxxxxxxxxxxxxxxx
CAL_COM_API_URL=https://api.cal.com/v2
```

**Nota:** Si estás usando Cal.com self-hosted, cambia `CAL_COM_API_URL` a la URL de tu instancia.

### 4. Crear Event Type (Opcional)

El sistema creará automáticamente un event type por defecto si no existe ninguno. Sin embargo, puedes crear uno manualmente:

1. Ve a **Event Types** en Cal.com
2. Crea un nuevo event type (por ejemplo, "Personal Event")
3. Configura la duración y otros detalles según tus necesidades

El agente usará el primer event type disponible o creará uno automáticamente cuando sea necesario.

## Funcionalidades

El agente ahora puede:
- ✅ Crear eventos (bookings) en Cal.com
- ✅ Leer eventos del calendario
- ✅ Actualizar eventos existentes
- ✅ Eliminar eventos
- ✅ Mover eventos a nuevas fechas/horas
- ✅ Analizar disponibilidad
- ✅ Sugerir actividades en tiempo libre

## Notas Importantes

- Los eventos se crean como "bookings" en Cal.com
- El agente NO necesita pedir permisos - ya tiene acceso completo
- Todos los eventos se crean en fechas futuras (no se permiten eventos pasados)
- El calendario mostrará automáticamente los eventos de Cal.com

## Solución de Problemas

### Error: "CAL_COM_API_KEY no está configurada"
- Verifica que la variable de entorno esté en `.env.local`
- Reinicia el servidor de desarrollo después de agregar la variable

### Error: "No se pudo obtener o crear un event type"
- Verifica que tu API Key tenga permisos para crear event types
- Intenta crear un event type manualmente en Cal.com

### Los eventos no aparecen en el calendario
- Verifica que la API Key sea válida
- Revisa la consola del navegador para errores
- Asegúrate de que las fechas de los eventos sean futuras
