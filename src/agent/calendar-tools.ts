import { FunctionTool } from "@strands-agents/sdk";
import { google } from "googleapis";

// Google Calendar client will be initialized with access token
function getCalendarClient(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.calendar({ version: "v3", auth });
}

function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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
            week_number: getWeekNumber(now),
        });
    },
});

// Get calendar events
export const getCalendarEvents = new FunctionTool({
    name: "get_calendar_events",
    description: "Get calendar events from Google Calendar for a date range",
    inputSchema: {
        type: "object",
        properties: {
            start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
            end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
            access_token: { type: "string", description: "Google OAuth access token" },
        },
        required: ["start_date", "end_date", "access_token"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const calendar = getCalendarClient(input.access_token);

            const response = await calendar.events.list({
                calendarId: "primary",
                timeMin: `${input.start_date}T00:00:00Z`,
                timeMax: `${input.end_date}T23:59:59Z`,
                maxResults: 100,
                singleEvents: true,
                orderBy: "startTime",
            });

            const events = response.data.items || [];

            const formattedEvents = events.map((event) => ({
                id: event.id,
                title: event.summary || "Sin título",
                start_time: event.start?.dateTime || event.start?.date,
                end_time: event.end?.dateTime || event.end?.date,
                description: event.description || "",
                recurring: !!event.recurringEventId,
                location: event.location || "",
            }));

            return JSON.stringify({ events: formattedEvents, count: formattedEvents.length });
        } catch (error) {
            return JSON.stringify({ error: `Error al obtener eventos: ${error}` });
        }
    },
});

// Analyze availability
export const analyzeAvailability = new FunctionTool({
    name: "analyze_availability",
    description: "Analyze available time slots for a specific date",
    inputSchema: {
        type: "object",
        properties: {
            date: { type: "string", description: "Date to analyze in YYYY-MM-DD format" },
            duration_minutes: { type: "number", description: "Required duration in minutes" },
            access_token: { type: "string", description: "Google OAuth access token" },
        },
        required: ["date", "duration_minutes", "access_token"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const calendar = getCalendarClient(input.access_token);

            const response = await calendar.events.list({
                calendarId: "primary",
                timeMin: `${input.date}T00:00:00Z`,
                timeMax: `${input.date}T23:59:59Z`,
                singleEvents: true,
                orderBy: "startTime",
            });

            const events = response.data.items || [];

            // Define working hours (6:00 - 22:00)
            const dayStart = new Date(`${input.date}T06:00:00`);
            const dayEnd = new Date(`${input.date}T22:00:00`);

            // Find busy periods
            const busyPeriods = events
                .filter((e) => e.start?.dateTime && e.end?.dateTime)
                .map((e) => ({
                    start: new Date(e.start!.dateTime!),
                    end: new Date(e.end!.dateTime!),
                }))
                .sort((a, b) => a.start.getTime() - b.start.getTime());

            // Find free slots
            const freeSlots: Array<{ start: string; end: string; duration_minutes: number }> = [];
            let currentTime = dayStart;

            for (const period of busyPeriods) {
                if (currentTime < period.start) {
                    const slotDuration = (period.start.getTime() - currentTime.getTime()) / 60000;
                    if (slotDuration >= input.duration_minutes) {
                        freeSlots.push({
                            start: currentTime.toTimeString().slice(0, 5),
                            end: period.start.toTimeString().slice(0, 5),
                            duration_minutes: Math.floor(slotDuration),
                        });
                    }
                }
                currentTime = new Date(Math.max(currentTime.getTime(), period.end.getTime()));
            }

            // Check remaining time until day end
            if (currentTime < dayEnd) {
                const slotDuration = (dayEnd.getTime() - currentTime.getTime()) / 60000;
                if (slotDuration >= input.duration_minutes) {
                    freeSlots.push({
                        start: currentTime.toTimeString().slice(0, 5),
                        end: dayEnd.toTimeString().slice(0, 5),
                        duration_minutes: Math.floor(slotDuration),
                    });
                }
            }

            return JSON.stringify({
                date: input.date,
                free_slots: freeSlots,
                busy_events_count: events.length,
                requested_duration: input.duration_minutes,
            });
        } catch (error) {
            return JSON.stringify({ error: `Error al analizar disponibilidad: ${error}` });
        }
    },
});

// Create calendar event
export const createCalendarEvent = new FunctionTool({
    name: "create_calendar_event",
    description: "Create a new event in Google Calendar",
    inputSchema: {
        type: "object",
        properties: {
            title: { type: "string", description: "Event title" },
            start_time: { type: "string", description: "Start time in ISO format (YYYY-MM-DDTHH:MM:SS)" },
            end_time: { type: "string", description: "End time in ISO format (YYYY-MM-DDTHH:MM:SS)" },
            description: { type: "string", description: "Event description" },
            recurring: { type: "boolean", description: "Whether this is a recurring event" },
            recurrence_days: {
                type: "array",
                items: { type: "string" },
                description: "Days for weekly recurrence (MO, TU, WE, TH, FR, SA, SU)"
            },
            access_token: { type: "string", description: "Google OAuth access token" },
        },
        required: ["title", "start_time", "end_time", "access_token"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const calendar = getCalendarClient(input.access_token);

            const event: {
                summary: string;
                description: string;
                start: { dateTime: string; timeZone: string };
                end: { dateTime: string; timeZone: string };
                recurrence?: string[];
            } = {
                summary: input.title,
                description: input.description || "",
                start: {
                    dateTime: input.start_time,
                    timeZone: "America/Lima",
                },
                end: {
                    dateTime: input.end_time,
                    timeZone: "America/Lima",
                },
            };

            // Add recurrence rule if recurring
            if (input.recurring && input.recurrence_days && input.recurrence_days.length > 0) {
                const daysStr = input.recurrence_days.join(",");
                event.recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${daysStr}`];
            }

            const response = await calendar.events.insert({
                calendarId: "primary",
                requestBody: event,
            });

            return JSON.stringify({
                success: true,
                event_id: response.data.id,
                html_link: response.data.htmlLink,
                title: input.title,
                start: input.start_time,
                end: input.end_time,
            });
        } catch (error) {
            return JSON.stringify({ error: `Error al crear evento: ${error}` });
        }
    },
});

// Update calendar event
export const updateCalendarEvent = new FunctionTool({
    name: "update_calendar_event",
    description: "Update an existing event in Google Calendar",
    inputSchema: {
        type: "object",
        properties: {
            event_id: { type: "string", description: "ID of the event to update" },
            title: { type: "string", description: "New title" },
            start_time: { type: "string", description: "New start time in ISO format" },
            end_time: { type: "string", description: "New end time in ISO format" },
            description: { type: "string", description: "New description" },
            access_token: { type: "string", description: "Google OAuth access token" },
        },
        required: ["event_id", "access_token"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const calendar = getCalendarClient(input.access_token);

            // Get existing event
            const existing = await calendar.events.get({
                calendarId: "primary",
                eventId: input.event_id,
            });

            const event = existing.data;

            // Update fields
            if (input.title) event.summary = input.title;
            if (input.description) event.description = input.description;
            if (input.start_time && event.start) event.start.dateTime = input.start_time;
            if (input.end_time && event.end) event.end.dateTime = input.end_time;

            const response = await calendar.events.update({
                calendarId: "primary",
                eventId: input.event_id,
                requestBody: event,
            });

            return JSON.stringify({
                success: true,
                event_id: response.data.id,
                title: response.data.summary,
                message: "Evento actualizado exitosamente",
            });
        } catch (error) {
            return JSON.stringify({ error: `Error al actualizar evento: ${error}` });
        }
    },
});

// Delete calendar event
export const deleteCalendarEvent = new FunctionTool({
    name: "delete_calendar_event",
    description: "Delete an event from Google Calendar",
    inputSchema: {
        type: "object",
        properties: {
            event_id: { type: "string", description: "ID of the event to delete" },
            access_token: { type: "string", description: "Google OAuth access token" },
        },
        required: ["event_id", "access_token"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const calendar = getCalendarClient(input.access_token);

            await calendar.events.delete({
                calendarId: "primary",
                eventId: input.event_id,
            });

            return JSON.stringify({
                success: true,
                message: `Evento ${input.event_id} eliminado exitosamente`,
            });
        } catch (error) {
            return JSON.stringify({ error: `Error al eliminar evento: ${error}` });
        }
    },
});

// Move calendar event
export const moveCalendarEvent = new FunctionTool({
    name: "move_calendar_event",
    description: "Move an existing event to a new time",
    inputSchema: {
        type: "object",
        properties: {
            event_id: { type: "string", description: "ID of the event to move" },
            new_start_time: { type: "string", description: "New start time in ISO format" },
            new_end_time: { type: "string", description: "New end time in ISO format" },
            reason: { type: "string", description: "Reason for moving the event" },
            access_token: { type: "string", description: "Google OAuth access token" },
        },
        required: ["event_id", "new_start_time", "new_end_time", "access_token"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const calendar = getCalendarClient(input.access_token);

            // Get existing event
            const existing = await calendar.events.get({
                calendarId: "primary",
                eventId: input.event_id,
            });

            const event = existing.data;
            const oldStart = event.start?.dateTime || event.start?.date;

            // Update times
            if (event.start) event.start.dateTime = input.new_start_time;
            if (event.end) event.end.dateTime = input.new_end_time;

            // Add reason to description if provided
            if (input.reason) {
                const currentDesc = event.description || "";
                event.description = `${currentDesc}\n\n[Movido: ${input.reason}]`.trim();
            }

            const response = await calendar.events.update({
                calendarId: "primary",
                eventId: input.event_id,
                requestBody: event,
            });

            return JSON.stringify({
                success: true,
                event_id: response.data.id,
                title: response.data.summary,
                old_start: oldStart,
                new_start: input.new_start_time,
                new_end: input.new_end_time,
                reason: input.reason || "",
            });
        } catch (error) {
            return JSON.stringify({ error: `Error al mover evento: ${error}` });
        }
    },
});

// Get upcoming events
export const getUpcomingEvents = new FunctionTool({
    name: "get_upcoming_events",
    description: "Get upcoming events from Google Calendar",
    inputSchema: {
        type: "object",
        properties: {
            max_results: { type: "number", description: "Maximum number of events to return (default 10)" },
            access_token: { type: "string", description: "Google OAuth access token" },
        },
        required: ["access_token"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const calendar = getCalendarClient(input.access_token);
            const maxResults = input.max_results || 10;

            const response = await calendar.events.list({
                calendarId: "primary",
                timeMin: new Date().toISOString(),
                maxResults,
                singleEvents: true,
                orderBy: "startTime",
            });

            const events = response.data.items || [];

            const formattedEvents = events.map((event) => ({
                id: event.id,
                title: event.summary || "Sin título",
                start_time: event.start?.dateTime || event.start?.date,
                end_time: event.end?.dateTime || event.end?.date,
                description: event.description || "",
            }));

            return JSON.stringify({ events: formattedEvents, count: formattedEvents.length });
        } catch (error) {
            return JSON.stringify({ error: `Error al obtener eventos: ${error}` });
        }
    },
});

// Suggest next action
export const suggestNextAction = new FunctionTool({
    name: "suggest_next_action",
    description: "Suggest what the user should do right now based on current time and calendar",
    inputSchema: {
        type: "object",
        properties: {
            access_token: { type: "string", description: "Google OAuth access token" },
        },
        required: ["access_token"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: async (input: any) => {
        try {
            const calendar = getCalendarClient(input.access_token);

            const now = new Date();
            const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);

            const response = await calendar.events.list({
                calendarId: "primary",
                timeMin: now.toISOString(),
                timeMax: fourHoursLater.toISOString(),
                maxResults: 5,
                singleEvents: true,
                orderBy: "startTime",
            });

            const events = response.data.items || [];

            if (events.length > 0) {
                const nextEvent = events[0];
                return JSON.stringify({
                    suggestion: `Tu próximo evento es: ${nextEvent.summary || "Sin título"}`,
                    event_start: nextEvent.start?.dateTime || nextEvent.start?.date,
                    event_title: nextEvent.summary || "Sin título",
                });
            } else {
                return JSON.stringify({
                    suggestion: "No tienes eventos programados en las próximas 4 horas. Tiempo libre disponible.",
                    free_time: true,
                });
            }
        } catch (error) {
            return JSON.stringify({ error: `Error: ${error}` });
        }
    },
});

// Export all tools
export const calendarTools = [
    getCurrentDateTime,
    getCalendarEvents,
    analyzeAvailability,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    moveCalendarEvent,
    getUpcomingEvents,
    suggestNextAction,
];
