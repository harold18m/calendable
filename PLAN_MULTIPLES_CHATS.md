# Sistema de Múltiples Chats para Calendario

## Objetivo
Crear un sistema donde los usuarios puedan tener múltiples conversaciones (chats) independientes, cada una con su propio historial, pero todas compartiendo y modificando el mismo calendario de Google Calendar.

## Análisis del Estado Actual

### Situación Actual
- Un solo chat por sesión
- Mensajes almacenados en estado local (se pierden al recargar)
- No hay persistencia de conversaciones
- No hay sistema de múltiples chats
- El calendario se comparte globalmente (correcto)

### Requisitos Nuevos
1. Múltiples chats por usuario
2. Cada chat con su propio historial de mensajes
3. Todos los chats modifican el mismo calendario
4. Persistencia de chats (localStorage o base de datos)
5. Interfaz para crear, listar y cambiar entre chats
6. Diseño estilo Lovable/ChatGPT

## Arquitectura Propuesta

### 1. Modelo de Datos

#### Chat/Conversación
```typescript
interface Chat {
  id: string;                    // UUID único
  title: string;                 // Título generado automáticamente o manual
  createdAt: Date;              // Fecha de creación
  updatedAt: Date;               // Última actualización
  messages: Message[];           // Historial de mensajes
  userId: string;                // ID del usuario (de NextAuth)
}
```

#### Message (ya existe, mantener)
```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isRoutineProposal?: boolean;
  confirmed?: boolean;
  timestamp?: Date;
}
```

### 2. Almacenamiento

**Opción A: localStorage (Inicial - Rápido)**
- Pros: Implementación rápida, sin backend adicional
- Contras: Solo funciona en el mismo navegador, límite de tamaño
- Uso: Para MVP y desarrollo inicial

**Opción B: Base de Datos (Producción)**
- Pros: Persistencia real, accesible desde cualquier dispositivo
- Contras: Requiere setup de DB, más complejo
- Opciones: PostgreSQL, MongoDB, o Supabase

**Recomendación**: Empezar con localStorage, migrar a DB después

### 3. Estructura de Archivos

```
src/
├── app/
│   ├── app/
│   │   └── page.tsx              # Refactorizar para múltiples chats
│   └── api/
│       └── chats/                 # Nuevo endpoint (futuro)
│           ├── route.ts           # CRUD de chats
│           └── [chatId]/
│               └── route.ts       # Operaciones por chat
├── components/
│   ├── chat-list.tsx              # Lista de chats (sidebar)
│   ├── chat-item.tsx              # Item individual de chat
│   ├── new-chat-button.tsx        # Botón para crear nuevo chat
│   └── chat-header.tsx            # Header con título del chat
├── lib/
│   ├── chat-storage.ts            # Utilidades para localStorage/DB
│   └── chat-utils.ts              # Helpers para chats
└── hooks/
    └── use-chats.ts               # Hook para gestionar chats
```

## Implementación por Fases

### Fase 1: Estructura Base y Almacenamiento Local

#### 1.1 Crear utilidades de almacenamiento
- `lib/chat-storage.ts`: Funciones para guardar/cargar chats en localStorage
- Funciones: `saveChat()`, `loadChats()`, `deleteChat()`, `updateChat()`
- Key: `calendable-chats-${userId}`

#### 1.2 Crear hook personalizado
- `hooks/use-chats.ts`: Hook para gestionar estado de chats
- Estados: `chats`, `currentChatId`, `isLoading`
- Funciones: `createChat()`, `deleteChat()`, `switchChat()`, `updateChatTitle()`

#### 1.3 Refactorizar tipos
- Mover interfaces a `types/chat.ts`
- Actualizar `Message` para incluir `chatId` y `timestamp`

### Fase 2: UI de Lista de Chats

#### 2.1 Componente ChatList
- Sidebar izquierdo con lista de chats
- Mostrar título y última actividad
- Indicador de chat activo
- Botón para crear nuevo chat

#### 2.2 Componente ChatItem
- Item individual de chat
- Mostrar título truncado
- Timestamp de última actividad
- Botón de eliminar (con confirmación)
- Click para cambiar de chat

#### 2.3 Componente NewChatButton
- Botón prominente para crear nuevo chat
- Generar título automático basado en primer mensaje
- Limpiar input y mensajes al crear

### Fase 3: Refactorizar Página Principal

#### 3.1 Actualizar AppPage
- Usar `useChats()` hook
- Cargar chats al iniciar
- Guardar mensajes en chat actual
- Cambiar entre chats sin perder datos

#### 3.2 Chat Header
- Mostrar título del chat actual
- Botón para editar título
- Botón para eliminar chat
- Indicador de chat activo

#### 3.3 Persistencia de Mensajes
- Guardar mensajes automáticamente después de cada intercambio
- Actualizar `updatedAt` del chat
- Mantener previewEvents por chat (opcional)

### Fase 4: Mejoras de UX

#### 4.1 Generación Automática de Títulos
- Analizar primer mensaje del usuario
- Generar título descriptivo (ej: "Rutina de ejercicio")
- Permitir edición manual después

#### 4.2 Búsqueda de Chats
- Campo de búsqueda en lista de chats
- Filtrar por título o contenido

#### 4.3 Ordenamiento
- Por fecha de actualización (más reciente primero)
- Opción de ordenar alfabéticamente

#### 4.4 Límites y Optimización
- Máximo de chats (ej: 50)
- Limpiar chats antiguos sin mensajes
- Lazy loading de mensajes para chats grandes

### Fase 5: Migración a Base de Datos (Futuro)

#### 5.1 Setup de Base de Datos
- Elegir DB (PostgreSQL recomendado)
- Crear schema de tablas
- Migración de datos de localStorage

#### 5.2 API Endpoints
- `GET /api/chats` - Listar chats del usuario
- `POST /api/chats` - Crear nuevo chat
- `GET /api/chats/[chatId]` - Obtener chat específico
- `PUT /api/chats/[chatId]` - Actualizar chat
- `DELETE /api/chats/[chatId]` - Eliminar chat

#### 5.3 Sincronización
- Sincronizar con servidor en background
- Manejar conflictos de edición
- Offline-first con sincronización posterior

## Detalles de Implementación

### Gestión de Estado

```typescript
// Estado global de chats
const [chats, setChats] = useState<Chat[]>([]);
const [currentChatId, setCurrentChatId] = useState<string | null>(null);
const currentChat = chats.find(c => c.id === currentChatId);

// Al crear nuevo chat
const createNewChat = () => {
  const newChat: Chat = {
    id: generateId(),
    title: "Nueva conversación",
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [],
    userId: session.user.id
  };
  setChats([newChat, ...chats]);
  setCurrentChatId(newChat.id);
  setMessages([]);
};

// Al cambiar de chat
const switchChat = (chatId: string) => {
  const chat = chats.find(c => c.id === chatId);
  if (chat) {
    setCurrentChatId(chatId);
    setMessages(chat.messages);
    setPreviewEvents([]);
  }
};

// Al enviar mensaje
const handleSubmit = async (e: FormEvent) => {
  // ... lógica existente ...
  
  // Guardar mensajes en chat actual
  if (currentChatId) {
    updateChat(currentChatId, {
      messages: [...messages, userMessage, assistantMessage],
      updatedAt: new Date()
    });
  }
};
```

### Layout de UI

```
┌─────────────────────────────────────────────────┐
│ Navbar (Calendable + User)                    │
├──────────┬───────────────────────────────────────┤
│          │ Chat Header (Título + Acciones)      │
│ Chat     ├───────────────────────────────────────┤
│ List     │                                       │
│          │ Messages Area                         │
│ - Chat 1 │                                       │
│ - Chat 2 │                                       │
│ - Chat 3 │                                       │
│          │                                       │
│ [+ New]  │                                       │
│          ├───────────────────────────────────────┤
│          │ Input Area (ChatGPT style)            │
├──────────┴───────────────────────────────────────┤
│ Calendar (Compartido - mismo para todos los chats)│
└─────────────────────────────────────────────────┘
```

### Persistencia LocalStorage

```typescript
// lib/chat-storage.ts
export const saveChats = (userId: string, chats: Chat[]) => {
  const key = `calendable-chats-${userId}`;
  localStorage.setItem(key, JSON.stringify(chats));
};

export const loadChats = (userId: string): Chat[] => {
  const key = `calendable-chats-${userId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};
```

## Consideraciones Importantes

### Calendario Compartido
- **Todos los chats modifican el mismo calendario**
- No hay "calendarios por chat"
- El `accessToken` es el mismo para todos los chats
- Los eventos creados desde cualquier chat aparecen en el mismo calendario

### Contexto del Agente
- Cada chat mantiene su propio contexto de conversación
- El agente puede referirse a mensajes anteriores del mismo chat
- Los mensajes de otros chats no afectan el contexto actual

### Rendimiento
- Lazy loading de mensajes para chats grandes
- Virtualización de lista de chats si hay muchos
- Debounce al guardar en localStorage

### Migración de Datos
- Al implementar DB, migrar chats existentes de localStorage
- Mantener compatibilidad durante transición

## Próximos Pasos

1. **Crear estructura base**: Tipos, utilidades, hook
2. **Implementar almacenamiento local**: localStorage functions
3. **Crear componentes UI**: ChatList, ChatItem, NewChatButton
4. **Refactorizar AppPage**: Integrar sistema de múltiples chats
5. **Testing**: Probar creación, cambio y eliminación de chats
6. **Mejoras UX**: Títulos automáticos, búsqueda, ordenamiento

## Notas Adicionales

- Mantener el diseño actual estilo Lovable
- El calendario sigue siendo el componente principal a la derecha
- Los chats se muestran en el sidebar izquierdo (similar a ChatGPT)
- Considerar límites de almacenamiento en localStorage (5-10MB típico)
