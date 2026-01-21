import { routineAgent } from "@/agent/agent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const maxDuration = 60;

// Helper para esperar
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Función para invocar al agente con reintentos
async function invokeWithRetry(message: string, maxRetries = 3): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await routineAgent.invoke(message);
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
    // Get session to extract access token
    const session = await getServerSession(authOptions);
    const accessToken = (session as { accessToken?: string })?.accessToken;

    const { messages, calendarContext } = await req.json();

    // Obtener el último mensaje del usuario
    const lastMessage = messages[messages.length - 1];
    
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
    
    // Añadir contexto del access token
    if (accessToken) {
        fullMessage += `[Context: access_token=${accessToken}]\n\n`;
    }
    
    // Añadir el mensaje actual del usuario
    fullMessage += lastMessage.content;

    try {
        // Use Strands agent with retry logic
        const result = await invokeWithRetry(fullMessage);

        // Return response as text
        return new Response(result, {
            headers: { "Content-Type": "text/plain" },
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
