import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Proxy para llamadas a Google Calendar API usando el token del usuario
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json(
                { error: "No authenticated" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action, params } = body;

        const calendarApiBase = "https://www.googleapis.com/calendar/v3";

        let response: Response;

        switch (action) {
            case "list_events": {
                const queryParams = new URLSearchParams({
                    timeMin: params.timeMin || new Date().toISOString(),
                    timeMax: params.timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    maxResults: params.maxResults || "50",
                    singleEvents: "true",
                    orderBy: "startTime",
                });

                response = await fetch(
                    `${calendarApiBase}/calendars/primary/events?${queryParams}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    }
                );
                break;
            }

            case "create_event": {
                response = await fetch(
                    `${calendarApiBase}/calendars/primary/events`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(params.event),
                    }
                );
                break;
            }

            case "update_event": {
                response = await fetch(
                    `${calendarApiBase}/calendars/primary/events/${params.eventId}`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(params.event),
                    }
                );
                break;
            }

            case "delete_event": {
                response = await fetch(
                    `${calendarApiBase}/calendars/primary/events/${params.eventId}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    }
                );

                if (response.ok) {
                    return NextResponse.json({ success: true });
                }
                break;
            }

            case "get_event": {
                response = await fetch(
                    `${calendarApiBase}/calendars/primary/events/${params.eventId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    }
                );
                break;
            }

            case "freebusy": {
                response = await fetch(
                    `${calendarApiBase}/freeBusy`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            timeMin: params.timeMin,
                            timeMax: params.timeMax,
                            items: [{ id: "primary" }],
                        }),
                    }
                );
                break;
            }

            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: "Google Calendar API error", details: errorData },
                { status: response.status }
            );
        }

        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data);
    } catch (error) {
        console.error("Calendar proxy error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET para verificar estado de autenticación
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({
            authenticated: false,
            message: "Please sign in with Google to access calendar features",
        });
    }

    return NextResponse.json({
        authenticated: true,
        user: {
            name: session.user?.name,
            email: session.user?.email,
        },
    });
}
