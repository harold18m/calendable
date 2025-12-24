"use client";

import { useSession, signOut } from "next-auth/react";
import { AuthGuard } from "@/components/auth-guard";
import { CalendarWithAuth } from "@/components/calendar-with-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Button,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  ScrollShadow,
  Spinner,
} from "@heroui/react";
import { useRef, useEffect, useState, FormEvent } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isRoutineProposal?: boolean;
  confirmed?: boolean;
}

interface PreviewEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  isPreview: boolean;
}

// Detectar si un mensaje del asistente contiene una propuesta de rutina
const isRoutineProposal = (content: string): boolean => {
  const keywords = [
    "propongo", "propuesta", "confirma", "¿te parece", "¿quieres que",
    "crear el evento", "crear los eventos", "agendar", "programar",
    "lunes", "martes", "miércoles", "jueves", "viernes",
    "frecuencia", "duración", "horario"
  ];
  const lowerContent = content.toLowerCase();
  return keywords.filter(k => lowerContent.includes(k)).length >= 2;
};

// Detectar si la respuesta indica que se crearon eventos
const didCreateEvents = (content: string): boolean => {
  const keywords = [
    "creado", "creé", "agregado", "agregué", "programado", "programé",
    "agendado", "agendé", "listo", "evento creado", "eventos creados",
    "añadido", "añadí", "registrado", "registré", "calendario actualizado"
  ];
  const lowerContent = content.toLowerCase();
  return keywords.some(k => lowerContent.includes(k));
};

// Parsear propuesta del agente para generar eventos de preview
const parseRoutineProposal = (content: string): PreviewEvent[] => {
  const events: PreviewEvent[] = [];
  const lowerContent = content.toLowerCase();

  // Mapeo de días en español a número (0 = domingo)
  const dayMap: { [key: string]: number } = {
    'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3,
    'jueves': 4, 'viernes': 5, 'sábado': 6
  };

  // Buscar patrones de hora (ej: "07:00", "7:00 AM", "19:00")
  const timeRegex = /(\d{1,2}):(\d{2})\s*(am|pm)?/gi;
  const times: string[] = [];
  let match;
  while ((match = timeRegex.exec(content)) !== null) {
    let hour = parseInt(match[1]);
    const minute = match[2];
    const ampm = match[3]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    times.push(`${hour.toString().padStart(2, '0')}:${minute}`);
  }

  // Buscar días mencionados
  const daysFound: number[] = [];
  Object.entries(dayMap).forEach(([dayName, dayNum]) => {
    if (lowerContent.includes(dayName)) {
      daysFound.push(dayNum);
    }
  });

  // Buscar nombre de la rutina
  let routineName = "Nueva Rutina";
  const routinePatterns = [
    /rutina\s+de\s+(\w+)/i,
    /(\w+)\s+rutina/i,
    /para\s+(\w+)/i,
  ];
  for (const pattern of routinePatterns) {
    const nameMatch = content.match(pattern);
    if (nameMatch) {
      routineName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
      break;
    }
  }

  // Buscar duración (ej: "30 minutos", "1 hora")
  let durationMinutes = 30;
  const durationMatch = content.match(/(\d+)\s*(minutos?|min|hora?s?)/i);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    durationMinutes = unit.startsWith('hora') ? value * 60 : value;
  }

  // Si encontramos días y horas, crear eventos preview
  if (daysFound.length > 0 && times.length > 0) {
    const startTime = times[0];
    const today = new Date();

    daysFound.forEach((targetDay, idx) => {
      // Encontrar la próxima fecha para este día
      const daysUntilTarget = (targetDay - today.getDay() + 7) % 7 || 7;
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + daysUntilTarget);

      const [startHour, startMin] = startTime.split(':').map(Number);
      const startDateTime = new Date(eventDate);
      startDateTime.setHours(startHour, startMin, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

      events.push({
        id: `preview-${Date.now()}-${idx}`,
        summary: routineName,
        start: { dateTime: startDateTime.toISOString() },
        end: { dateTime: endDateTime.toISOString() },
        isPreview: true,
      });
    });
  }

  return events;
};

export default function HomePage() {
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const calendarRefreshRef = useRef<(() => Promise<void>) | null>(null);
  const [previewEvents, setPreviewEvents] = useState<PreviewEvent[]>([]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      // Manejar diferentes códigos de error
      if (!response.ok) {
        if (response.status === 429) {
          const text = await response.text();
          throw new Error(text || "Servicio ocupado. Intenta de nuevo en unos segundos.");
        }
        throw new Error("Error en la respuesta del servidor");
      }

      const text = await response.text();
      const isProposal = isRoutineProposal(text);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: text,
        isRoutineProposal: isProposal,
        confirmed: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Si es una propuesta, generar eventos preview
      if (isProposal) {
        const parsedEvents = parseRoutineProposal(text);
        if (parsedEvents.length > 0) {
          setPreviewEvents(parsedEvents);
        }
      }

      // Si se crearon eventos, actualizar el calendario y limpiar previews
      if (didCreateEvents(text)) {
        setPreviewEvents([]); // Limpiar previews
        setTimeout(async () => {
          if (calendarRefreshRef.current) {
            await calendarRefreshRef.current();
          }
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Confirmar rutina - envía mensaje al agente para crear los eventos
  const handleConfirmRoutine = async (messageId: string) => {
    // Marcar como confirmado
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, confirmed: true } : m
    ));

    // Enviar confirmación al agente
    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Sí, confirmo. Crea los eventos en mi calendario.",
    };

    setMessages((prev) => [...prev, confirmMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, confirmMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const text = await response.text();
          throw new Error(text || "Servicio ocupado. Intenta de nuevo en unos segundos.");
        }
        throw new Error("Error en la respuesta del servidor");
      }

      const text = await response.text();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: text,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Limpiar previews y actualizar el calendario
      setPreviewEvents([]); // Siempre limpiar al confirmar

      if (didCreateEvents(text)) {
        setTimeout(async () => {
          if (calendarRefreshRef.current) {
            await calendarRefreshRef.current();
          }
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
    } finally {
      setIsLoading(false);
    }
  };

  // Cancelar rutina
  const handleRejectRoutine = (messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isRoutineProposal: false } : m
    ));
    setPreviewEvents([]); // Limpiar previews al cancelar
  };

  return (
    <AuthGuard>
      <main className="h-screen bg-white dark:bg-zinc-900">
        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Routine Agent</h1>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />

                {/* Chat Toggle Button */}
                <Button
                  isIconOnly
                  variant="light"
                  onPress={() => setIsChatOpen(!isChatOpen)}
                  className="w-10 h-10 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label={isChatOpen ? "Cerrar chat" : "Abrir chat"}
                >
                  {isChatOpen ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                  )}
                </Button>

                {session?.user && (
                  <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                      <Button
                        variant="light"
                        className="flex items-center gap-3 h-auto py-2 px-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                      >
                        <div className="text-right hidden sm:block">
                          <p className="font-medium text-base text-zinc-900 dark:text-white">{session.user.name}</p>
                          <p className="text-sm text-zinc-500">{session.user.email}</p>
                        </div>
                        <Avatar
                          src={session.user.image || undefined}
                          name={session.user.name || "User"}
                          size="md"
                          className="w-10 h-10"
                        />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="User menu" className="w-64">
                      <DropdownItem
                        key="profile"
                        className="h-16 gap-3"
                        textValue="Profile"
                      >
                        <p className="font-semibold text-base">{session.user.name}</p>
                        <p className="text-sm text-zinc-500">{session.user.email}</p>
                      </DropdownItem>
                      <DropdownItem
                        key="logout"
                        color="danger"
                        className="text-base"
                        onPress={() => signOut()}
                      >
                        Cerrar sesión
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                )}
              </div>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 flex flex-col overflow-hidden p-4 bg-zinc-50 dark:bg-zinc-900/50">
              <CalendarWithAuth
                timezone="America/Lima"
                onAccessTokenReady={(token) => console.log("Token listo para API")}
                onRefreshReady={(refreshFn) => {
                  calendarRefreshRef.current = refreshFn;
                }}
                previewEvents={previewEvents}
              />
            </div>
          </div>

          {/* Sidebar - Chat */}
          <div
            className={`border-l border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900 shrink-0 transition-all duration-300 ease-in-out ${isChatOpen ? 'w-105' : 'w-0 border-l-0 overflow-hidden'
              }`}
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 min-w-105">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-zinc-900 dark:text-white">Asistente IA</h2>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => setIsChatOpen(false)}
                  className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Cerrar chat"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollShadow className="flex-1 p-4 space-y-4 overflow-y-auto min-w-105">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                    ¿Qué rutina quieres crear?
                  </p>
                  <div className="space-y-2">
                    <SuggestionButton
                      text="🌅 Crear rutina matutina"
                      onClick={() => {
                        const event = { target: { value: "Quiero crear una rutina matutina para empezar el día con energía" } } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(event);
                      }}
                    />
                    <SuggestionButton
                      text="🏋️ Rutina de ejercicio"
                      onClick={() => {
                        const event = { target: { value: "Ayúdame a crear una rutina de ejercicio 3 veces por semana" } } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(event);
                      }}
                    />
                    <SuggestionButton
                      text="📚 Tiempo de estudio"
                      onClick={() => {
                        const event = { target: { value: "Necesito una rutina para estudiar inglés por las tardes" } } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(event);
                      }}
                    />
                    <SuggestionButton
                      text="🧘 Rutina de meditación"
                      onClick={() => {
                        const event = { target: { value: "Quiero meditar todos los días en las mañanas" } } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(event);
                      }}
                    />
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 ${message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                  {/* Botones de confirmación para propuestas de rutina */}
                  {message.role === "assistant" && message.isRoutineProposal && !message.confirmed && (
                    <div className="flex justify-start gap-2 ml-1">
                      <Button
                        size="sm"
                        color="success"
                        variant="flat"
                        onPress={() => handleConfirmRoutine(message.id)}
                        className="text-xs"
                      >
                        ✓ Confirmar
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => handleRejectRoutine(message.id)}
                        className="text-xs"
                      >
                        ✗ Cancelar
                      </Button>
                    </div>
                  )}
                  {message.confirmed && (
                    <div className="flex justify-start ml-1">
                      <span className="text-xs text-green-600 dark:text-green-400">✓ Confirmado</span>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-2">
                    <Spinner size="sm" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-2 rounded text-sm">
                    Error: {error.message}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </ScrollShadow>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-200 dark:border-zinc-800 min-w-105">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Escribe un mensaje..."
                  size="md"
                  radius="md"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
                  }}
                />
                <Button
                  type="submit"
                  isIconOnly
                  color="primary"
                  radius="md"
                  size="md"
                  isLoading={isLoading}
                  isDisabled={!input?.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}

function SuggestionButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
    >
      {text}
    </button>
  );
}
