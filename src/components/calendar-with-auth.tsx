"use client";

import { useSession, signIn } from "next-auth/react";
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
    isPreview?: boolean; // Para eventos de previsualización
}

interface CalendarWithAuthProps {
    onEventsLoaded?: (events: CalendarEvent[]) => void;
    onAccessTokenReady?: (token: string) => void;
    onRefreshReady?: (refreshFn: () => Promise<void>) => void;
    previewEvents?: CalendarEvent[]; // Eventos de previsualización
    timezone?: string;
    viewMode?: "WEEK" | "MONTH" | "DAY";
    onViewModeChange?: (mode: "WEEK" | "MONTH" | "DAY") => void;
    currentDate?: Date;
    onCurrentDateChange?: (date: Date) => void;
    hideControls?: boolean; // Para ocultar los controles internos cuando se usan desde el navbar
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

export function CalendarWithAuth({
    onEventsLoaded,
    onAccessTokenReady,
    onRefreshReady,
    previewEvents = [],
    timezone = "America/Lima",
    viewMode: externalViewMode,
    onViewModeChange,
    currentDate: externalCurrentDate,
    onCurrentDateChange,
    hideControls = false,
}: CalendarWithAuthProps) {
    const { data: session, status } = useSession();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [internalViewMode, setInternalViewMode] = useState<"WEEK" | "MONTH" | "DAY">("WEEK");
    const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
    
    // Usar props externas si están disponibles, sino usar estado interno
    const viewMode = externalViewMode ?? internalViewMode;
    const currentDate = externalCurrentDate ?? internalCurrentDate;
    
    const setViewMode = (mode: "WEEK" | "MONTH" | "DAY") => {
        if (onViewModeChange) {
            onViewModeChange(mode);
        } else {
            setInternalViewMode(mode);
        }
    };
    
    const setCurrentDate = (date: Date) => {
        if (onCurrentDateChange) {
            onCurrentDateChange(date);
        } else {
            setInternalCurrentDate(date);
        }
    };

    useEffect(() => {
        if (session?.accessToken) {
            onAccessTokenReady?.(session.accessToken);
        }
    }, [session?.accessToken, onAccessTokenReady]);

    // Si hay error de refresh token, forzar re-login
    useEffect(() => {
        if (session?.error === "RefreshAccessTokenError") {
            console.log("Token refresh failed, redirecting to sign in...");
            signIn("google"); // Forzar re-autenticación
        }
    }, [session?.error]);

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

            if (response.status === 401) {
                // Token inválido, forzar re-autenticación
                console.log("401 Unauthorized, forcing re-auth...");
                signIn("google");
                return;
            }

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

    // Exponer función de refresh para actualizaciones externas
    useEffect(() => {
        if (session?.accessToken && onRefreshReady) {
            onRefreshReady(loadEvents);
        }
    }, [session?.accessToken, onRefreshReady, loadEvents]);

    // Get events for a specific date (including preview events)
    const getEventsForDate = useCallback((date: Date) => {
        const realEvents = events.filter(event => {
            const eventStart = new Date(event.start.dateTime || event.start.date || "");
            return isSameDay(eventStart, date);
        });
        const previews = previewEvents.filter(event => {
            const eventStart = new Date(event.start.dateTime || event.start.date || "");
            return isSameDay(eventStart, date);
        }).map(e => ({ ...e, isPreview: true }));
        return [...realEvents, ...previews];
    }, [events, previewEvents]);

    // Navigation
    const navigate = (direction: number) => {
        const newDate = new Date(currentDate);
        if (viewMode === "WEEK") {
            newDate.setDate(newDate.getDate() + (direction * 7));
        } else if (viewMode === "DAY") {
            newDate.setDate(newDate.getDate() + direction);
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
        <div className="flex flex-col h-full">
            {/* Tabs + Navigation - Solo mostrar si no están ocultos */}
            {!hideControls && (
                <>
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <Tabs
                            selectedKey={viewMode}
                            onSelectionChange={(key) => setViewMode(key as "WEEK" | "MONTH" | "DAY")}
                            size="sm"
                            variant="light"
                            classNames={{
                                tabList: "gap-1 p-0.5 bg-default-100 rounded-lg",
                                tab: "h-6 px-2 text-xs",
                                cursor: "bg-background shadow-sm",
                            }}
                        >
                            <Tab key="DAY" title="Día" />
                            <Tab key="WEEK" title="Semana" />
                            <Tab key="MONTH" title="Mes" />
                        </Tabs>

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
                    </div>

                    {/* Current period display */}
                    <div className="text-center mb-3">
                        <p className="text-sm font-medium">
                            {viewMode === "DAY"
                                ? `${DAYS[currentDate.getDay()]} ${currentDate.getDate()} ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                                : viewMode === "WEEK"
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
                </>
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
            <div className="flex-1 min-h-0">
                {!isLoadingEvents && viewMode === "DAY" && (
                    <DayView
                        currentDate={currentDate}
                        getEventsForDate={getEventsForDate}
                    />
                )}

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
            </div>
        </div>
    );
}

// Hours for the time grid (6 AM to 10 PM)
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

// Helper to get event color (solid for real, with opacity for preview)
function getEventColorClass(index: number, isPreview: boolean = false): string {
    const colors = [
        { solid: "bg-blue-500", preview: "bg-blue-400/50 border-2 border-dashed border-blue-500" },
        { solid: "bg-green-500", preview: "bg-green-400/50 border-2 border-dashed border-green-500" },
        { solid: "bg-purple-500", preview: "bg-purple-400/50 border-2 border-dashed border-purple-500" },
        { solid: "bg-orange-500", preview: "bg-orange-400/50 border-2 border-dashed border-orange-500" },
        { solid: "bg-pink-500", preview: "bg-pink-400/50 border-2 border-dashed border-pink-500" },
        { solid: "bg-teal-500", preview: "bg-teal-400/50 border-2 border-dashed border-teal-500" },
    ];
    const color = colors[index % colors.length];
    return isPreview ? color.preview : color.solid;
}

// Helper to get event position and height based on time
function getEventStyle(event: CalendarEvent, hourHeight: number = 64) {
    const start = new Date(event.start.dateTime || event.start.date || "");
    const end = new Date(event.end.dateTime || event.end.date || "");

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    const top = (startHour - 6) * hourHeight;
    const height = Math.max((endHour - startHour) * hourHeight, 20);

    return { top: `${top}px`, height: `${height}px` };
}

// Day View Component (Google Calendar style with hour grid)
function DayView({
    currentDate,
    getEventsForDate
}: {
    currentDate: Date;
    getEventsForDate: (date: Date) => CalendarEvent[];
}) {
    const today = new Date();
    const isToday = isSameDay(currentDate, today);
    const dayEvents = getEventsForDate(currentDate);
    const hourHeight = 64;

    // Current time indicator position
    const now = new Date();
    const currentTimeTop = isToday
        ? ((now.getHours() + now.getMinutes() / 60) - 6) * hourHeight
        : -100;

    return (
        <div className="border border-divider rounded-lg overflow-hidden h-full flex flex-col">
            {/* Day header */}
            <div className="bg-default-50 border-b border-divider py-2 px-3 shrink-0">
                <div className={`text-center ${isToday ? 'text-primary' : ''}`}>
                    <div className="text-xs text-default-400 uppercase">
                        {DAYS[currentDate.getDay()]}
                    </div>
                    <div className={`text-xl font-semibold ${isToday ? 'bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                        {currentDate.getDate()}
                    </div>
                </div>
            </div>

            {/* Time grid */}
            <div className="relative overflow-y-auto flex-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Current time indicator */}
                {isToday && currentTimeTop >= 0 && currentTimeTop <= HOURS.length * hourHeight && (
                    <div
                        className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                        style={{ top: `${currentTimeTop}px` }}
                    >
                        <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
                        <div className="flex-1 h-0.5 bg-red-500" />
                    </div>
                )}

                {/* Hour rows */}
                {HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="flex"
                        style={{ height: `${hourHeight}px` }}
                    >
                        {/* Time label */}
                        <div className="w-16 shrink-0 pr-2 text-right">
                            <span className="text-[10px] text-default-400 -mt-2 block">
                                {hour.toString().padStart(2, '0')}:00
                            </span>
                        </div>
                        {/* Grid cell */}
                        <div className="flex-1 border-l border-b border-divider relative" />
                    </div>
                ))}

                {/* Events overlay */}
                <div className="absolute top-0 left-16 right-0 bottom-0">
                    {dayEvents
                        .filter(e => e.start.dateTime) // Only timed events
                        .map((event, idx) => {
                            const style = getEventStyle(event, hourHeight);
                            const startDate = new Date(event.start.dateTime!);
                            const endDate = new Date(event.end.dateTime || event.end.date || "");
                            const isPreview = event.isPreview || false;

                            return (
                                <Tooltip
                                    key={event.id}
                                    content={
                                        <div className="p-1">
                                            <p className="font-medium text-xs">
                                                {isPreview && <span className="text-yellow-500">[Preview] </span>}
                                                {event.summary}
                                            </p>
                                            <p className="text-[10px] text-default-400">
                                                {startDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} -
                                                {endDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    }
                                >
                                    <div
                                        className={`absolute left-1 right-1 ${getEventColorClass(idx, isPreview)} text-white text-[10px] px-2 py-1 rounded cursor-pointer hover:opacity-90 overflow-hidden z-10 ${isPreview ? 'animate-pulse' : ''}`}
                                        style={style}
                                    >
                                        <div className="font-medium truncate">{event.summary || "Sin título"}</div>
                                        <div className="text-white/80 text-[9px]">
                                            {startDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                    </div>
                                </Tooltip>
                            );
                        })}
                </div>
            </div>

            {/* All-day events */}
            {dayEvents.filter(e => !e.start.dateTime).length > 0 && (
                <div className="border-t border-divider p-2 bg-default-50">
                    <div className="text-[10px] text-default-400 mb-1">Todo el día</div>
                    <div className="space-y-1">
                        {dayEvents.filter(e => !e.start.dateTime).map((event, idx) => (
                            <div
                                key={event.id}
                                className={`${getEventColorClass(idx, event.isPreview)} text-white text-[10px] px-2 py-1 rounded truncate`}
                            >
                                {event.summary || "Sin título"}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Week View Component (Google Calendar style with hour grid)
function WeekView({
    currentDate,
    getEventsForDate
}: {
    currentDate: Date;
    getEventsForDate: (date: Date) => CalendarEvent[];
}) {
    const weekDates = getWeekDates(currentDate);
    const today = new Date();
    const hourHeight = 56;

    // Current time indicator
    const now = new Date();
    const currentTimeTop = ((now.getHours() + now.getMinutes() / 60) - 6) * hourHeight;
    const todayIndex = weekDates.findIndex(d => isSameDay(d, today));

    return (
        <div className="border border-divider rounded-lg overflow-hidden h-full flex flex-col">
            {/* Days header */}
            <div className="grid grid-cols-[64px_repeat(7,1fr)] bg-default-50 border-b border-divider shrink-0">
                <div />
                {weekDates.map((date, i) => {
                    const isToday = isSameDay(date, today);
                    return (
                        <div
                            key={i}
                            className={`text-center py-2 border-l border-divider`}
                        >
                            <div className="text-[10px] text-default-400 uppercase">{DAYS[date.getDay()]}</div>
                            <div className={`text-sm font-medium ${isToday ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto' : ''}`}>
                                {date.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time grid */}
            <div className="relative overflow-y-auto flex-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Current time indicator */}
                {todayIndex >= 0 && currentTimeTop >= 0 && currentTimeTop <= HOURS.length * hourHeight && (
                    <div
                        className="absolute z-20 flex items-center pointer-events-none"
                        style={{
                            top: `${currentTimeTop}px`,
                            left: `calc(64px + ${todayIndex} * ((100% - 64px) / 7))`,
                            width: `calc((100% - 64px) / 7)`
                        }}
                    >
                        <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
                        <div className="flex-1 h-0.5 bg-red-500" />
                    </div>
                )}

                {/* Hour rows */}
                {HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="grid grid-cols-[64px_repeat(7,1fr)]"
                        style={{ height: `${hourHeight}px` }}
                    >
                        {/* Time label */}
                        <div className="pr-2 text-right">
                            <span className="text-[10px] text-default-400 -mt-2 block">
                                {hour.toString().padStart(2, '0')}:00
                            </span>
                        </div>
                        {/* Day columns */}
                        {weekDates.map((date, i) => {
                            const isToday = isSameDay(date, today);
                            return (
                                <div
                                    key={i}
                                    className={`border-l border-b border-divider ${isToday ? 'bg-primary/5' : ''}`}
                                />
                            );
                        })}
                    </div>
                ))}

                {/* Events overlay */}
                {weekDates.map((date, dayIndex) => {
                    const dayEvents = getEventsForDate(date).filter(e => e.start.dateTime);
                    return dayEvents.map((event, idx) => {
                        const style = getEventStyle(event, hourHeight);
                        const startDate = new Date(event.start.dateTime!);
                        const isPreview = event.isPreview || false;

                        return (
                            <Tooltip
                                key={event.id}
                                content={
                                    <div className="p-1">
                                        <p className="font-medium text-xs">
                                            {isPreview && <span className="text-yellow-500">[Preview] </span>}
                                            {event.summary}
                                        </p>
                                        <p className="text-[10px] text-default-400">
                                            {startDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                }
                            >
                                <div
                                    className={`absolute ${getEventColorClass(idx, isPreview)} text-white text-[9px] px-1 py-0.5 rounded cursor-pointer hover:opacity-90 overflow-hidden z-10 ${isPreview ? 'animate-pulse' : ''}`}
                                    style={{
                                        ...style,
                                        left: `calc(56px + ${dayIndex} * ((100% - 56px) / 7) + 2px)`,
                                        width: `calc((100% - 56px) / 7 - 4px)`
                                    }}
                                >
                                    <div className="font-medium truncate">{event.summary || "Sin título"}</div>
                                    <div className="text-white/80 text-[8px]">
                                        {startDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </div>
                            </Tooltip>
                        );
                    });
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
        <div className="border border-divider rounded-lg overflow-hidden h-full flex flex-col">
            {/* Days header */}
            <div className="grid grid-cols-7 bg-default-50 shrink-0">
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
            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                {monthDates.map((date, i) => {
                    const dayEvents = getEventsForDate(date);
                    const isToday = isSameDay(date, today);
                    const isCurrentMonth = date.getMonth() === currentMonth;
                    const isFirstRow = i < 7;
                    return (
                        <div
                            key={i}
                            className={`min-h-24 p-1 ${i % 7 > 0 ? 'border-l border-divider' : ''} ${!isFirstRow ? 'border-t border-divider' : ''} ${!isCurrentMonth ? 'bg-default-50' : ''} ${isToday ? 'bg-primary/5' : ''}`}
                        >
                            <div className={`text-[10px] text-center mb-0.5 ${isToday ? 'bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center mx-auto' : ''} ${!isCurrentMonth ? 'text-default-300' : 'text-default-600'}`}>
                                {date.getDate()}
                            </div>
                            <div className="space-y-0.5">
                                {dayEvents.slice(0, 2).map((event, idx) => (
                                    <Tooltip
                                        key={event.id}
                                        content={event.isPreview ? `[Preview] ${event.summary}` : event.summary}
                                    >
                                        <div
                                            className={`${getEventColorClass(idx, event.isPreview)} text-white text-[8px] px-0.5 rounded truncate cursor-pointer ${event.isPreview ? 'animate-pulse' : ''}`}
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

export default CalendarWithAuth;
