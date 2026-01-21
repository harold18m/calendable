import { FunctionTool } from "@strands-agents/sdk";
import {
    loadEvents,
    saveEvent,
    getEvent,
    deleteEvent,
    getEventsInRange,
    getUpcomingEvents,
    type CalendarEvent,
} from "@/lib/event-storage";

// Factory function para crear herramientas de calendario local con userId
export function createLocalCalendarTools(userId: string) {
    function getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    // Get current date/time
    const getCurrentDateTime = new FunctionTool({
        name: "get_current_datetime",
        description: "Get the current date and time",
        callback: () => {
            const now = new Date();
            return JSON.stringify({
                datetime: now.toISOString(),
                date: now.toISOString().split("T")[0],
                time: now.toTimeString().slice(0, 5),
                day_of_week: now.toLocaleDateString("es-ES", { weekday: "long" }),
                week_number: getWeekNumber(now),
            });
        },
    });

    // Get calendar events (local) - usando event-storage directamente
    const getCalendarEvents = new FunctionTool({
        name: "get_calendar_events",
        description: "Get calendar events from local calendar for a date range",
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
                const events = getEventsInRange(
                    userId,
                    new Date(input.start_date),
                    new Date(input.end_date)
                );

                const formattedEvents = events.map((event) => ({
                    id: event.id,
                    title: event.title,
                    start_time: event.start,
                    end_time: event.end,
                    description: event.description || "",
                    recurring: event.recurring || false,
                    location: event.location || "",
                }));

                return JSON.stringify({ events: formattedEvents, count: formattedEvents.length });
            } catch (error) {
                return JSON.stringify({ error: `Error al obtener eventos: ${error}` });
            }
        },
    });

    // Create calendar event (local) - usando event-storage directamente
    const createCalendarEvent = new FunctionTool({
        name: "create_calendar_event",
        description: "Create a new event in local calendar. IMPORTANT: Only creates events in FUTURE dates. Will reject past dates. NO necesitas permisos - ya tienes acceso completo.",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Event title" },
                start_time: { type: "string", description: "Start time in ISO format (YYYY-MM-DDTHH:MM:SS). Must be a FUTURE date." },
                end_time: { type: "string", description: "End time in ISO format (YYYY-MM-DDTHH:MM:SS)" },
                description: { type: "string", description: "Event description" },
                recurring: { type: "boolean", description: "Whether this is a recurring event" },
                recurrence_days: {
                    type: "array",
                    items: { type: "string" },
                    description: "Days for weekly recurrence (MO, TU, WE, TH, FR, SA, SU)"
                },
                location: { type: "string", description: "Event location" },
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

                const event: CalendarEvent = {
                    id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    userId,
                    title: input.title,
                    description: input.description || "",
                    start: input.start_time,
                    end: input.end_time,
                    timezone: "America/Lima",
                    recurring: input.recurring || false,
                    recurrenceRule: input.recurring && input.recurrence_days && input.recurrence_days.length > 0
                        ? `RRULE:FREQ=WEEKLY;BYDAY=${input.recurrence_days.join(",")}`
                        : undefined,
                    location: input.location || "",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                saveEvent(userId, event);

                return JSON.stringify({
                    success: true,
                    event_id: event.id,
                    title: input.title,
                    start: input.start_time,
                    end: input.end_time,
                });
            } catch (error) {
                return JSON.stringify({ error: `Error al crear evento: ${error}` });
            }
        },
    });

    // Update calendar event (local)
    const updateCalendarEvent = new FunctionTool({
        name: "update_calendar_event",
        description: "Update an existing event in local calendar",
        inputSchema: {
            type: "object",
            properties: {
                event_id: { type: "string", description: "Event ID to update" },
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
                const existingEvent = getEvent(userId, input.event_id);
                if (!existingEvent) {
                    return JSON.stringify({ error: "Evento no encontrado" });
                }

                const updatedEvent: CalendarEvent = {
                    ...existingEvent,
                    ...(input.title && { title: input.title }),
                    ...(input.start_time && { start: input.start_time }),
                    ...(input.end_time && { end: input.end_time }),
                    ...(input.description !== undefined && { description: input.description }),
                    ...(input.location !== undefined && { location: input.location }),
                    updatedAt: Date.now(),
                };

                saveEvent(userId, updatedEvent);

                return JSON.stringify({ success: true, event_id: input.event_id });
            } catch (error) {
                return JSON.stringify({ error: `Error al actualizar evento: ${error}` });
            }
        },
    });

    // Delete calendar event (local)
    const deleteCalendarEvent = new FunctionTool({
        name: "delete_calendar_event",
        description: "Delete an event from local calendar",
        inputSchema: {
            type: "object",
            properties: {
                event_id: { type: "string", description: "Event ID to delete" },
            },
            required: ["event_id"],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: async (input: any) => {
            try {
                const deleted = deleteEvent(userId, input.event_id);
                if (!deleted) {
                    return JSON.stringify({ error: "Evento no encontrado" });
                }

                return JSON.stringify({ success: true, event_id: input.event_id });
            } catch (error) {
                return JSON.stringify({ error: `Error al eliminar evento: ${error}` });
            }
        },
    });

    // Move calendar event (local)
    const moveCalendarEvent = new FunctionTool({
        name: "move_calendar_event",
        description: "Move an event to a new date/time in local calendar",
        inputSchema: {
            type: "object",
            properties: {
                event_id: { type: "string", description: "Event ID to move" },
                new_start_time: { type: "string", description: "New start time in ISO format" },
                new_end_time: { type: "string", description: "New end time in ISO format" },
            },
            required: ["event_id", "new_start_time", "new_end_time"],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: async (input: any) => {
            try {
                const existingEvent = getEvent(userId, input.event_id);
                if (!existingEvent) {
                    return JSON.stringify({ error: "Evento no encontrado" });
                }

                const updatedEvent: CalendarEvent = {
                    ...existingEvent,
                    start: input.new_start_time,
                    end: input.new_end_time,
                    updatedAt: Date.now(),
                };

                saveEvent(userId, updatedEvent);

                return JSON.stringify({ success: true, event_id: input.event_id });
            } catch (error) {
                return JSON.stringify({ error: `Error al mover evento: ${error}` });
            }
        },
    });

    // Get upcoming events (local)
    const getUpcomingEvents = new FunctionTool({
        name: "get_upcoming_events",
        description: "Get upcoming events from local calendar",
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
                const events = getUpcomingEvents(userId, limit);

                const formattedEvents = events.map((event) => ({
                    id: event.id,
                    title: event.title,
                    start_time: event.start,
                    end_time: event.end,
                    description: event.description || "",
                }));

                return JSON.stringify({ events: formattedEvents, count: formattedEvents.length });
            } catch (error) {
                return JSON.stringify({ error: `Error al obtener eventos: ${error}` });
            }
        },
    });

    // Analyze availability (local)
    const analyzeAvailability = new FunctionTool({
        name: "analyze_availability",
        description: "Analyze available time slots for a specific date in local calendar",
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

                const events = getEventsInRange(userId, startOfDay, endOfDay);

                const busySlots: Array<{ start: Date; end: Date }> = events.map((event) => ({
                    start: new Date(event.start),
                    end: new Date(event.end),
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
            } catch (error) {
                return JSON.stringify({ error: `Error al analizar disponibilidad: ${error}` });
            }
        },
    });

    // Get visible calendar context (local)
    const getVisibleCalendarContext = new FunctionTool({
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

                const events = getEventsInRange(userId, startDate, endDate);

                const formattedEvents = events.map((event) => ({
                    id: event.id,
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    description: event.description || "",
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
            } catch (error) {
                return JSON.stringify({ error: `Error al obtener contexto del calendario: ${error}` });
            }
        },
    });

    // Suggest free time activities (local)
    const suggestFreeTimeActivities = new FunctionTool({
        name: "suggest_free_time_activities",
        description: "Analyze free time slots in the local calendar and suggest appropriate activities based on available time, time of day, and user preferences. Use this when the user asks what to do, has free time, or wants suggestions.",
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

                const events = getEventsInRange(userId, startOfDay, endOfDay);

                const busySlots: Array<{ start: Date; end: Date }> = events.map((event) => ({
                    start: new Date(event.start),
                    end: new Date(event.end),
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
            } catch (error) {
                return JSON.stringify({ error: `Error al sugerir actividades: ${error}` });
            }
        },
    });

    return [
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
}
