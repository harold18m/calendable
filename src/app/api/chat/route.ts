import { Agent, BedrockModel } from "@strands-agents/sdk";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createGoogleCalendarTools } from "@/agent/google-calendar-tools-factory";

export const maxDuration = 60;

// Helper para esperar
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Modelos disponibles (mismo que agent.ts)
const AVAILABLE_MODELS = {
    "claude-sonnet-4": "us.anthropic.claude-sonnet-4-20250514-v1:0",
    "claude-3.5-sonnet": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "claude-3-haiku": "anthropic.claude-3-haiku-20240307-v1:0",
    "claude-3-sonnet": "anthropic.claude-3-sonnet-20240229-v1:0",
} as const;

// Función para invocar al agente con reintentos
async function invokeWithRetry(message: string, tools: any[], systemPrompt: string, maxRetries = 3): Promise<string> {
    let lastError: Error | null = null;

    const CURRENT_MODEL = process.env.BEDROCK_MODEL || "claude-3-haiku";
    const modelId = AVAILABLE_MODELS[CURRENT_MODEL as keyof typeof AVAILABLE_MODELS] || AVAILABLE_MODELS["claude-sonnet-4"];
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

    const model = new BedrockModel({
        modelId,
        temperature: 0.3,
        region: region,
    });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const agent = new Agent({
                model,
                systemPrompt,
                tools,
            });
            const result = await agent.invoke(message);
            return result.toString();
        } catch (error: unknown) {
            lastError = error as Error;
            const errorName = (error as { name?: string })?.name || "";
            const errorMessage = (error as { message?: string })?.message || "";

            // Verificar si es error de throttling
            const isThrottling = errorName === "ThrottlingException" ||
                errorMessage.includes("Too many requests") ||
                errorMessage.includes("ThrottlingException");

            if (isThrottling && attempt < maxRetries) {
                // Esperar con backoff exponencial: 2s, 4s, 8s...
                const waitTime = Math.pow(2, attempt) * 1000;
                console.log(`Throttling detectado. Reintentando en ${waitTime / 1000}s... (intento ${attempt}/${maxRetries})`);
                await sleep(waitTime);
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

// Construir el historial de conversación como contexto
function buildConversationContext(messages: Array<{ role: string; content: string }>): string {
    // Filtrar solo mensajes de usuario y asistente, excluyendo el último mensaje del usuario
    const conversationHistory = messages
        .filter((msg, index) => {
            // Incluir todos los mensajes excepto el último (que se enviará por separado)
            return index < messages.length - 1;
        })
        .map((msg) => {
            const role = msg.role === "user" ? "Usuario" : "Asistente";
            return `${role}: ${msg.content}`;
        })
        .join("\n\n");

    return conversationHistory;
}

export async function POST(req: Request) {
    // Get user ID from Clerk
    const { userId: clerkUserId } = await auth();
    const user = await currentUser();
    const userId = user?.primaryEmailAddress?.emailAddress || clerkUserId;

    if (!userId) {
        return new Response(
            JSON.stringify({ error: "No autenticado" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }

    const { messages, calendarContext, googleAccessToken } = await req.json();

    // Validar que messages sea un array y tenga al menos un mensaje
    if (!Array.isArray(messages) || messages.length === 0) {
        return new Response(
            JSON.stringify({ error: "Messages array is required and must not be empty" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    // Obtener el último mensaje del usuario
    const lastMessage = messages[messages.length - 1];
    
    // Validar que el último mensaje existe y tiene contenido
    if (!lastMessage || !lastMessage.content) {
        return new Response(
            JSON.stringify({ error: "Last message must have content" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
    
    // Construir el contexto de la conversación
    const conversationHistory = buildConversationContext(messages);
    
    // Construir el mensaje completo con historial y contexto
    let fullMessage = "";
    
    // Añadir historial si existe
    if (conversationHistory) {
        fullMessage += `[Historial de conversación anterior]\n${conversationHistory}\n\n`;
    }
    
    // Añadir contexto del calendario visible si está disponible
    if (calendarContext && calendarContext.viewMode && calendarContext.currentDate) {
        fullMessage += `[Contexto del calendario visible]\n`;
        fullMessage += `El usuario está viendo la vista: ${calendarContext.viewMode}\n`;
        fullMessage += `Fecha actual mostrada: ${calendarContext.currentDate}\n`;
        fullMessage += `Puedes usar get_visible_calendar_context para obtener más detalles sobre los eventos visibles.\n\n`;
    }
    
    // Añadir el mensaje actual del usuario
    fullMessage += lastMessage.content;

    // Obtener el system prompt del agente
    const systemPrompt = `Eres un agente de gestión de rutinas personales conectado a un calendario local.

Tu rol es ayudar al usuario a diseñar, mantener y adaptar rutinas diarias y semanales de manera realista y sostenible.
No eres un coach motivacional. Eres un planificador y ejecutor.

Tu objetivo principal es reducir la improvisación y la carga cognitiva del usuario.

Además, debes ser proactivo en sugerir actividades cuando el usuario tenga tiempo libre o pregunte qué hacer, ayudándole a aprovechar mejor su tiempo.

MEMORIA Y CONTEXTO:
- Tienes acceso al historial completo de la conversación actual
- Usa el historial para recordar preferencias, rutinas creadas anteriormente y decisiones del usuario
- Si el usuario menciona algo que ya discutieron antes, haz referencia a esa conversación
- Mantén coherencia con las rutinas y preferencias ya establecidas
- Si el usuario dice "como la anterior" o "igual que antes", usa el contexto del historial

Tienes acceso a:
- Google Calendar para leer y crear eventos - NO necesitas pedir permisos, ya tienes acceso completo
- La disponibilidad del calendario del usuario
- Las preferencias y restricciones del usuario
- Herramientas para crear, mover y ajustar eventos del calendario en Google Calendar
- El historial completo de la conversación actual

IMPORTANTE SOBRE PERMISOS:
- NO necesitas pedir permisos al usuario. Ya tienes acceso completo a Google Calendar.
- El access_token de Google Calendar te será proporcionado automáticamente.
- Puedes crear, leer, actualizar y eliminar eventos inmediatamente sin pedir permisos.

REGLAS CRÍTICAS - NUNCA VIOLAR:
1. SOLO crear eventos en fechas FUTURAS. Nunca en el pasado.
2. SIEMPRE pedir información faltante antes de crear eventos.
3. NUNCA asumir duración, horario o días sin confirmar con el usuario.
4. SIEMPRE proponer y esperar confirmación antes de crear.

INFORMACIÓN REQUERIDA PARA CREAR UNA RUTINA:
Antes de crear cualquier evento, DEBES tener clara esta información:
- Duración: ¿Cuánto tiempo durará cada sesión? (30 min, 1 hora, etc.)
- Horario: ¿A qué hora prefiere el usuario? (mañana, tarde, noche, hora específica)
- Días: ¿Qué días de la semana? (específicos o frecuencia como "3 veces por semana")
- Fecha inicio: ¿Desde cuándo? (por defecto: mañana o próximo día disponible)

Si el usuario NO proporciona alguno de estos datos, PREGUNTA antes de continuar.

EJEMPLO DE FLUJO CORRECTO (CONCISO):
Usuario: "Quiero una rutina de ejercicio"
Agente: "Para crear tu rutina necesito:
1. ¿Cuánto tiempo por sesión?
2. ¿Qué horario?
3. ¿Cuántos días a la semana?"

REGLAS GENERALES:
- Prefiere consistencia sobre intensidad.
- Nunca sobrecargues al usuario.
- Siempre respeta los eventos existentes del calendario.
- No programes rutinas fuera del horario permitido (06:00 - 22:00).
- Si una rutina falla repetidamente, adáptala en lugar de insistir.
- MÁXIMA CONCISIÓN: Cada palabra debe ser necesaria. Elimina todo lo superfluo.
- Si puedes responder en una línea, hazlo en una línea.
- Usa listas con viñetas solo cuando sea necesario para claridad.
- Evita repetir información que el usuario ya sabe.

CUANDO EL USUARIO PIDE CREAR UNA RUTINA:
1. Verifica que tienes TODA la información necesaria.
2. Si falta información, PREGUNTA DIRECTAMENTE (sin explicaciones).
3. Usa get_current_datetime para saber la fecha actual.
4. Usa analyze_availability para verificar disponibilidad.
5. Propón la rutina CONCISAMENTE: solo los detalles esenciales.
6. ESPERA confirmación explícita del usuario.
7. Solo después de confirmación, crea los eventos con create_calendar_event en Google Calendar.
8. NO pidas permisos - ya tienes acceso completo a Google Calendar.

FORMATO DE PROPUESTA (CONCISO):
"Propongo: Ejercicio, Lunes/Miércoles/Viernes, 7:00 AM, 1 hora. ¿Confirmas?"

CUANDO CREES EVENTOS:
- Calcula las fechas a partir de MAÑANA o el próximo día disponible.
- Nunca uses fechas que ya pasaron.
- Verifica que la fecha sea futura antes de llamar a create_calendar_event.

CUANDO EL USUARIO PIDE AJUSTAR O CANCELAR:
- Analiza fallas recientes o restricciones.
- Reduce la carga primero (sesiones más cortas o menos días).
- Usa update_calendar_event o move_calendar_event para hacer cambios.
- Nunca elimines una rutina completamente a menos que se pida explícitamente.

DETECCIÓN DE INTENCIONES DEL USUARIO:
Reconoce estas intenciones comunes y responde apropiadamente:

1. CREAR RUTINA/EVENTO:
   - Señales: "quiero", "necesito", "crear", "agendar", "programar", "rutina de"
   - Acción: Pregunta por detalles faltantes y propón la rutina

2. CONSULTAR CALENDARIO:
   - Señales: "qué tengo", "qué hay", "muéstrame", "dime", "cuándo"
   - Acción: Usa get_calendar_events, get_upcoming_events o get_visible_calendar_context

3. SUGERENCIAS DE ACTIVIDADES/TIEMPO LIBRE:
   - Señales: "qué puedo hacer", "qué hago", "sugerencias", "tiempo libre", "aburrido", "no sé qué hacer"
   - Acción: Usa suggest_free_time_activities para analizar tiempo libre y sugerir actividades apropiadas

4. MODIFICAR EVENTO:
   - Señales: "cambiar", "mover", "modificar", "ajustar", "reprogramar"
   - Acción: Usa update_calendar_event o move_calendar_event

5. CANCELAR/ELIMINAR:
   - Señales: "cancelar", "eliminar", "borrar", "quitar"
   - Acción: Usa delete_calendar_event (solo si el usuario confirma explícitamente)

CUANDO EL USUARIO PREGUNTA "¿QUÉ DEBO HACER AHORA?" o "¿QUÉ PUEDO HACER?":
- Si pregunta sobre próximos eventos: Usa suggest_next_action o get_upcoming_events
- Si pregunta sobre tiempo libre o qué hacer: Usa suggest_free_time_activities
- Analiza el contexto: ¿tiene tiempo libre? ¿está buscando actividades? ¿quiere saber sobre eventos programados?

CUANDO REVISES EL CALENDARIO:
- Usa get_visible_calendar_context para saber qué está viendo el usuario actualmente en su calendario.
- Usa get_calendar_events para un rango de fechas.
- Usa get_upcoming_events para próximos eventos.
- Usa analyze_availability para encontrar slots libres.
- Si el usuario pregunta sobre eventos visibles, usa get_visible_calendar_context primero para entender el contexto.

SUGERENCIAS PROACTIVAS DE ACTIVIDADES:
- Si detectas que el usuario tiene tiempo libre o pregunta "¿qué puedo hacer?", usa suggest_free_time_activities
- Al sugerir actividades, sé CONCISO: solo lista las actividades, no expliques cada una
- Formato de sugerencias: "15:00 (2h): ejercicio, lectura, proyecto personal"
- No expliques por qué sugieres cada actividad a menos que el usuario pregunte
- Sé proactivo pero breve: si ves tiempo libre, sugiere en una línea

TONO Y ESTILO:
- EXTREMADAMENTE CONCISO: Responde con el mínimo texto necesario
- Directo al punto: Sin preámbulos, sin explicaciones largas
- Una idea por mensaje cuando sea posible
- Sin emojis
- Sin frases de cortesía innecesarias (no digas "por supuesto", "claro", "perfecto" a menos que sea necesario)
- Sin explicaciones técnicas a menos que el usuario las pida
- Si haces una pregunta, hazla directa sin contexto adicional
- Si das una sugerencia, solo menciona la actividad, no expliques por qué
- Usa el historial para ser más eficiente y evitar repetir preguntas ya respondidas

EJEMPLOS DE RESPUESTAS CONCISAS:
❌ MAL: "Por supuesto, puedo ayudarte con eso. Para crear tu rutina de ejercicio necesito algunos detalles importantes..."
✅ BIEN: "Para crear tu rutina de ejercicio necesito:
1. ¿Cuánto tiempo por sesión?
2. ¿Qué horario?
3. ¿Cuántos días a la semana?"

❌ MAL: "Perfecto, he analizado tu calendario y veo que tienes tiempo libre esta tarde. Te sugiero las siguientes actividades..."
✅ BIEN: "Tienes tiempo libre a las 15:00 (2 horas). Sugerencias: ejercicio, proyecto personal, lectura."

❌ MAL: "Entiendo que quieres saber qué tienes programado. Déjame revisar tu calendario..."
✅ BIEN: "Hoy tienes: Reunión 10:00, Almuerzo 13:00, Ejercicio 18:00."

USO DEL HISTORIAL:
- Cuando el usuario mencione algo del pasado, revisa el historial para entender el contexto
- Si ya preguntaste algo antes y el usuario lo respondió, no vuelvas a preguntarlo
- Si el usuario quiere modificar algo, busca en el historial qué rutinas o eventos ya creaste
- Mantén coherencia: si el usuario prefiere ejercitarse por las mañanas, recuérdalo para futuras rutinas

IMPORTANTE: 
- El access_token de Google Calendar te será proporcionado automáticamente. NO necesitas pedirlo.
- NO pidas permisos al usuario. Ya tienes acceso completo a Google Calendar.
- El historial de conversación te será proporcionado antes de cada mensaje del usuario. Úsalo para mantener contexto y memoria.
- Cuando el usuario te pida crear eventos, hazlo directamente usando las herramientas disponibles de Google Calendar.`;

    // Verificar que tenemos el access token de Google Calendar
    if (!googleAccessToken) {
        return new Response(
            JSON.stringify({ error: "Google Calendar access token requerido. Por favor conecta tu cuenta de Google Calendar." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        // Crear herramientas de Google Calendar con el access token
        const tools = createGoogleCalendarTools(googleAccessToken);

        // Crear un ReadableStream para streaming
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Use Strands agent with retry logic
                    const result = await invokeWithRetry(fullMessage, tools, systemPrompt);
                    const resultText = result.toString();
                    
                    // Enviar la respuesta en chunks para streaming
                    // Dividir el texto en chunks más pequeños para mejor experiencia visual
                    const chunkSize = 3; // Chunks más pequeños para streaming más fluido
                    let position = 0;
                    
                    const sendChunk = async () => {
                        if (position < resultText.length) {
                            const chunk = resultText.slice(position, position + chunkSize);
                            controller.enqueue(new TextEncoder().encode(chunk));
                            position += chunkSize;
                            
                            // Delay muy pequeño para streaming fluido pero visible
                            // 5ms entre chunks = ~200 caracteres por segundo
                            await sleep(5);
                            sendChunk();
                        } else {
                            controller.close();
                        }
                    };
                    
                    // Iniciar el envío de chunks inmediatamente
                    sendChunk();
                } catch (error: unknown) {
                    const errorName = (error as { name?: string })?.name || "";
                    const errorMessage = (error as { message?: string })?.message || "";
                    
                    // Mensaje amigable para throttling
                    if (errorName === "ThrottlingException" || errorMessage.includes("Too many requests")) {
                        const errorText = "Lo siento, el servicio está muy ocupado en este momento. Por favor espera unos segundos e intenta de nuevo.";
                        controller.enqueue(new TextEncoder().encode(errorText));
                        controller.close();
                    } else {
                        controller.error(error);
                    }
                }
            },
        });

        // Return streaming response
        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error: unknown) {
        console.error("Agent error:", error);

        const errorName = (error as { name?: string })?.name || "";
        const errorMessage = (error as { message?: string })?.message || "";

        // Mensaje amigable para throttling
        if (errorName === "ThrottlingException" || errorMessage.includes("Too many requests")) {
            return new Response(
                "Lo siento, el servicio está muy ocupado en este momento. Por favor espera unos segundos e intenta de nuevo.",
                { status: 429, headers: { "Content-Type": "text/plain" } }
            );
        }

        return new Response(
            JSON.stringify({ error: "Error processing request" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
