// Almacenamiento local de eventos del calendario
// Similar a chat-storage.ts pero para eventos
// Funciona tanto en cliente como servidor usando diferentes estrategias

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  start: string; // ISO string
  end: string; // ISO string
  timezone?: string;
  recurring?: boolean;
  recurrenceRule?: string; // RRULE format
  location?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY_PREFIX = "calendable-events-";

// Almacenamiento en memoria para servidor (en producción usarías una base de datos real)
const serverStorage = new Map<string, CalendarEvent[]>();

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

export function saveEvent(userId: string, event: CalendarEvent): void {
  const key = getStorageKey(userId);
  
  if (typeof window !== "undefined") {
    // Cliente: usar localStorage
    const events = loadEvents(userId);
    const existingIndex = events.findIndex((e) => e.id === event.id);
    if (existingIndex >= 0) {
      events[existingIndex] = { ...event, updatedAt: Date.now() };
    } else {
      events.push({ ...event, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(key, JSON.stringify(events));
  } else {
    // Servidor: usar Map en memoria (en producción usarías una DB)
    const events = serverStorage.get(key) || [];
    const existingIndex = events.findIndex((e) => e.id === event.id);
    if (existingIndex >= 0) {
      events[existingIndex] = { ...event, updatedAt: Date.now() };
    } else {
      events.push({ ...event, createdAt: Date.now(), updatedAt: Date.now() });
    }
    serverStorage.set(key, events);
  }
}

export function loadEvents(userId: string): CalendarEvent[] {
  const key = getStorageKey(userId);
  
  if (typeof window !== "undefined") {
    // Cliente: usar localStorage
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  } else {
    // Servidor: usar Map en memoria
    return serverStorage.get(key) || [];
  }
}

export function getEvent(userId: string, eventId: string): CalendarEvent | null {
  const events = loadEvents(userId);
  return events.find((e) => e.id === eventId) || null;
}

export function deleteEvent(userId: string, eventId: string): boolean {
  const key = getStorageKey(userId);
  const events = loadEvents(userId);
  const filtered = events.filter((e) => e.id !== eventId);
  
  if (typeof window !== "undefined") {
    // Cliente: usar localStorage
    localStorage.setItem(key, JSON.stringify(filtered));
  } else {
    // Servidor: usar Map en memoria
    serverStorage.set(key, filtered);
  }
  
  return filtered.length < events.length;
}

export function getEventsInRange(
  userId: string,
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  const events = loadEvents(userId);
  
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // Verificar si el evento se superpone con el rango
    return (
      (eventStart >= startDate && eventStart <= endDate) ||
      (eventEnd >= startDate && eventEnd <= endDate) ||
      (eventStart <= startDate && eventEnd >= endDate)
    );
  });
}

export function getUpcomingEvents(userId: string, limit: number = 10): CalendarEvent[] {
  const events = loadEvents(userId);
  const now = new Date();
  
  return events
    .filter((event) => new Date(event.start) >= now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, limit);
}

export function clearAllEvents(userId: string): void {
  const key = getStorageKey(userId);
  
  if (typeof window !== "undefined") {
    // Cliente: usar localStorage
    localStorage.removeItem(key);
  } else {
    // Servidor: usar Map en memoria
    serverStorage.delete(key);
  }
}
