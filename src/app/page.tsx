"use client";

import { Button, Card, CardBody } from "@heroui/react";
import { signIn } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

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

function SparklesIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.7-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}

// Componente para cada paso
function StepComponent({
  step,
  title,
  description,
  color,
  icon,
  visual,
}: {
  step: number;
  title: string;
  description: string;
  color: "blue" | "slate" | "green";
  icon: React.ReactNode;
  visual: React.ReactNode;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const colorClasses = {
    blue: {
      bg: "bg-blue-600",
      text: "text-blue-600",
      light: "bg-blue-100 dark:bg-blue-900/30",
      border: "border-blue-200 dark:border-blue-800",
    },
    slate: {
      bg: "bg-slate-600",
      text: "text-slate-600",
      light: "bg-slate-100 dark:bg-slate-900/30",
      border: "border-slate-200 dark:border-slate-800",
    },
    green: {
      bg: "bg-green-600",
      text: "text-green-600",
      light: "bg-green-100 dark:bg-green-900/30",
      border: "border-green-200 dark:border-green-800",
    },
  };

  const colors = colorClasses[color];
  const isEven = step % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: step * 0.1 }}
      className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${
        isEven ? "lg:flex-row-reverse" : ""
      }`}
    >
      {/* Contenido de texto */}
      <div className="flex-1 lg:max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ duration: 0.5, delay: step * 0.1 + 0.2, type: "spring" }}
            className={`w-16 h-16 ${colors.bg} text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg`}
          >
            {step}
          </motion.div>
          <div className={`w-12 h-12 ${colors.light} rounded-xl flex items-center justify-center ${colors.border} border-2`}>
            {icon}
          </div>
        </div>
        <h3 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white">
          {title}
        </h3>
        <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>

      {/* Visualización */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.6, delay: step * 0.1 + 0.3 }}
        className="flex-1"
      >
        {visual}
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/app");
    }
  }, [status, router]);

  const handleGetStarted = () => {
    signIn("google", { callbackUrl: "/app" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-slate-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <CalendarIcon />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Routine Agent
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button
                color="primary"
                variant="flat"
                onPress={handleGetStarted}
                startContent={<GoogleIcon />}
              >
                Iniciar sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
              <SparklesIcon />
              <span>Asistente de IA para gestionar tus rutinas</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-blue-500 to-slate-600 bg-clip-text text-transparent">
              Organiza tu vida con
              <br />
              Inteligencia Artificial
            </h1>
            <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-3xl mx-auto">
              Crea y gestiona rutinas personalizadas en Google Calendar usando lenguaje natural.
              Tu asistente de IA entiende lo que necesitas y lo programa automáticamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                color="primary"
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold px-8 py-6 text-lg"
                onPress={handleGetStarted}
                startContent={<GoogleIcon />}
              >
                Comenzar gratis
              </Button>
              <Button
                size="lg"
                variant="bordered"
                className="font-semibold px-8 py-6 text-lg"
                onPress={() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Ver cómo funciona
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-zinc-900 dark:text-white">
            Todo lo que necesitas para organizar tu vida
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-zinc-200 dark:border-zinc-800">
              <CardBody className="p-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <ChatIcon />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
                  Conversación Natural
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Habla con tu asistente como si fuera una persona. Di "Quiero hacer ejercicio 3 veces por semana" y él se encargará del resto.
                </p>
              </CardBody>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800">
              <CardBody className="p-6">
                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center mb-4">
                  <CalendarIcon />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
                  Integración con Google Calendar
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Todos tus eventos se crean directamente en tu Google Calendar. Sincroniza automáticamente con todos tus dispositivos.
                </p>
              </CardBody>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800">
              <CardBody className="p-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <SparklesIcon />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
                  Inteligencia Adaptativa
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  El agente analiza tu disponibilidad y propone horarios que se ajustan a tu calendario existente.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-blue-50/20 to-transparent dark:via-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-zinc-900 dark:text-white">
              Cómo funciona
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              En solo 4 pasos simples, comienza a organizar tu vida con inteligencia artificial
            </p>
          </motion.div>

          <div className="relative">
            {/* Línea conectora vertical (solo en desktop) */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 via-slate-500 to-green-600 -translate-x-1/2 opacity-20"></div>

            <div className="space-y-24 lg:space-y-32">
              {/* Step 1 */}
              <StepComponent
                step={1}
                title="Conecta tu Google Calendar"
                description="Inicia sesión con tu cuenta de Google de forma segura. El agente accederá a tu calendario usando OAuth 2.0, el mismo estándar de seguridad que usan las aplicaciones más confiables."
                color="blue"
                icon={<GoogleIcon />}
                visual={
                  <div className="w-full max-w-md mx-auto">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm">
                          <GoogleIcon />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-zinc-900 dark:text-white">Continuar con Google</p>
                          <p className="text-xs text-zinc-500">Acceso seguro • Solo Calendar</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>OAuth 2.0 • Encriptado • Verificado</span>
                      </div>
                    </div>
                  </div>
                }
              />

              {/* Step 2 */}
              <StepComponent
                step={2}
                title="Habla con tu asistente"
                description="Escribe en lenguaje natural, como si hablaras con un asistente personal. El agente entiende tu intención y te hará preguntas inteligentes para obtener todos los detalles necesarios."
                color="slate"
                icon={<ChatIcon />}
                visual={
                  <div className="w-full max-w-md mx-auto">
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] shadow-sm">
                            <p className="text-sm">Quiero hacer ejercicio 3 veces por semana</p>
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-white dark:bg-zinc-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm border border-zinc-200 dark:border-zinc-700">
                            <p className="text-sm text-zinc-900 dark:text-white">
                              Perfecto. ¿A qué hora prefieres hacer ejercicio? ¿Y qué días de la semana te funcionan mejor?
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-4">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                          <span>El asistente está pensando...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />

              {/* Step 3 */}
              <StepComponent
                step={3}
                title="Revisa y confirma"
                description="El agente te mostrará una propuesta detallada con todos los eventos. Revisa los horarios, días y duración en tu calendario antes de confirmar. Tienes control total."
                color="blue"
                icon={<CalendarIcon />}
                visual={
                  <div className="w-full max-w-md mx-auto">
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                          <p className="text-sm text-zinc-900 dark:text-white mb-3">
                            Propongo crear eventos de ejercicio:
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                              <CalendarIcon />
                              <span>Lunes, Miércoles y Viernes</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>7:00 AM - 8:00 AM (1 hora)</span>
                            </div>
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3">¿Te parece bien?</p>
                        </div>
                        <div className="flex gap-3">
                          <Button size="sm" color="success" className="flex-1 font-medium">
                            ✓ Confirmar
                          </Button>
                          <Button size="sm" variant="flat" color="danger" className="flex-1">
                            ✗ Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />

              {/* Step 4 */}
              <StepComponent
                step={4}
                title="¡Listo! Tus eventos están en tu calendario"
                description="Los eventos se crean automáticamente en tu Google Calendar y se sincronizan instantáneamente con todos tus dispositivos. Tu rutina está lista para comenzar."
                color="green"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                visual={
                  <div className="w-full max-w-md mx-auto">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                            Eventos creados exitosamente
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                            3 eventos agregados a tu calendario
                          </p>
                          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m4.5 0a12.05 12.05 0 003.478-.397 7.5 7.5 0 000-14.954A12.05 12.05 0 0012 6c-2.006 0-3.9.61-5.478 1.649a7.5 7.5 0 000 14.954A12.05 12.05 0 0012 18z" />
                            </svg>
                            <span>Sincronizado con todos tus dispositivos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-zinc-900 dark:text-white">
            Ejemplos de uso
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border border-zinc-200 dark:border-zinc-800">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🌅</div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-zinc-900 dark:text-white">Rutina Matutina</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                      "Quiero crear una rutina matutina para empezar el día con energía"
                    </p>
                    <p className="text-xs text-zinc-500">
                      El agente te preguntará por horarios, actividades y frecuencia para crear una rutina personalizada.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🏋️</div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-zinc-900 dark:text-white">Rutina de Ejercicio</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                      "Ayúdame a crear una rutina de ejercicio 3 veces por semana"
                    </p>
                    <p className="text-xs text-zinc-500">
                      Programa sesiones de ejercicio que se ajusten a tu disponibilidad.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📚</div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-zinc-900 dark:text-white">Tiempo de Estudio</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                      "Necesito una rutina para estudiar inglés por las tardes"
                    </p>
                    <p className="text-xs text-zinc-500">
                      Crea bloques de tiempo dedicados para tus objetivos de aprendizaje.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🧘</div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-zinc-900 dark:text-white">Rutina de Meditación</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                      "Quiero meditar todos los días en las mañanas"
                    </p>
                    <p className="text-xs text-zinc-500">
                      Establece hábitos diarios que se integren perfectamente con tu calendario.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-zinc-900 dark:text-white">
            ¿Listo para organizar tu vida?
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-10">
            Comienza a crear rutinas personalizadas en minutos. Sin complicaciones, sin configuración compleja.
          </p>
          <Button
            size="lg"
            color="primary"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-6 text-lg"
            onPress={handleGetStarted}
            startContent={<GoogleIcon />}
          >
            Comenzar gratis con Google
          </Button>
          <p className="text-sm text-zinc-500 mt-6">
            Acceso seguro con OAuth 2.0 • Solo lectura/escritura de Calendar
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-zinc-600 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} Routine Agent. Hecho con ❤️ para ayudarte a organizar tu vida.</p>
        </div>
      </footer>
    </div>
  );
}
