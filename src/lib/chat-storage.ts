// Utilidades para almacenar conversaciones en localStorage

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isRoutineProposal?: boolean;
  confirmed?: boolean;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  userId?: string;
}

const STORAGE_PREFIX = "calendable-chat-";

// Obtener la clave de almacenamiento para un usuario
function getStorageKey(userId?: string): string {
  return userId ? `${STORAGE_PREFIX}${userId}` : `${STORAGE_PREFIX}default`;
}

// Guardar un chat completo
export function saveChat(userId: string | undefined, chat: Chat): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = getStorageKey(userId);
    const chats = loadChats(userId);
    const existingIndex = chats.findIndex((c) => c.id === chat.id);
    
    if (existingIndex >= 0) {
      chats[existingIndex] = chat;
    } else {
      chats.push(chat);
    }
    
    // Ordenar por fecha de actualización (más recientes primero)
    chats.sort((a, b) => b.updatedAt - a.updatedAt);
    
    localStorage.setItem(key, JSON.stringify(chats));
  } catch (error) {
    console.error("Error guardando chat:", error);
  }
}

// Cargar todos los chats de un usuario
export function loadChats(userId?: string): Chat[] {
  if (typeof window === "undefined") return [];
  
  try {
    const key = getStorageKey(userId);
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const chats = JSON.parse(data) as Chat[];
    // Asegurar que todos los chats tengan timestamps
    return chats.map((chat) => ({
      ...chat,
      createdAt: chat.createdAt || Date.now(),
      updatedAt: chat.updatedAt || Date.now(),
    }));
  } catch (error) {
    console.error("Error cargando chats:", error);
    return [];
  }
}

// Cargar un chat específico por ID
export function loadChat(userId: string | undefined, chatId: string): Chat | null {
  const chats = loadChats(userId);
  return chats.find((c) => c.id === chatId) || null;
}

// Eliminar un chat
export function deleteChat(userId: string | undefined, chatId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = getStorageKey(userId);
    const chats = loadChats(userId).filter((c) => c.id !== chatId);
    localStorage.setItem(key, JSON.stringify(chats));
  } catch (error) {
    console.error("Error eliminando chat:", error);
  }
}

// Crear un nuevo chat
export function createChat(userId: string | undefined, title?: string): Chat {
  const chat: Chat = {
    id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: title || "Nueva conversación",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    userId,
  };
  
  saveChat(userId, chat);
  return chat;
}

// Actualizar el título de un chat
export function updateChatTitle(
  userId: string | undefined,
  chatId: string,
  title: string
): void {
  const chat = loadChat(userId, chatId);
  if (chat) {
    chat.title = title;
    chat.updatedAt = Date.now();
    saveChat(userId, chat);
  }
}

// Añadir un mensaje a un chat
export function addMessageToChat(
  userId: string | undefined,
  chatId: string,
  message: Omit<ChatMessage, "timestamp">
): void {
  const chat = loadChat(userId, chatId);
  if (chat) {
    const newMessage: ChatMessage = {
      ...message,
      timestamp: Date.now(),
    };
    
    chat.messages.push(newMessage);
    chat.updatedAt = Date.now();
    
    // Generar título automático si es el primer mensaje del usuario
    if (chat.messages.length === 1 && message.role === "user") {
      const title = message.content.slice(0, 50).trim();
      chat.title = title.length < message.content.length ? `${title}...` : title;
    }
    
    saveChat(userId, chat);
  }
}

// Limpiar todos los chats (útil para desarrollo/testing)
export function clearAllChats(userId?: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error limpiando chats:", error);
  }
}
