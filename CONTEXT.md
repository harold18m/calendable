# Contexto del Proyecto: Routine Agent

## Descripción General

**Routine Agent** es una aplicación web construida con Next.js que utiliza inteligencia artificial para ayudar a los usuarios a gestionar rutinas personales mediante la integración con Google Calendar. El agente puede crear, actualizar y gestionar eventos de calendario de forma inteligente, analizando la disponibilidad del usuario y proponiendo rutinas personalizadas.

## Arquitectura

### Stack Tecnológico

- **Framework**: Next.js 16.0.8 (App Router)
- **Lenguaje**: TypeScript
- **UI**: React 19.2.1, HeroUI (NextUI), Tailwind CSS 4
- **IA**: Strands Agents SDK con AWS Bedrock (Claude)
- **Autenticación**: NextAuth.js con Google OAuth
- **Calendario**: Google Calendar API (googleapis)
- **Animaciones**: Framer Motion

### Estructura del Proyecto

```
src/
├── agent/              # Lógica del agente de IA
│   ├── agent.ts       # Configuración del agente con prompts y modelo
│   └── calendar-tools.ts  # Herramientas para interactuar con Google Calendar
├── app/                # Rutas y páginas de Next.js
│   ├── api/
│   │   ├── auth/      # Endpoints de autenticación (NextAuth)
│   │   ├── calendar/  # Endpoints de calendario
│   │   └── chat/      # Endpoint principal para el chat con el agente
│   ├── auth/signin/   # Página de inicio de sesión
│   └── page.tsx       # Página principal con chat y calendario
├── components/        # Componentes React reutilizables
│   ├── auth-guard.tsx           # Protección de rutas
│   ├── auth-provider.tsx        # Proveedor de autenticación
│   ├── calendar-with-auth.tsx  # Componente principal del calendario
│   ├── google-auth-button.tsx  # Botón de autenticación
│   ├── routine-manager.tsx     # Gestor de rutinas
│   └── theme-toggle.tsx         # Toggle de tema oscuro/claro
└── lib/
    └── auth-options.ts  # Configuración de NextAuth
```

## Funcionalidades Principales

### 1. Agente de IA para Gestión de Rutinas

El agente está configurado con un **system prompt** detallado que lo convierte en un asistente especializado en gestión de rutinas. Características:

- **Modelo**: Claude (AWS Bedrock) - configurable entre varios modelos
- **Temperatura**: 0.3 (respuestas más deterministas)
- **Enfoque**: Reducir improvisación y carga cognitiva del usuario
- **Reglas críticas**:
  - Solo crear eventos en fechas futuras
  - Siempre pedir información faltante antes de crear
  - Proponer y esperar confirmación antes de crear eventos

### 2. Herramientas del Agente (Function Tools)

El agente tiene acceso a las siguientes herramientas de calendario:

- `get_current_datetime`: Obtiene fecha y hora actual
- `get_calendar_events`: Lista eventos en un rango de fechas
- `analyze_availability`: Analiza slots libres en una fecha específica
- `create_calendar_event`: Crea nuevos eventos (solo fechas futuras)
- `update_calendar_event`: Actualiza eventos existentes
- `delete_calendar_event`: Elimina eventos
- `move_calendar_event`: Mueve eventos a otro horario
- `get_upcoming_events`: Obtiene próximos eventos
- `suggest_next_action`: Sugiere qué hacer ahora basado en el calendario

### 3. Autenticación con Google

- **NextAuth.js** maneja la autenticación OAuth con Google
- **Scopes**: `openid email profile https://www.googleapis.com/auth/calendar`
- **Refresh Token**: Implementado para mantener sesiones activas
- **Access Token**: Se pasa al agente en cada conversación para usar las herramientas

### 4. Interfaz de Usuario

#### Chat Sidebar
- Interfaz de chat en tiempo real con el agente
- Detección automática de propuestas de rutina
- Botones de confirmación/cancelación para propuestas
- Preview de eventos antes de confirmarlos
- Sugerencias rápidas de rutinas comunes

#### Calendario
- **Tres vistas**: Día, Semana, Mes
- **Integración con Google Calendar**: Sincronización en tiempo real
- **Preview de eventos**: Muestra eventos propuestos antes de confirmar
- **Indicador de hora actual**: Línea roja en vistas de día/semana
- **Navegación**: Botones para avanzar/retroceder y "Hoy"
- **Tema**: Soporte para modo oscuro/claro

### 5. Flujo de Creación de Rutinas

1. Usuario solicita una rutina (ej: "Quiero una rutina de ejercicio")
2. El agente analiza la solicitud y pregunta por detalles faltantes:
   - Duración de cada sesión
   - Horario preferido
   - Días de la semana
   - Fecha de inicio
3. El agente propone la rutina con todos los detalles
4. El sistema detecta la propuesta y muestra botones de confirmación
5. Se generan eventos de preview en el calendario (con borde punteado)
6. Usuario confirma o cancela
7. Si confirma, el agente crea los eventos reales en Google Calendar
8. El calendario se actualiza automáticamente

## Configuración y Variables de Entorno

### Variables Requeridas

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret

# NextAuth
NEXTAUTH_SECRET=tu_secret_key
NEXTAUTH_URL=http://localhost:3000

# AWS Bedrock (opcional, para cambiar modelo)
BEDROCK_MODEL=claude-3-haiku  # o claude-sonnet-4, claude-3.5-sonnet, etc.
```

### Modelos Disponibles

El sistema soporta varios modelos de Claude en AWS Bedrock:
- `claude-sonnet-4`: Modelo más reciente y potente
- `claude-3.5-sonnet`: Balance entre calidad y costo
- `claude-3-haiku`: Más rápido y económico (por defecto)
- `claude-3-sonnet`: Versión anterior

## Endpoints API

### `/api/chat` (POST)
Endpoint principal para interactuar con el agente.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Quiero crear una rutina..." }
  ]
}
```

**Response:**
- Texto plano con la respuesta del agente
- Status 429 si hay throttling (con reintentos automáticos)
- Status 500 en caso de error

**Características:**
- Reintentos automáticos con backoff exponencial para errores de throttling
- Inyección automática del access token en el contexto del agente
- Timeout máximo de 60 segundos

### `/api/auth/[...nextauth]` (GET/POST)
Endpoints de NextAuth para autenticación OAuth.

### `/api/calendar` (GET)
Endpoint para obtener eventos del calendario (si existe).

## Características Técnicas Importantes

### Manejo de Errores

1. **Throttling de AWS Bedrock**: 
   - Detección automática de errores de throttling
   - Reintentos con backoff exponencial (2s, 4s, 8s...)
   - Mensajes amigables al usuario

2. **Tokens Expirados**:
   - Refresh automático de access tokens
   - Re-autenticación si el refresh falla
   - Manejo de errores 401 en llamadas a Google Calendar

### Validaciones

- **Fechas futuras**: El sistema valida que todos los eventos se creen en fechas futuras
- **Horarios permitidos**: 06:00 - 22:00 (configurable en `analyze_availability`)
- **Información requerida**: El agente pregunta por todos los datos necesarios antes de crear

### Preview de Eventos

El sistema detecta propuestas de rutina mediante:
- Análisis de keywords en la respuesta del agente
- Parsing de días, horarios y duraciones mencionados
- Generación de eventos temporales con `isPreview: true`
- Limpieza automática al confirmar o cancelar

## Flujo de Datos

```
Usuario → Chat UI → /api/chat → Strands Agent → AWS Bedrock
                                              ↓
                                    Calendar Tools (con access_token)
                                              ↓
                                    Google Calendar API
                                              ↓
                                    Respuesta → Chat UI → Calendario actualizado
```

## Dependencias Clave

- `@strands-agents/sdk`: SDK para crear y ejecutar agentes
- `@ai-sdk/amazon-bedrock`: Integración con AWS Bedrock
- `googleapis`: Cliente para Google Calendar API
- `next-auth`: Autenticación OAuth
- `@heroui/react`: Componentes UI (NextUI)
- `next-themes`: Gestión de temas

## Scripts Disponibles

- `npm run dev`: Inicia servidor de desarrollo
- `npm run build`: Construye para producción
- `npm run start`: Inicia servidor de producción
- `npm run lint`: Ejecuta ESLint

## Consideraciones de Desarrollo

1. **Zona Horaria**: Configurada para `America/Lima` (modificable en `calendar-tools.ts`)
2. **Idioma**: Interfaz y prompts en español
3. **Responsive**: Diseño adaptable, sidebar colapsable
4. **Performance**: Lazy loading, optimizaciones de Next.js
5. **Seguridad**: Tokens manejados en servidor, validación de fechas

## Extensiones Futuras Posibles

- Soporte para múltiples calendarios
- Notificaciones y recordatorios
- Análisis de cumplimiento de rutinas
- Integración con otros servicios (fitness, productividad)
- Exportación de rutinas
- Plantillas de rutinas predefinidas
