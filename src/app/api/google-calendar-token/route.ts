import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Esta ruta obtiene el access token de Google Calendar almacenado en el cliente
// El cliente debe enviar el token en el header o body
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        // El token debe venir del cliente (almacenado en localStorage después de OAuth)
        const { searchParams } = new URL(request.url);
        const accessToken = searchParams.get("token");

        if (!accessToken) {
            return NextResponse.json(
                { error: "Access token no proporcionado" },
                { status: 400 }
            );
        }

        // Verificar que el token sea válido haciendo una llamada simple a Google Calendar
        try {
            const response = await fetch(
                "https://www.googleapis.com/calendar/v3/users/me/calendarList",
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                return NextResponse.json(
                    { error: "Token inválido o expirado", valid: false },
                    { status: 401 }
                );
            }

            return NextResponse.json({ valid: true });
        } catch (error) {
            return NextResponse.json(
                { error: "Error al validar token", valid: false },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error en GET /api/google-calendar-token:", error);
        return NextResponse.json(
            { error: "Error al procesar solicitud" },
            { status: 500 }
        );
    }
}
