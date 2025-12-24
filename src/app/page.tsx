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
  const [isChatOpen, setIsChatOpen] = useState(true);

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
                    ¿En qué puedo ayudarte?
                  </p>
                  <div className="space-y-2">
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
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
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
