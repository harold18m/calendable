import { FunctionTool } from "@strands-agents/sdk";

const CAL_COM_API_URL = process.env.CAL_COM_API_URL || "https://api.cal.com/v2";
const CAL_COM_API_KEY = process.env.CAL_COM_API_KEY;

if (!CAL_COM_API_KEY) {
    console.warn("⚠️  CAL_COM_API_KEY no está configurada. Las herramientas de Cal.com no funcionarán.");
}

// Helper para hacer requests a Cal.com API
async function calComRequest(endpoint: string, options: RequestInit = {}) {
    if (!CAL_COM_API_KEY) {
        throw new Error("CAL_COM_API_KEY no está configurada");
    }

    const response = await fetch(`${CAL_COM_API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Authorization": `Bearer ${CAL_COM_API_KEY}`,
            "cal-api-version": "2024-08-13",
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Cal.com API error: ${errorData.message || response.statusText}`);
    }

    return response.json();
}

// Get current date/time
export const getCurrentDateTime = new FunctionTool({
    name: "get_current_datetime",
    description: "Get the current date and time",
    callback: () => {
        const now = new Date();
        return JSON.stringify({
            datetime: now.toISOString(),
            date: now.toISOString().split("T")[0],
            time: now.toTimeString().slice(0, 5),
            day_of_week: now.toLocaleDateString("es-ES", { weekday: "long" }),
        });
    },
});

// Get calendar events from Cal.com
export const getCalendarEvents = new FunctionTool({
    name: "get_calendar_events",
    description: "Get calendar events (bookings) from Cal.com for a date range",
    inputSchema: {
        type: "object",
        properties: {
            start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
            end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
        },
        required: ["start_date", "end_date"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const startDate = new Date(input.start_date);
            const endDate = new Date(input.end_date);
            endDate.setHours(23, 59, 59, 999);

            // Cal.com API para obtener bookings
            const response = await calComRequest(
                `/bookings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
            );

            const bookings = response.bookings || [];
            const formattedEvents = bookings.map((booking: any) => ({
                id: booking.id?.toString() || booking.uid,
                title: booking.title || booking.eventType?.title || "Sin título",
                start_time: booking.startTime,
                end_time: booking.endTime,
                description: booking.description || "",
                location: booking.location || "",
                attendees: booking.attendees || [],
            }));

            return JSON.stringify({ events: formattedEvents, count: formattedEvents.length });
        } catch (error) {
            return JSON.stringify({ error: `Error al obtener eventos: ${error}` });
        }
    },
});

// Create calendar event (booking) in Cal.com
export const createCalendarEvent = new FunctionTool({
    name: "create_calendar_event",
    description: "Create a new event (booking) in Cal.com. IMPORTANT: Only creates events in FUTURE dates. Will reject past dates. NO necesitas permisos - ya tienes acceso completo.",
    inputSchema: {
        type: "object",
        properties: {
            title: { type: "string", description: "Event title" },
            start_time: { type: "string", description: "Start time in ISO format (YYYY-MM-DDTHH:MM:SS). Must be a FUTURE date." },
            end_time: { type: "string", description: "End time in ISO format (YYYY-MM-DDTHH:MM:SS)" },
            description: { type: "string", description: "Event description" },
            location: { type: "string", description: "Event location" },
            event_type_id: { type: "number", description: "Cal.com event type ID (optional, will use default if not provided)" },
            attendee_email: { type: "string", description: "Attendee email (optional)" },
            attendee_name: { type: "string", description: "Attendee name (optional)" },
        },
        required: ["title", "start_time", "end_time"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            // Validar que la fecha sea futura
            const startDate = new Date(input.start_time);
            const now = new Date();

            if (startDate < now) {
                return JSON.stringify({
                    error: "No se pueden crear eventos en fechas pasadas. Por favor usa una fecha futura.",
                    provided_date: input.start_time,
                    current_date: now.toISOString(),
                });
            }

            // Primero, obtener o crear un event type si no se proporciona
            let eventTypeId = input.event_type_id;

            if (!eventTypeId) {
                // Intentar obtener el primer event type disponible
                try {
                    const eventTypesResponse = await calComRequest("/event-types");
                    const eventTypes = eventTypesResponse.eventTypes || eventTypesResponse.data || [];
                    if (eventTypes.length > 0) {
                        eventTypeId = eventTypes[0].id;
                    } else {
                        // Crear un event type por defecto si no existe ninguno
                        const newEventType = await calComRequest("/event-types", {
                            method: "POST",
                            body: JSON.stringify({
                                title: "Personal Event",
                                slug: "personal-event",
                                lengthInMinutes: Math.round((new Date(input.end_time).getTime() - startDate.getTime()) / 60000),
                                description: "Evento personal creado por el agente",
                            }),
                        });
                        eventTypeId = newEventType.eventType?.id || newEventType.id;
                    }
                } catch (error) {
                    return JSON.stringify({ error: `Error al obtener/crear event type: ${error}` });
                }
            }

            // Crear el booking
            const bookingData: any = {
                start: input.start_time,
                eventTypeId: eventTypeId,
            };

            if (input.attendee_email) {
                bookingData.attendee = {
                    email: input.attendee_email,
                    name: input.attendee_name || input.attendee_email.split("@")[0],
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                };
            }

            if (input.description) {
                bookingData.bookingFieldsResponses = {
                    notes: input.description,
                };
            }

            if (input.location) {
                bookingData.location = input.location;
            }

            const booking = await calComRequest("/bookings", {
                method: "POST",
                body: JSON.stringify(bookingData),
            });

            return JSON.stringify({
                success: true,
                event_id: booking.booking?.id?.toString() || booking.id?.toString() || booking.uid,
                title: input.title,
                start: input.start_time,
                end: input.end_time,
            });
        } catch (error: any) {
            return JSON.stringify({ error: `Error al crear evento: ${error.message || error}` });
        }
    },
});

// Update calendar event (booking) in Cal.com
export const updateCalendarEvent = new FunctionTool({
    name: "update_calendar_event",
    description: "Update an existing event (booking) in Cal.com",
    inputSchema: {
        type: "object",
        properties: {
            event_id: { type: "string", description: "Event/Booking ID to update" },
            title: { type: "string", description: "New event title" },
            start_time: { type: "string", description: "New start time in ISO format" },
            end_time: { type: "string", description: "New end time in ISO format" },
            description: { type: "string", description: "New event description" },
            location: { type: "string", description: "New event location" },
        },
        required: ["event_id"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const updateData: any = {};

            if (input.start_time) updateData.start = input.start_time;
            if (input.end_time) updateData.end = input.end_time;
            if (input.description) updateData.bookingFieldsResponses = { notes: input.description };
            if (input.location) updateData.location = input.location;

            await calComRequest(`/bookings/${input.event_id}`, {
                method: "PATCH",
                body: JSON.stringify(updateData),
            });

            return JSON.stringify({ success: true, event_id: input.event_id });
        } catch (error: any) {
            return JSON.stringify({ error: `Error al actualizar evento: ${error.message || error}` });
        }
    },
});

// Delete calendar event (booking) from Cal.com
export const deleteCalendarEvent = new FunctionTool({
    name: "delete_calendar_event",
    description: "Delete an event (booking) from Cal.com",
    inputSchema: {
        type: "object",
        properties: {
            event_id: { type: "string", description: "Event/Booking ID to delete" },
        },
        required: ["event_id"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            await calComRequest(`/bookings/${input.event_id}`, {
                method: "DELETE",
            });

            return JSON.stringify({ success: true, event_id: input.event_id });
        } catch (error: any) {
            return JSON.stringify({ error: `Error al eliminar evento: ${error.message || error}` });
        }
    },
});

// Move calendar event (booking) in Cal.com
export const moveCalendarEvent = new FunctionTool({
    name: "move_calendar_event",
    description: "Move an event (booking) to a new date/time in Cal.com",
    inputSchema: {
        type: "object",
        properties: {
            event_id: { type: "string", description: "Event/Booking ID to move" },
            new_start_time: { type: "string", description: "New start time in ISO format" },
            new_end_time: { type: "string", description: "New end time in ISO format" },
        },
        required: ["event_id", "new_start_time", "new_end_time"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            await calComRequest(`/bookings/${input.event_id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    start: input.new_start_time,
                    end: input.new_end_time,
                }),
            });

            return JSON.stringify({ success: true, event_id: input.event_id });
        } catch (error: any) {
            return JSON.stringify({ error: `Error al mover evento: ${error.message || error}` });
        }
    },
});

// Get upcoming events from Cal.com
export const getUpcomingEvents = new FunctionTool({
    name: "get_upcoming_events",
    description: "Get upcoming events (bookings) from Cal.com",
    inputSchema: {
        type: "object",
        properties: {
            limit: { type: "number", description: "Maximum number of events to return" },
        },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const limit = input.limit || 10;
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30); // Próximos 30 días

            const response = await calComRequest(
                `/bookings?startDate=${now.toISOString()}&endDate=${futureDate.toISOString()}`
            );

            const bookings = (response.bookings || []).slice(0, limit);
            const formattedEvents = bookings.map((booking: any) => ({
                id: booking.id?.toString() || booking.uid,
                title: booking.title || booking.eventType?.title || "Sin título",
                start_time: booking.startTime,
                end_time: booking.endTime,
                description: booking.description || "",
            }));

            return JSON.stringify({ events: formattedEvents, count: formattedEvents.length });
        } catch (error: any) {
            return JSON.stringify({ error: `Error al obtener eventos: ${error.message || error}` });
        }
    },
});

// Analyze availability using Cal.com
export const analyzeAvailability = new FunctionTool({
    name: "analyze_availability",
    description: "Analyze available time slots for a specific date using Cal.com",
    inputSchema: {
        type: "object",
        properties: {
            date: { type: "string", description: "Date to analyze in YYYY-MM-DD format" },
            duration_minutes: { type: "number", description: "Required duration in minutes" },
        },
        required: ["date", "duration_minutes"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const targetDate = new Date(input.date);
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(6, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(22, 0, 0, 0);

            // Obtener eventos del día
            const response = await calComRequest(
                `/bookings?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`
            );

            const bookings = response.bookings || [];
            const busySlots: Array<{ start: Date; end: Date }> = bookings.map((booking: any) => ({
                start: new Date(booking.startTime),
                end: new Date(booking.endTime),
            }));

            const availableSlots: Array<{ start: string; end: string; duration_minutes: number }> = [];
            const durationMs = input.duration_minutes * 60 * 1000;
            let currentTime = new Date(startOfDay);

            while (currentTime < endOfDay) {
                const slotEnd = new Date(currentTime.getTime() + durationMs);
                if (slotEnd > endOfDay) break;

                const isBusy = busySlots.some(
                    (busy) =>
                        (currentTime >= busy.start && currentTime < busy.end) ||
                        (slotEnd > busy.start && slotEnd <= busy.end) ||
                        (currentTime <= busy.start && slotEnd >= busy.end)
                );

                if (!isBusy) {
                    availableSlots.push({
                        start: currentTime.toISOString(),
                        end: slotEnd.toISOString(),
                        duration_minutes: input.duration_minutes,
                    });
                }

                currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
            }

            return JSON.stringify({
                date: input.date,
                available_slots: availableSlots,
                count: availableSlots.length,
            });
        } catch (error: any) {
            return JSON.stringify({ error: `Error al analizar disponibilidad: ${error.message || error}` });
        }
    },
});

// Get visible calendar context from Cal.com
export const getVisibleCalendarContext = new FunctionTool({
    name: "get_visible_calendar_context",
    description: "Get information about what calendar view the user is currently viewing (day/week/month) and the date range being displayed. Use this to understand what the user sees on their screen.",
    inputSchema: {
        type: "object",
        properties: {
            view_mode: {
                type: "string",
                enum: ["DAY", "WEEK", "MONTH"],
                description: "Current view mode (DAY, WEEK, or MONTH)",
            },
            current_date: {
                type: "string",
                description: "Current date being viewed in YYYY-MM-DD format",
            },
        },
        required: ["view_mode", "current_date"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const currentDate = new Date(input.current_date);
            let startDate: Date;
            let endDate: Date;

            if (input.view_mode === "DAY") {
                startDate = new Date(currentDate);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(currentDate);
                endDate.setHours(23, 59, 59, 999);
            } else if (input.view_mode === "WEEK") {
                const dayOfWeek = currentDate.getDay();
                const diff = currentDate.getDate() - dayOfWeek;
                startDate = new Date(currentDate);
                startDate.setDate(diff);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
            } else {
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
            }

            const response = await calComRequest(
                `/bookings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
            );

            const bookings = response.bookings || [];
            const formattedEvents = bookings.map((booking: any) => ({
                id: booking.id?.toString() || booking.uid,
                title: booking.title || booking.eventType?.title || "Sin título",
                start: booking.startTime,
                end: booking.endTime,
                description: booking.description || "",
            }));

            return JSON.stringify({
                view_mode: input.view_mode,
                current_date: input.current_date,
                date_range: {
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                },
                events: formattedEvents,
                count: formattedEvents.length,
            });
        } catch (error: any) {
            return JSON.stringify({ error: `Error al obtener contexto del calendario: ${error.message || error}` });
        }
    },
});

// Suggest free time activities using Cal.com
export const suggestFreeTimeActivities = new FunctionTool({
    name: "suggest_free_time_activities",
    description: "Analyze free time slots in Cal.com calendar and suggest appropriate activities based on available time, time of day, and user preferences. Use this when the user asks what to do, has free time, or wants suggestions.",
    inputSchema: {
        type: "object",
        properties: {
            date: { type: "string", description: "Date to analyze in YYYY-MM-DD format" },
            duration_minutes: { type: "number", description: "Preferred duration in minutes" },
        },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const targetDate = input.date ? new Date(input.date) : new Date();
            const duration = input.duration_minutes || 60;

            const startOfDay = new Date(targetDate);
            startOfDay.setHours(6, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(22, 0, 0, 0);

            const response = await calComRequest(
                `/bookings?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`
            );

            const bookings = response.bookings || [];
            const busySlots: Array<{ start: Date; end: Date }> = bookings.map((booking: any) => ({
                start: new Date(booking.startTime),
                end: new Date(booking.endTime),
            }));

            const freeSlots: Array<{ start: string; end: string; duration_minutes: number }> = [];
            const durationMs = duration * 60 * 1000;
            let currentTime = new Date(startOfDay);

            while (currentTime < endOfDay) {
                const slotEnd = new Date(currentTime.getTime() + durationMs);
                if (slotEnd > endOfDay) break;

                const isBusy = busySlots.some(
                    (busy) =>
                        (currentTime >= busy.start && currentTime < busy.end) ||
                        (slotEnd > busy.start && slotEnd <= busy.end) ||
                        (currentTime <= busy.start && slotEnd >= busy.end)
                );

                if (!isBusy) {
                    freeSlots.push({
                        start: currentTime.toISOString(),
                        end: slotEnd.toISOString(),
                        duration_minutes: duration,
                    });
                }

                currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
            }

            const hour = new Date().getHours();
            let activitySuggestions: string[] = [];

            if (hour >= 6 && hour < 12) {
                activitySuggestions = ["ejercicio", "meditación", "lectura", "trabajo personal"];
            } else if (hour >= 12 && hour < 18) {
                activitySuggestions = ["almuerzo", "reunión", "proyecto", "estudio"];
            } else {
                activitySuggestions = ["cena", "relajación", "hobby", "tiempo personal"];
            }

            return JSON.stringify({
                date: targetDate.toISOString().split("T")[0],
                free_slots: freeSlots.slice(0, 5),
                suggested_activities: activitySuggestions,
                total_free_slots: freeSlots.length,
            });
        } catch (error: any) {
            return JSON.stringify({ error: `Error al sugerir actividades: ${error.message || error}` });
        }
    },
});

// Export all Cal.com tools
export const calComTools = [
    getCurrentDateTime,
    getCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    moveCalendarEvent,
    getUpcomingEvents,
    analyzeAvailability,
    getVisibleCalendarContext,
    suggestFreeTimeActivities,
];
