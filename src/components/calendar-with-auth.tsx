"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback, useEffect } from "react";
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
            const now = new Date();
            const timeMin = now.toISOString();
            const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                new URLSearchParams({
                    timeMin,
                    timeMax,
                    maxResults: "50",
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
    }, [session?.accessToken, onEventsLoaded]);

    useEffect(() => {
        if (session?.accessToken) {
            loadEvents();
        }
    }, [session?.accessToken, loadEvents]);

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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar
                        src={session.user?.image || undefined}
                        name={session.user?.name || "User"}
                        size="sm"
                    />
                    <div>
                        <p className="text-sm font-medium">
                            {session.user?.name || "Mi Calendario"}
                        </p>
                        <p className="text-tiny text-default-400">{session.user?.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={loadEvents}
                        isLoading={isLoadingEvents}
                        title="Actualizar"
                    >
                        {!isLoadingEvents && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )}
                    </Button>
                    <Link
                        href="https://calendar.google.com"
                        isExternal
                        size="sm"
                        showAnchorIcon
                    >
                        Abrir Calendar
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                selectedKey={viewMode}
                onSelectionChange={(key) => setViewMode(key as "WEEK" | "MONTH" | "AGENDA")}
                size="sm"
                variant="bordered"
            >
                <Tab key="AGENDA" title="Agenda" />
                <Tab key="WEEK" title="Semana" />
                <Tab key="MONTH" title="Mes" />
            </Tabs>

            {/* Error */}
            {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Calendar content */}
            {viewMode === "AGENDA" ? (
                <div className="max-h-96 overflow-y-auto">
                    {isLoadingEvents ? (
                        <div className="py-12 text-center">
                            <Spinner size="md" color="primary" />
                        </div>
                    ) : events.length === 0 ? (
                        <div className="py-12 text-center text-default-500">
                            <p className="text-sm">No hay eventos próximos</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {events.map((event) => {
                                const startDate = new Date(event.start.dateTime || event.start.date || "");
                                const endDate = new Date(event.end.dateTime || event.end.date || "");
                                const isAllDay = !event.start.dateTime;

                                return (
                                    <Card key={event.id} className="bg-default-50" shadow="none">
                                        <CardBody className="py-3">
                                            <div className="flex items-start gap-3">
                                                <div className="shrink-0 w-12 text-center">
                                                    <div className="text-tiny text-default-400">
                                                        {startDate.toLocaleDateString("es", { weekday: "short" })}
                                                    </div>
                                                    <div className="text-lg font-semibold">
                                                        {startDate.getDate()}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {event.summary || "Sin título"}
                                                    </p>
                                                    <p className="text-tiny text-default-400">
                                                        {isAllDay ? (
                                                            <Chip size="sm" variant="flat" color="secondary">Todo el día</Chip>
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
                                                    {event.location && (
                                                        <p className="text-tiny text-default-400 truncate mt-0.5">
                                                            📍 {event.location}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <Card shadow="none" className="overflow-hidden">
                    <CardBody className="p-0">
                        <iframe
                            src={`https://calendar.google.com/calendar/embed?mode=${viewMode}&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&ctz=${timezone}`}
                            style={{ border: 0, width: "100%", height: "500px" }}
                            frameBorder="0"
                            scrolling="no"
                        />
                    </CardBody>
                </Card>
            )}
        </div>
    );
}

export default CalendarWithAuth;
