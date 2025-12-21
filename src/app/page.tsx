"use client";

import { useSession, signOut } from "next-auth/react";
import { AuthGuard } from "@/components/auth-guard";
import { CalendarWithAuth } from "@/components/calendar-with-auth";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Avatar,
  Chip,
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
      <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5">
        <div className="flex h-screen">
          {/* Sidebar - Chat */}
          <div className="w-96 border-r border-divider flex flex-col bg-content1">
            {/* Chat Header */}
            <div className="p-4 border-b border-divider">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold">Routine Agent</h2>
                  <p className="text-tiny text-default-500">Asistente de rutinas con IA</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollShadow className="flex-1 p-4 space-y-4 overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-default-400 text-sm mb-4">
                    👋 ¡Hola! Soy tu asistente de rutinas.
                  </p>
                  <div className="space-y-2">
                    <SuggestionButton
                      text="¿Qué eventos tengo hoy?"
                      onClick={() => {
                        const event = { target: { value: "¿Qué eventos tengo programados para hoy?" } } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(event);
                      }}
                    />
                    <SuggestionButton
                      text="Crear rutina matutina"
                      onClick={() => {
                        const event = { target: { value: "Ayúdame a crear una rutina matutina saludable" } } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(event);
                      }}
                    />
                    <SuggestionButton
                      text="Analizar mi semana"
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
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-default-100"
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-default-100 rounded-2xl px-4 py-3">
                    <Spinner size="sm" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <Chip color="danger" variant="flat" size="sm">
                    Error: {error.message}
                  </Chip>
                </div>
              )}

              <div ref={messagesEndRef} />
            </ScrollShadow>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-divider">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Escribe un mensaje..."
                  size="sm"
                  radius="lg"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "bg-default-100",
                  }}
                />
                <Button
                  type="submit"
                  isIconOnly
                  color="primary"
                  radius="lg"
                  isLoading={isLoading}
                  isDisabled={!input?.trim()}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </Button>
              </div>
            </form>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <Card className="shadow-md">
                <CardBody className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">Routine Agent</h1>
                      <p className="text-small text-default-500">Gestiona tus rutinas con IA</p>
                    </div>
                  </div>

                  {session?.user && (
                    <Dropdown placement="bottom-end">
                      <DropdownTrigger>
                        <Button
                          variant="light"
                          className="flex items-center gap-3 h-auto py-2"
                        >
                          <div className="text-right hidden sm:block">
                            <p className="font-medium text-sm">{session.user.name}</p>
                            <p className="text-tiny text-default-400">{session.user.email}</p>
                          </div>
                          <Avatar
                            src={session.user.image || undefined}
                            name={session.user.name || "User"}
                            size="sm"
                            isBordered
                            color="primary"
                          />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="User menu">
                        <DropdownItem
                          key="profile"
                          className="h-14 gap-2"
                          textValue="Profile"
                        >
                          <p className="font-semibold">{session.user.name}</p>
                          <p className="text-small text-default-500">{session.user.email}</p>
                        </DropdownItem>
                        <DropdownItem
                          key="logout"
                          color="danger"
                          onPress={() => signOut()}
                        >
                          Cerrar sesión
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  )}
                </CardBody>
              </Card>

              {/* Google Calendar */}
              <Card className="shadow-md">
                <CardHeader className="flex items-center gap-2 pb-0">
                  <Chip color="primary" variant="flat" size="sm">Calendario</Chip>
                  <h2 className="text-lg font-semibold">Google Calendar</h2>
                </CardHeader>
                <CardBody className="pt-4">
                  <CalendarWithAuth
                    timezone="America/Lima"
                    onAccessTokenReady={(token) => console.log("Token listo para API")}
                  />
                </CardBody>
              </Card>

              {/* Info Card */}
              <Card className="shadow-md bg-primary/5 border border-primary/20">
                <CardBody className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Usando Vercel AI SDK</p>
                      <p className="text-tiny text-default-500 mt-1">
                        Conectado a Amazon Bedrock con Claude Sonnet 4. Usa el chat para gestionar tus rutinas.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}

function SuggestionButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <Button
      variant="flat"
      size="sm"
      className="w-full justify-start"
      onPress={onClick}
    >
      {text}
    </Button>
  );
}
