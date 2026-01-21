import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  saveEvent,
  loadEvents,
  getEvent,
  deleteEvent,
  getEventsInRange,
  getUpcomingEvents,
  type CalendarEvent,
} from "@/lib/event-storage";

// Helper para obtener userId (email) desde Clerk
async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  
  // Obtener el usuario completo para acceder al email
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress || userId;
}

// GET - Obtener eventos
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "list": {
        const startDate = searchParams.get("start_date");
        const endDate = searchParams.get("end_date");

        if (startDate && endDate) {
          const events = getEventsInRange(
            userId,
            new Date(startDate),
            new Date(endDate)
          );
          return NextResponse.json({ events, count: events.length });
        }

        const events = loadEvents(userId);
        return NextResponse.json({ events, count: events.length });
      }

      case "upcoming": {
        const limit = parseInt(searchParams.get("limit") || "10");
        const events = getUpcomingEvents(userId, limit);
        return NextResponse.json({ events, count: events.length });
      }

      case "get": {
        const eventId = searchParams.get("event_id");
        if (!eventId) {
          return NextResponse.json(
            { error: "event_id requerido" },
            { status: 400 }
          );
        }

        const event = getEvent(userId, eventId);
        if (!event) {
          return NextResponse.json(
            { error: "Evento no encontrado" },
            { status: 404 }
          );
        }

        return NextResponse.json({ event });
      }

      default:
        const events = loadEvents(userId);
        return NextResponse.json({ events, count: events.length });
    }
  } catch (error) {
    console.error("Error en GET /api/events:", error);
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    );
  }
}

// POST - Crear evento
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      start,
      end,
      timezone = "America/Lima",
      recurring = false,
      recurrenceRule,
      location,
    } = body;

    if (!title || !start || !end) {
      return NextResponse.json(
        { error: "title, start y end son requeridos" },
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

    const event: CalendarEvent = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title,
      description,
      start,
      end,
      timezone,
      recurring,
      recurrenceRule,
      location,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveEvent(userId, event);

    return NextResponse.json({
      success: true,
      event_id: event.id,
      event,
    });
  } catch (error) {
    console.error("Error en POST /api/events:", error);
    return NextResponse.json(
      { error: "Error al crear evento" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar evento
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { event_id, ...updates } = body;

    if (!event_id) {
      return NextResponse.json(
        { error: "event_id requerido" },
        { status: 400 }
      );
    }

    const existingEvent = getEvent(userId, event_id);
    if (!existingEvent) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    const updatedEvent: CalendarEvent = {
      ...existingEvent,
      ...updates,
      updatedAt: Date.now(),
    };

    saveEvent(userId, updatedEvent);

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Error en PUT /api/events:", error);
    return NextResponse.json(
      { error: "Error al actualizar evento" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar evento
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("event_id");

    if (!eventId) {
      return NextResponse.json(
        { error: "event_id requerido" },
        { status: 400 }
      );
    }

    const deleted = deleteEvent(userId, eventId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/events:", error);
    return NextResponse.json(
      { error: "Error al eliminar evento" },
      { status: 500 }
    );
  }
}
