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
}

export default function HomePage() {
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const text = await response.text();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: text,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <AuthGuard>
      <main className="h-screen bg-white dark:bg-zinc-900">
        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar - Notion style */}
            <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">📅</div>
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Routine Agent</h1>
                  <p className="text-base text-zinc-500">Gestiona tus rutinas con inteligencia artificial</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />

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

            {/* Calendar Content - Notion style */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 bg-zinc-50 dark:bg-zinc-900/50">
              <CalendarWithAuth
                timezone="America/Lima"
                onAccessTokenReady={(token) => console.log("Token listo para API")}
              />
            </div>
          </div>

          {/* Sidebar - Chat (Right) - Notion style */}
          <div className="w-105 border-l border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900 shrink-0">
            {/* Chat Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="text-3xl">💬</div>
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Asistente IA</h2>
                  <p className="text-base text-zinc-500">Pregúntame sobre tus rutinas</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollShadow className="flex-1 p-5 space-y-5 overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">👋</div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-6">
                    ¡Hola! Soy tu asistente de rutinas.
                  </p>
                  <div className="space-y-3">
                    <SuggestionButton
                      text="📆 ¿Qué eventos tengo hoy?"
                      onClick={() => {
                        const event = { target: { value: "¿Qué eventos tengo programados para hoy?" } } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(event);
                      }}
                    />
                    <SuggestionButton
                      text="🌅 Crear rutina matutina"
                      onClick={() => {
                        const event = { target: { value: "Ayúdame a crear una rutina matutina saludable" } } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(event);
                      }}
                    />
                    <SuggestionButton
                      text="📊 Analizar mi semana"
                      onClick={() => {
                        const event = { target: { value: "¿Cuándo tengo tiempo libre esta semana?" } } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(event);
                      }}
                    />
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3 ${message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      }`}
                  >
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-5 py-4">
                    <Spinner size="md" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-base">
                    Error: {error.message}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </ScrollShadow>

            {/* Input - Notion style */}
            <form onSubmit={handleSubmit} className="p-5 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Escribe un mensaje..."
                  size="lg"
                  radius="lg"
                  classNames={{
                    input: "text-base",
                    inputWrapper: "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 h-14",
                  }}
                />
                <Button
                  type="submit"
                  isIconOnly
                  color="primary"
                  radius="lg"
                  size="lg"
                  isLoading={isLoading}
                  isDisabled={!input?.trim()}
                  className="h-14 w-14 bg-blue-500 hover:bg-blue-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
      className="w-full text-left px-4 py-3 text-base text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
    >
      {text}
    </button>
  );
}
