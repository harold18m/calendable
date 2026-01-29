<p align="center">
  <img src="public/logo.svg" alt="Calendable Logo" width="80" height="80" />
</p>

<h1 align="center">Calendable</h1>

<p align="center">
  <strong>Tu calendario, tu copiloto</strong>
</p>

<p align="center">
  Organiza tu vida hablando. Una aplicación de calendario potenciada por IA que crea eventos, rutinas y planifica tu tiempo automáticamente.
</p>

<p align="center">
  <a href="#características">Características</a> •
  <a href="#demo">Demo</a> •
  <a href="#instalación">Instalación</a> •
  <a href="#configuración">Configuración</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#contribuir">Contribuir</a> •
  <a href="#licencia">Licencia</a>
</p>

---

## Características

- **IA Conversacional** - Habla naturalmente para crear y gestionar eventos
- **Google Calendar** - Sincronización bidireccional en tiempo real
- **Rutinas Inteligentes** - Crea hábitos recurrentes que se adaptan a tu disponibilidad
- **Análisis de Disponibilidad** - La IA analiza tu calendario para sugerir horarios óptimos
- **Preview de Eventos** - Visualiza eventos propuestos antes de confirmarlos
- **Tema Oscuro/Claro** - Interfaz adaptable a tus preferencias
- **Responsive** - Funciona en desktop y móvil

## Demo

> Próximamente

## Instalación

### Prerrequisitos

- Node.js 18+
- Cuenta de Google Cloud Platform con Calendar API habilitada
- Cuenta de AWS con acceso a Bedrock (para el modelo de IA)

### Pasos

1. **Clona el repositorio**

```bash
git clone https://github.com/tu-usuario/calendable.git
cd calendable
```

2. **Instala las dependencias**

```bash
npm install
```

3. **Configura las variables de entorno**

```bash
cp .env.example .env.local
```

4. **Inicia el servidor de desarrollo**

```bash
npm run dev
```

5. **Abre** [http://localhost:3000](http://localhost:3000)

## Configuración

Crea un archivo `.env.local` con las siguientes variables:

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret

# NextAuth
NEXTAUTH_SECRET=tu_secret_key_generado
NEXTAUTH_URL=http://localhost:3000

# AWS Bedrock
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1

# Modelo de IA (opcional)
BEDROCK_MODEL=claude-3-haiku
```

### Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Calendar API**
4. Ve a **Credenciales** > **Crear credenciales** > **ID de cliente OAuth**
5. Configura la pantalla de consentimiento OAuth
6. Añade los URIs de redirección:
   - `http://localhost:3000/api/auth/callback/google` (desarrollo)
   - `https://tu-dominio.com/api/auth/callback/google` (producción)
7. Copia el Client ID y Client Secret

### Configurar AWS Bedrock

1. Accede a [AWS Console](https://console.aws.amazon.com/)
2. Ve a **Amazon Bedrock** > **Model access**
3. Solicita acceso a los modelos de Claude
4. Crea un usuario IAM con los permisos:
   - `bedrock:InvokeModel`
   - `bedrock:InvokeModelWithResponseStream`

### Modelos disponibles

| Modelo | Descripción |
|--------|-------------|
| `claude-3-haiku` | Rápido y económico (por defecto) |
| `claude-3.5-sonnet` | Balance entre calidad y velocidad |
| `claude-sonnet-4` | Más potente |

## Tech Stack

| Tecnología | Uso |
|------------|-----|
| [Next.js 16](https://nextjs.org/) | Framework React |
| [TypeScript](https://www.typescriptlang.org/) | Tipado estático |
| [Tailwind CSS 4](https://tailwindcss.com/) | Estilos |
| [HeroUI](https://heroui.com/) | Componentes UI |
| [Framer Motion](https://www.framer.com/motion/) | Animaciones |
| [NextAuth.js](https://next-auth.js.org/) | Autenticación |
| [Strands Agents SDK](https://strandsagents.com/) | Agente de IA |
| [AWS Bedrock](https://aws.amazon.com/bedrock/) | Modelo Claude |
| [Google Calendar API](https://developers.google.com/calendar) | Integración calendario |

## Estructura del Proyecto

```
src/
├── agent/                 # Lógica del agente de IA
│   ├── agent.ts          # Configuración del agente
│   └── calendar-tools.ts # Herramientas de calendario
├── app/                   # Rutas de Next.js (App Router)
│   ├── api/              # Endpoints API
│   │   ├── auth/         # NextAuth
│   │   ├── calendar/     # Calendario
│   │   └── chat/         # Chat con el agente
│   ├── app/              # Aplicación principal
│   ├── privacy/          # Política de privacidad
│   └── terms/            # Términos de servicio
├── components/            # Componentes React
└── lib/                   # Utilidades
```

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter
```

## Herramientas del Agente

El agente de IA tiene acceso a las siguientes herramientas:

| Herramienta | Descripción |
|-------------|-------------|
| `get_current_datetime` | Obtiene fecha y hora actual |
| `get_calendar_events` | Lista eventos en un rango |
| `analyze_availability` | Analiza slots libres |
| `create_calendar_event` | Crea nuevos eventos |
| `update_calendar_event` | Actualiza eventos |
| `delete_calendar_event` | Elimina eventos |
| `move_calendar_event` | Mueve eventos |
| `get_upcoming_events` | Próximos eventos |
| `suggest_next_action` | Sugiere qué hacer ahora |

## Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Guías

- Sigue el estilo de código existente
- Añade tests si es posible
- Actualiza la documentación si es necesario
- Escribe mensajes de commit descriptivos

## Roadmap

- [ ] Soporte para múltiples calendarios
- [ ] Notificaciones y recordatorios
- [ ] Análisis de cumplimiento de rutinas
- [ ] Integración con servicios de fitness
- [ ] Plantillas de rutinas predefinidas
- [ ] Exportación de rutinas
- [ ] Modo offline

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  Hecho con ❤️ por la comunidad
</p>
