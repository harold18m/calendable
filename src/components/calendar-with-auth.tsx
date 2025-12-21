"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { GoogleAuthButton } from "./google-auth-button";
import {
    Card,
    CardBody,
    Button,
    Avatar,
    Spinner,
    Tabs,
    Tab,
    Link,
    Chip,
    Tooltip,
} from "@heroui/react";

interface CalendarEvent {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    description?: string;
    location?: string;
}

interface CalendarWithAuthProps {
    onEventsLoaded?: (events: CalendarEvent[]) => void;
    onAccessTokenReady?: (token: string) => void;
    timezone?: string;
}

// Helpers
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function getWeekDates(date: Date): Date[] {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
}

function getMonthDates(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const dates: Date[] = [];
    const current = new Date(startDate);
    while (dates.length < 42) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

function getEventColor(index: number): string {
    const colors = [
        "bg-blue-500",
        "bg-green-500",
        "bg-purple-500",
        "bg-orange-500",
        "bg-pink-500",
        "bg-teal-500",
    ];
    return colors[index % colors.length];
}

export function CalendarWithAuth({
    onEventsLoaded,
    onAccessTokenReady,
    timezone = "America/Lima",
}: CalendarWithAuthProps) {
    const { data: session, status } = useSession();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"WEEK" | "MONTH" | "AGENDA">("WEEK");
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (session?.accessToken) {
            onAccessTokenReady?.(session.accessToken);
        }
    }, [session?.accessToken, onAccessTokenReady]);

    const loadEvents = useCallback(async () => {
        if (!session?.accessToken) return;

        setIsLoadingEvents(true);
        setError(null);

        try {
            // Load events for the current month range
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            start.setDate(start.getDate() - 7); // Include previous week
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            end.setDate(end.getDate() + 7); // Include next week

            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                new URLSearchParams({
                    timeMin: start.toISOString(),
                    timeMax: end.toISOString(),
                    maxResults: "100",
                    singleEvents: "true",
                    orderBy: "startTime",
                }),
                {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Error al cargar eventos");
            }

            const data = await response.json();
            setEvents(data.items || []);
            onEventsLoaded?.(data.items || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setIsLoadingEvents(false);
        }
    }, [session?.accessToken, onEventsLoaded, currentDate]);

    useEffect(() => {
        if (session?.accessToken) {
            loadEvents();
        }
    }, [session?.accessToken, loadEvents]);

    // Get events for a specific date
    const getEventsForDate = useCallback((date: Date) => {
        return events.filter(event => {
            const eventStart = new Date(event.start.dateTime || event.start.date || "");
            return isSameDay(eventStart, date);
        });
    }, [events]);

    // Navigation
    const navigate = (direction: number) => {
        const newDate = new Date(currentDate);
        if (viewMode === "WEEK") {
            newDate.setDate(newDate.getDate() + (direction * 7));
        } else {
            newDate.setMonth(newDate.getMonth() + direction);
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Spinner size="lg" color="primary" />
                <span className="text-sm text-default-500 mt-3">Cargando...</span>
            </div>
        );
    }

    if (status === "unauthenticated" || !session) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                    Conecta tu Google Calendar
                </h3>
                <p className="text-sm text-default-500 mb-6 max-w-sm mx-auto">
                    Inicia sesión con tu cuenta de Google para ver y gestionar tu calendario directamente desde aquí.
                </p>
                <GoogleAuthButton />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Avatar
                        src={session.user?.image || undefined}
                        name={session.user?.name || "User"}
                        size="sm"
                        className="w-7 h-7"
                    />
                    <div>
                        <p className="text-xs font-medium">
                            {session.user?.name || "Mi Calendario"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={loadEvents}
                        isLoading={isLoadingEvents}
                        className="w-7 h-7 min-w-0"
                    >
                        {!isLoadingEvents && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )}
                    </Button>
                    <Link
                        href="https://calendar.google.com"
                        isExternal
                        className="text-xs"
                    >
                        Abrir
                    </Link>
                </div>
            </div>

            {/* Tabs + Navigation */}
            <div className="flex items-center justify-between gap-2">
                <Tabs
                    selectedKey={viewMode}
                    onSelectionChange={(key) => setViewMode(key as "WEEK" | "MONTH" | "AGENDA")}
                    size="sm"
                    variant="light"
                    classNames={{
                        tabList: "gap-1 p-0.5 bg-default-100 rounded-lg",
                        tab: "h-6 px-2 text-xs",
                        cursor: "bg-background shadow-sm",
                    }}
                >
                    <Tab key="WEEK" title="Semana" />
                    <Tab key="MONTH" title="Mes" />
                    <Tab key="AGENDA" title="Agenda" />
                </Tabs>

                {viewMode !== "AGENDA" && (
                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => navigate(-1)}
                            className="w-6 h-6 min-w-0"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Button>
                        <Button
                            size="sm"
                            variant="flat"
                            onPress={goToToday}
                            className="h-6 px-2 text-xs min-w-0"
                        >
                            Hoy
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => navigate(1)}
                            className="w-6 h-6 min-w-0"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Button>
                    </div>
                )}
            </div>

            {/* Current period display */}
            {viewMode !== "AGENDA" && (
                <div className="text-center">
                    <p className="text-sm font-medium">
                        {viewMode === "WEEK"
                            ? (() => {
                                const weekDates = getWeekDates(currentDate);
                                const start = weekDates[0];
                                const end = weekDates[6];
                                if (start.getMonth() === end.getMonth()) {
                                    return `${start.getDate()} - ${end.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
                                }
                                return `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)} - ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
                            })()
                            : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                        }
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-3 py-2 rounded-lg text-xs">
                    {error}
                </div>
            )}

            {/* Loading overlay */}
            {isLoadingEvents && (
                <div className="flex justify-center py-4">
                    <Spinner size="sm" color="primary" />
                </div>
            )}

            {/* Calendar Views */}
            {!isLoadingEvents && viewMode === "WEEK" && (
                <WeekView
                    currentDate={currentDate}
                    getEventsForDate={getEventsForDate}
                />
            )}

            {!isLoadingEvents && viewMode === "MONTH" && (
                <MonthView
                    currentDate={currentDate}
                    getEventsForDate={getEventsForDate}
                />
            )}

            {!isLoadingEvents && viewMode === "AGENDA" && (
                <AgendaView events={events} />
            )}
        </div>
    );
}

// Week View Component
function WeekView({
    currentDate,
    getEventsForDate
}: {
    currentDate: Date;
    getEventsForDate: (date: Date) => CalendarEvent[];
}) {
    const weekDates = getWeekDates(currentDate);
    const today = new Date();

    return (
        <div className="border border-divider rounded-lg overflow-hidden">
            {/* Days header */}
            <div className="grid grid-cols-7 bg-default-50">
                {weekDates.map((date, i) => {
                    const isToday = isSameDay(date, today);
                    return (
                        <div
                            key={i}
                            className={`text-center py-2 border-b border-divider ${i > 0 ? 'border-l' : ''}`}
                        >
                            <div className="text-[10px] text-default-400 uppercase">{DAYS[i]}</div>
                            <div className={`text-sm font-medium ${isToday ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto' : ''}`}>
                                {date.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Events grid */}
            <div className="grid grid-cols-7 min-h-[200px]">
                {weekDates.map((date, i) => {
                    const dayEvents = getEventsForDate(date);
                    const isToday = isSameDay(date, today);
                    return (
                        <div
                            key={i}
                            className={`p-1 ${i > 0 ? 'border-l border-divider' : ''} ${isToday ? 'bg-primary/5' : ''}`}
                        >
                            <div className="space-y-0.5">
                                {dayEvents.slice(0, 4).map((event, idx) => {
                                    const startDate = new Date(event.start.dateTime || event.start.date || "");
                                    const isAllDay = !event.start.dateTime;
                                    return (
                                        <Tooltip
                                            key={event.id}
                                            content={
                                                <div className="p-1">
                                                    <p className="font-medium text-xs">{event.summary}</p>
                                                    {!isAllDay && (
                                                        <p className="text-[10px] text-default-400">
                                                            {startDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                                                        </p>
                                                    )}
                                                </div>
                                            }
                                        >
                                            <div
                                                className={`${getEventColor(idx)} text-white text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80`}
                                            >
                                                {!isAllDay && (
                                                    <span className="font-medium">
                                                        {startDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                )}{" "}
                                                {event.summary || "Sin título"}
                                            </div>
                                        </Tooltip>
                                    );
                                })}
                                {dayEvents.length > 4 && (
                                    <div className="text-[10px] text-default-400 px-1">
                                        +{dayEvents.length - 4} más
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Month View Component
function MonthView({
    currentDate,
    getEventsForDate
}: {
    currentDate: Date;
    getEventsForDate: (date: Date) => CalendarEvent[];
}) {
    const monthDates = getMonthDates(currentDate);
    const today = new Date();
    const currentMonth = currentDate.getMonth();

    return (
        <div className="border border-divider rounded-lg overflow-hidden">
            {/* Days header */}
            <div className="grid grid-cols-7 bg-default-50">
                {DAYS.map((day, i) => (
                    <div
                        key={i}
                        className={`text-center py-1.5 text-[10px] text-default-400 uppercase border-b border-divider ${i > 0 ? 'border-l' : ''}`}
                    >
                        {day}
                    </div>
                ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
                {monthDates.map((date, i) => {
                    const dayEvents = getEventsForDate(date);
                    const isToday = isSameDay(date, today);
                    const isCurrentMonth = date.getMonth() === currentMonth;
                    const isFirstRow = i < 7;
                    return (
                        <div
                            key={i}
                            className={`min-h-[60px] p-0.5 ${i % 7 > 0 ? 'border-l border-divider' : ''} ${!isFirstRow ? 'border-t border-divider' : ''} ${!isCurrentMonth ? 'bg-default-50' : ''} ${isToday ? 'bg-primary/5' : ''}`}
                        >
                            <div className={`text-[10px] text-center mb-0.5 ${isToday ? 'bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center mx-auto' : ''} ${!isCurrentMonth ? 'text-default-300' : 'text-default-600'}`}>
                                {date.getDate()}
                            </div>
                            <div className="space-y-0.5">
                                {dayEvents.slice(0, 2).map((event, idx) => (
                                    <Tooltip
                                        key={event.id}
                                        content={event.summary}
                                    >
                                        <div
                                            className={`${getEventColor(idx)} text-white text-[8px] px-0.5 rounded truncate cursor-pointer`}
                                        >
                                            {event.summary || "Sin título"}
                                        </div>
                                    </Tooltip>
                                ))}
                                {dayEvents.length > 2 && (
                                    <div className="text-[8px] text-default-400 text-center">
                                        +{dayEvents.length - 2}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Agenda View Component
function AgendaView({ events }: { events: CalendarEvent[] }) {
    if (events.length === 0) {
        return (
            <div className="py-8 text-center text-default-500">
                <p className="text-sm">No hay eventos próximos</p>
            </div>
        );
    }

    return (
        <div className="max-h-[300px] overflow-y-auto space-y-1.5">
            {events.map((event, idx) => {
                const startDate = new Date(event.start.dateTime || event.start.date || "");
                const endDate = new Date(event.end.dateTime || event.end.date || "");
                const isAllDay = !event.start.dateTime;

                return (
                    <div
                        key={event.id}
                        className="flex items-center gap-2 p-2 bg-default-50 rounded-lg hover:bg-default-100 transition-colors"
                    >
                        <div className={`w-1 h-8 rounded-full ${getEventColor(idx)}`} />
                        <div className="shrink-0 w-10 text-center">
                            <div className="text-[10px] text-default-400">
                                {startDate.toLocaleDateString("es", { weekday: "short" })}
                            </div>
                            <div className="text-sm font-semibold">
                                {startDate.getDate()}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                                {event.summary || "Sin título"}
                            </p>
                            <p className="text-[10px] text-default-400">
                                {isAllDay ? (
                                    "Todo el día"
                                ) : (
                                    `${startDate.toLocaleTimeString("es", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })} - ${endDate.toLocaleTimeString("es", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}`
                                )}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default CalendarWithAuth;
