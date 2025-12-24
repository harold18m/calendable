import { routineAgent } from "@/agent/agent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const maxDuration = 60;

export async function POST(req: Request) {
    // Get session to extract access token
    const session = await getServerSession(authOptions);
    const accessToken = (session as { accessToken?: string })?.accessToken;

    const { messages } = await req.json();

    // Build conversation with context including access token
    const lastMessage = messages[messages.length - 1];
    const userMessage = accessToken
        ? `[Context: access_token=${accessToken}]\n\n${lastMessage.content}`
        : lastMessage.content;

    try {
        // Use Strands agent
        const result = await routineAgent.invoke(userMessage);

        // Return response as text using toString()
        return new Response(result.toString(), {
            headers: { "Content-Type": "text/plain" },
        });
    } catch (error) {
        console.error("Agent error:", error);
        return new Response(
            JSON.stringify({ error: "Error processing request" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
