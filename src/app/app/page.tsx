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
  ScrollShadow,
  Spinner,
} from "@heroui/react";
import { useRef, useEffect, useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function AppPage() {
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const calendarRefreshRef = useRef<(() => Promise<void>) | null>(null);
  const [previewEvents, setPreviewEvents] = useState<PreviewEvent[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [inputRows, setInputRows] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ocultar welcome después de 5 segundos o cuando hay mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false);
    } else {
      const timer = setTimeout(() => setShowWelcome(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

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
    setInputRows(1);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Ajustar altura del textarea automáticamente
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24; // Altura aproximada de una línea
      const minHeight = 44; // Altura mínima
      const maxHeight = lineHeight * 6; // Máximo 6 líneas
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
      
      // Detectar si hay múltiples líneas o el textarea es más alto que una línea
      const hasMultipleLines = scrollHeight > minHeight || value.includes('\n');
      setInputRows(hasMultipleLines ? 2 : 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        const syntheticEvent = {
          preventDefault: () => {},
          currentTarget: e.currentTarget.closest('form'),
          target: e.currentTarget.closest('form'),
        } as unknown as FormEvent<HTMLFormElement>;
        handleSubmit(syntheticEvent);
      }
    }
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
      <main className="h-screen flex flex-col bg-white dark:bg-zinc-900">
        {/* Top Navbar - Estilo Lovable */}
        <nav className="h-14 shrink-0 bg-white dark:bg-zinc-900">
          <div className="h-full px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <h1 className="text-base font-semibold text-zinc-900 dark:text-white">
                Calendable
              </h1>
              {/* Botón para mostrar/ocultar chat */}
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() => setIsChatOpen(!isChatOpen)}
                className="h-7 w-7 min-w-7 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                aria-label={isChatOpen ? "Ocultar chat" : "Mostrar chat"}
              >
                {isChatOpen ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {session?.user && (
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Button
                      variant="light"
                      className="h-8 px-2 gap-2 min-w-0"
                    >
                      <Avatar
                        src={session.user.image || undefined}
                        name={session.user.name || "User"}
                        size="sm"
                        className="w-7 h-7"
                      />
                      <span className="hidden sm:inline text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {session.user.name?.split(' ')[0] || 'Usuario'}
                      </span>
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
                      onPress={() => signOut({ callbackUrl: "/" })}
                    >
                      Cerrar sesión
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              )}
            </div>
          </div>
        </nav>

        {/* Main Layout - Chat Left, Calendar Right */}
        <div className="flex-1 flex overflow-hidden bg-white dark:bg-zinc-900">
          {/* Left Sidebar - Chat (Herramienta Principal) - Estilo Lovable */}
          <motion.div
            initial={false}
            animate={{
              width: isChatOpen ? 420 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col bg-white dark:bg-zinc-900 shrink-0 overflow-hidden"
          >
            {isChatOpen && (
              <>
                {/* Messages Area - Estilo Lovable */}
                <ScrollShadow className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent via-zinc-50/30 to-transparent dark:via-zinc-900/30">
                      <AnimatePresence>
                {showWelcome && messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                  >
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/30 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                            ¡Hola{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}! 👋
                          </h3>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            ¿Qué te gustaría planificar o hacer? Escribe aquí y te ayudo a organizarlo en tu calendario.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

                        {messages.length === 0 && !showWelcome && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="text-center py-8"
                          >
                            <div className="mb-6">
                              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.7-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                                ¿Qué te gustaría planificar?
                              </h3>
                              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                                Escribe aquí lo que quieres hacer y te ayudo a organizarlo
                              </p>
                            </div>
                            <div className="space-y-3">
                              <SuggestionButton
                                text="🌅 Crear rutina matutina"
                                description="Empieza el día con energía"
                                onClick={() => {
                                  setInput("Quiero crear una rutina matutina para empezar el día con energía");
                                  if (textareaRef.current) {
                                    textareaRef.current.focus();
                                  }
                                }}
                              />
                              <SuggestionButton
                                text="🏋️ Rutina de ejercicio"
                                description="3 veces por semana"
                                onClick={() => {
                                  setInput("Ayúdame a crear una rutina de ejercicio 3 veces por semana");
                                  if (textareaRef.current) {
                                    textareaRef.current.focus();
                                  }
                                }}
                              />
                              <SuggestionButton
                                text="📚 Tiempo de estudio"
                                description="Por las tardes"
                                onClick={() => {
                                  setInput("Necesito una rutina para estudiar inglés por las tardes");
                                  if (textareaRef.current) {
                                    textareaRef.current.focus();
                                  }
                                }}
                              />
                              <SuggestionButton
                                text="🧘 Rutina de meditación"
                                description="Todos los días"
                                onClick={() => {
                                  setInput("Quiero meditar todos los días en las mañanas");
                                  if (textareaRef.current) {
                                    textareaRef.current.focus();
                                  }
                                }}
                              />
                            </div>
                          </motion.div>
                        )}

                        {messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="space-y-2"
                          >
                            <div
                              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm transition-all ${
                                  message.role === "user"
                                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm shadow-blue-500/20"
                                    : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200/80 dark:border-zinc-700/80 rounded-tl-sm"
                                }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                            {/* Botones de confirmación para propuestas de rutina */}
                            {message.role === "assistant" && message.isRoutineProposal && !message.confirmed && (
                              <div className="flex justify-start gap-2 ml-1 mt-2">
                                <Button
                                  size="sm"
                                  color="success"
                                  variant="flat"
                                  onPress={() => handleConfirmRoutine(message.id)}
                                  className="text-xs h-7 px-3 font-medium shadow-sm hover:shadow-md transition-all"
                                >
                                  ✓ Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  onPress={() => handleRejectRoutine(message.id)}
                                  className="text-xs h-7 px-3 font-medium shadow-sm hover:shadow-md transition-all"
                                >
                                  ✗ Cancelar
                                </Button>
                              </div>
                            )}
                            {message.confirmed && (
                              <div className="flex justify-start ml-1 mt-2">
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Confirmado
                                </span>
                              </div>
                            )}
                          </motion.div>
                        ))}

                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white dark:bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm">
                              <Spinner size="sm" color="primary" />
                            </div>
                          </div>
                        )}

                        {error && (
                          <div className="flex justify-center">
                            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800/50 text-sm shadow-sm">
                              Error: {error.message}
                            </div>
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                </ScrollShadow>

                {/* Input Area - Estilo ChatGPT */}
                <div className="shrink-0 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">                      
                  <form onSubmit={handleSubmit} className="p-4">
                    <div className="relative flex flex-col">
                      {/* Contenedor del input con botón incrustado */}
                      <div className={`relative flex items-end gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${
                        inputRows > 1 ? 'pb-2' : ''
                      }`}>
                        {/* Textarea */}
                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Ask Calendable..."
                          rows={1}
                          className="flex-1 resize-none bg-transparent border-0 outline-none text-sm font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-white py-3 px-4 min-h-[44px] max-h-[144px] overflow-y-auto"
                          style={{ 
                            lineHeight: '24px',
                            height: '44px'
                          }}
                        />
                        
                        {/* Botón de envío - incrustado cuando hay 1 línea, abajo cuando hay múltiples */}
                        <div className={`flex items-end pb-2 transition-all ${
                          inputRows > 1 ? 'absolute right-2 bottom-2' : 'pr-2'
                        }`}>
                          <Button
                            type="submit"
                            isIconOnly
                            color="primary"
                            radius="full"
                            size="sm"
                            isLoading={isLoading}
                            isDisabled={!input?.trim()}
                            className="h-8 w-8 min-w-8 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all flex-shrink-0"
                            aria-label="Enviar mensaje"
                          >
                            {!isLoading && (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18m-8.5-8.5h17" />
                              </svg>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </>
            )}
          </motion.div>

          {/* Right Content - Calendar (Main Area) */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Calendar Content con esquinas redondeadas */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-tl-2xl bg-zinc-50 dark:bg-zinc-950 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
              <div className="flex-1 flex flex-col overflow-hidden p-6">
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
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}

function SuggestionButton({ 
  text, 
  description, 
  onClick 
}: { 
  text: string; 
  description?: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left px-4 py-3 text-sm bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {text}
          </p>
          {description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
        <svg className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </motion.button>
  );
}
