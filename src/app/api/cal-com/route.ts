import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const CAL_COM_API_URL = process.env.CAL_COM_API_URL || "https://api.cal.com/v2";
const CAL_COM_API_KEY = process.env.CAL_COM_API_KEY;

if (!CAL_COM_API_KEY) {
    console.warn("⚠️  CAL_COM_API_KEY no está configurada.");
}

// GET - Obtener bookings de Cal.com
export async function GET(request: NextRequest) {
    try {
        // Verificar autenticación
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        if (!CAL_COM_API_KEY) {
            return NextResponse.json(
                { error: "CAL_COM_API_KEY no está configurada" },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("start_date");
        const endDate = searchParams.get("end_date");
        const action = searchParams.get("action");

        if (action === "upcoming") {
            const limit = parseInt(searchParams.get("limit") || "10");
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);

            const response = await fetch(
                `${CAL_COM_API_URL}/bookings?startDate=${now.toISOString()}&endDate=${futureDate.toISOString()}&limit=${limit}`,
                {
                    headers: {
                        "Authorization": `Bearer ${CAL_COM_API_KEY}`,
                        "cal-api-version": "2024-08-13",
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                return NextResponse.json(
                    { error: `Cal.com API error: ${errorData.message || response.statusText}` },
                    { status: response.status }
                );
            }

            const data = await response.json();
            const bookings = (data.bookings || []).slice(0, limit);
            const events = bookings.map((booking: any) => ({
                id: booking.id?.toString() || booking.uid,
                title: booking.title || booking.eventType?.title || "Sin título",
                start: booking.startTime,
                end: booking.endTime,
                description: booking.description || "",
                location: booking.location || "",
            }));

            return NextResponse.json({ events, count: events.length });
        }

        // List bookings (default action)
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            // Asegurar que endDate incluya todo el día
            end.setHours(23, 59, 59, 999);
            
            const response = await fetch(
                `${CAL_COM_API_URL}/bookings?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
                {
                    headers: {
                        "Authorization": `Bearer ${CAL_COM_API_KEY}`,
                        "cal-api-version": "2024-08-13",
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                return NextResponse.json(
                    { error: `Cal.com API error: ${errorData.message || response.statusText}` },
                    { status: response.status }
                );
            }

            const data = await response.json();
            const bookings = data.bookings || [];
            const events = bookings.map((booking: any) => ({
                id: booking.id?.toString() || booking.uid,
                title: booking.title || booking.eventType?.title || "Sin título",
                start: booking.startTime,
                end: booking.endTime,
                description: booking.description || "",
                location: booking.location || "",
            }));

            return NextResponse.json({ events, count: events.length });
        }

        return NextResponse.json({ error: "start_date y end_date son requeridos" }, { status: 400 });
    } catch (error) {
        console.error("Error en GET /api/cal-com:", error);
        return NextResponse.json(
            { error: "Error al obtener eventos de Cal.com" },
            { status: 500 }
        );
    }
}

// POST - Crear booking en Cal.com
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        if (!CAL_COM_API_KEY) {
            return NextResponse.json(
                { error: "CAL_COM_API_KEY no está configurada" },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { title, start, end, description, location, event_type_id, attendee_email, attendee_name } = body;

        if (!start || !end) {
            return NextResponse.json(
                { error: "start y end son requeridos" },
                { status: 400 }
            );
        }

        // Validar que la fecha sea futura
        const startDate = new Date(start);
        const now = new Date();
        if (startDate < now) {
            return NextResponse.json(
                {
                    error: "No se pueden crear eventos en fechas pasadas",
                    provided_date: start,
                    current_date: now.toISOString(),
                },
                { status: 400 }
            );
        }

        let eventTypeId = event_type_id;

        // Si no hay event_type_id, obtener o crear uno
        if (!eventTypeId) {
            try {
                const eventTypesResponse = await fetch(`${CAL_COM_API_URL}/event-types`, {
                    headers: {
                        "Authorization": `Bearer ${CAL_COM_API_KEY}`,
                        "cal-api-version": "2024-06-14",
                        "Content-Type": "application/json",
                    },
                });

                if (eventTypesResponse.ok) {
                    const eventTypesData = await eventTypesResponse.json();
                    const eventTypes = eventTypesData.eventTypes || eventTypesData.data || [];
                    if (eventTypes.length > 0) {
                        eventTypeId = eventTypes[0].id;
                    } else {
                        // Crear un event type por defecto
                        const lengthInMinutes = Math.round((new Date(end).getTime() - startDate.getTime()) / 60000);
                        const newEventTypeResponse = await fetch(`${CAL_COM_API_URL}/event-types`, {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${CAL_COM_API_KEY}`,
                                "cal-api-version": "2024-06-14",
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                title: "Personal Event",
                                slug: "personal-event",
                                lengthInMinutes,
                                description: "Evento personal creado por el agente",
                            }),
                        });

                        if (newEventTypeResponse.ok) {
                            const newEventTypeData = await newEventTypeResponse.json();
                            eventTypeId = newEventTypeData.eventType?.id || newEventTypeData.id;
                        }
                    }
                }
            } catch (error) {
                console.error("Error al obtener/crear event type:", error);
            }
        }

        if (!eventTypeId) {
            return NextResponse.json(
                { error: "No se pudo obtener o crear un event type" },
                { status: 500 }
            );
        }

        const bookingData: any = {
            start,
            eventTypeId: eventTypeId,
        };

        if (attendee_email) {
            bookingData.attendee = {
                email: attendee_email,
                name: attendee_name || attendee_email.split("@")[0],
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };
        }

        if (description) {
            bookingData.bookingFieldsResponses = {
                notes: description,
            };
        }

        if (location) {
            bookingData.location = location;
        }

        const response = await fetch(`${CAL_COM_API_URL}/bookings`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CAL_COM_API_KEY}`,
                "cal-api-version": "2024-08-13",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bookingData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            return NextResponse.json(
                { error: `Cal.com API error: ${errorData.message || response.statusText}` },
                { status: response.status }
            );
        }

        const booking = await response.json();

        return NextResponse.json({
            success: true,
            event_id: booking.booking?.id?.toString() || booking.id?.toString() || booking.uid,
            event: {
                id: booking.booking?.id?.toString() || booking.id?.toString() || booking.uid,
                title: title || booking.title || "Sin título",
                start: booking.startTime || start,
                end: booking.endTime || end,
                description: description || booking.description || "",
                location: location || booking.location || "",
            },
        });
    } catch (error) {
        console.error("Error en POST /api/cal-com:", error);
        return NextResponse.json(
            { error: "Error al crear evento en Cal.com" },
            { status: 500 }
        );
    }
}
