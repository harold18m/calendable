"use client";

import { Button } from "@heroui/react";
import { signIn } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, FormEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

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

function HeartIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="url(#heartGradient)"
      />
      <defs>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="100%" stopColor="#6b7280" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [input, setInput] = useState("");
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
      const isMobile = window.innerWidth < 640;
      const minHeight = isMobile ? 40 : 48;
      const maxHeight = 200;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
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
      const isMobile = window.innerWidth < 640;
      const minHeight = isMobile ? 40 : 48;
      const maxHeight = 200;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
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
      <nav className="h-14 sm:h-16 shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8">
              <HeartIcon />
            </div>
            <h1 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">
              Calendable
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button
              variant="light"
              size="sm"
              onPress={handleGetStarted}
              className="hidden sm:flex text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
            >
              Log in
            </Button>
            <Button
              size="sm"
              onPress={handleGetStarted}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-medium text-xs sm:text-sm px-3 sm:px-4"
              startContent={<GoogleIcon />}
            >
              <span className="hidden xs:inline">Get started</span>
              <span className="xs:hidden">Get started</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-12 sm:pb-20 pt-8 sm:pt-0 bg-gradient-to-b from-white via-zinc-50/50 to-white dark:from-zinc-900 dark:via-zinc-950/50 dark:to-zinc-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl"
        >
          {/* Heading */}
          <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center text-zinc-900 dark:text-white mb-3 sm:mb-4 leading-tight">
            Planifica tu vida
          </h2>
          
          {/* Subheading */}
          <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-center text-zinc-600 dark:text-zinc-400 mb-8 sm:mb-12 font-medium px-2">
            Organiza tu calendario hablando con IA
          </p>

          {/* Chat Input - Large and Prominent */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
              {/* Contenedor del input grande */}
              <div className="relative flex items-center gap-2 sm:gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl sm:rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-lg hover:shadow-xl hover:border-zinc-300 dark:hover:border-zinc-600 transition-all px-3 sm:px-4 py-2 sm:py-3">
                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Pregunta a Calendable qué quieres planificar..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent border-0 outline-none text-sm sm:text-base font-normal placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100 min-h-[40px] sm:min-h-[48px] max-h-[200px] overflow-y-auto focus:ring-0 leading-6 sm:leading-7"
                  style={{ 
                    height: 'auto'
                  }}
                />
                
                {/* Botón Enviar */}
                <Button
                  type="submit"
                  isIconOnly
                  color="primary"
                  radius="full"
                  size="sm"
                  isDisabled={!input?.trim()}
                  className="h-8 w-8 sm:h-9 sm:w-9 min-w-8 sm:min-w-9 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Enviar mensaje"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 sm:py-6 px-4 sm:px-6 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          <Link 
            href="/privacy" 
            className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors text-center"
          >
            Política de Privacidad
          </Link>
          <span className="hidden sm:inline">•</span>
          <Link 
            href="/terms" 
            className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors text-center"
          >
            Términos de Servicio
          </Link>
        </div>
      </footer>
    </div>
  );
}
