"use client";

import { Button } from "@heroui/react";
import { signIn } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, FormEvent } from "react";
import { motion } from "framer-motion";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [inputRows, setInputRows] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cargar mensaje pendiente del localStorage al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pendingMessage = localStorage.getItem("calendable-pending-message");
      if (pendingMessage) {
        setInput(pendingMessage);
        // Ajustar altura del textarea
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            const lineHeight = 24;
            const minHeight = 56;
            const maxHeight = lineHeight * 6;
            const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
            textareaRef.current.style.height = `${newHeight}px`;
            
            const hasMultipleLines = scrollHeight > minHeight || pendingMessage.includes('\n');
            setInputRows(hasMultipleLines ? 2 : 1);
          }
        }, 100);
      }
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/app");
    }
  }, [status, router]);

  const handleGetStarted = () => {
    signIn("google", { callbackUrl: "/app" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Persistir el input en localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("calendable-pending-message", value);
    }
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24;
      const minHeight = 56;
      const maxHeight = lineHeight * 6;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
      
      const hasMultipleLines = scrollHeight > minHeight || value.includes('\n');
      setInputRows(hasMultipleLines ? 2 : 1);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Redirigir a login si no está autenticado
    handleGetStarted();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  // Si está autenticado, mostrar loading mientras redirige
  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-900">
      {/* Navbar */}
      <nav className="h-16 shrink-0 bg-white dark:bg-zinc-900">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <CalendarIcon />
            </div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Calendable
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="light"
              size="sm"
              onPress={handleGetStarted}
              className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
            >
              Log in
            </Button>
            <Button
              size="sm"
              onPress={handleGetStarted}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-medium"
              startContent={<GoogleIcon />}
            >
              Get started
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20 bg-gradient-to-b from-white via-zinc-50/50 to-white dark:from-zinc-900 dark:via-zinc-950/50 dark:to-zinc-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl"
        >
          {/* Heading */}
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-center text-zinc-900 dark:text-white mb-4">
            Planifica tu vida
          </h2>
          
          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-center text-zinc-600 dark:text-zinc-400 mb-12 font-medium">
            Organiza tu calendario hablando con IA
          </p>

          {/* Chat Input - Large and Prominent */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
              {/* Contenedor del input grande */}
              <div className={`relative flex items-end gap-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-lg hover:shadow-xl hover:border-zinc-300 dark:hover:border-zinc-600 transition-all ${
                inputRows > 1 ? 'pb-3' : ''
              }`}>
                {/* Botón + a la izquierda */}
                <div className="pl-4 pb-3">
                  {/* <Button
                    type="button"
                    isIconOnly
                    variant="light"
                    size="sm"
                    className="h-8 w-8 min-w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                    aria-label="Acciones rápidas"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </Button> */}
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Pregunta a Calendable qué quieres planificar..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent border-0 outline-none text-base font-normal placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100 py-4 min-h-[56px] max-h-[200px] overflow-y-auto focus:ring-0"
                  style={{ 
                    lineHeight: '28px',
                    height: '56px'
                  }}
                />
                
                {/* Botones a la derecha */}
                <div className={`flex items-end gap-2 pr-2 pb-3 transition-all ${
                  inputRows > 1 ? 'absolute right-2 bottom-3' : ''
                }`}>
                  {/* Botón Chat */}
                  {/* <Button
                    type="button"
                    isIconOnly
                    variant="light"
                    size="sm"
                    className="h-8 w-8 min-w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                    aria-label="Chat"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                  </Button> */}

                  {/* Botón Audio */}
                  {/* <Button
                    type="button"
                    isIconOnly
                    variant="light"
                    size="sm"
                    className="h-8 w-8 min-w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                    aria-label="Voz"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  </Button> */}

                  {/* Botón Enviar */}
                  <Button
                    type="submit"
                    isIconOnly
                    color="primary"
                    radius="full"
                    size="sm"
                    isDisabled={!input?.trim()}
                    className="h-8 w-8 min-w-8 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Enviar mensaje"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
