"use client";

import { useState } from "react";

interface GoogleCalendarEmbedProps {
    calendarId?: string;
    mode?: "WEEK" | "MONTH" | "AGENDA";
    showTitle?: boolean;
    showNav?: boolean;
    showDate?: boolean;
    showPrint?: boolean;
    showTabs?: boolean;
    showCalendars?: boolean;
    height?: number;
    width?: string;
    bgColor?: string;
    timezone?: string;
}

export function GoogleCalendarEmbed({
    calendarId = "primary",
    mode = "WEEK",
    showTitle = false,
    showNav = true,
    showDate = true,
    showPrint = false,
    showTabs = true,
    showCalendars = false,
    height = 600,
    width = "100%",
    bgColor = "ffffff",
    timezone = "America/Lima",
}: GoogleCalendarEmbedProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Construir URL del iframe de Google Calendar
    const buildCalendarUrl = () => {
        const baseUrl = "https://calendar.google.com/calendar/embed";
        const params = new URLSearchParams();

        // Configurar el calendario
        if (calendarId && calendarId !== "primary") {
            params.set("src", calendarId);
        }

        // Configurar vista
        params.set("mode", mode);

        // Configurar opciones de visualización
        params.set("showTitle", showTitle ? "1" : "0");
        params.set("showNav", showNav ? "1" : "0");
        params.set("showDate", showDate ? "1" : "0");
        params.set("showPrint", showPrint ? "1" : "0");
        params.set("showTabs", showTabs ? "1" : "0");
        params.set("showCalendars", showCalendars ? "1" : "0");

        // Color de fondo
        params.set("bgcolor", `%23${bgColor}`);

        // Zona horaria
        params.set("ctz", timezone);

        return `${baseUrl}?${params.toString()}`;
    };

    return (
        <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-gray-900">Google Calendar</h3>
                    <p className="text-xs text-gray-500">Vista en tiempo real</p>
                </div>
                <div className="flex gap-2">
                    <a
                        href="https://calendar.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        Abrir en Google Calendar
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </div>

            {/* Calendar iframe */}
            <div className="relative" style={{ height: `${height}px`, width }}>
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-gray-500">Cargando calendario...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                        <div className="text-center p-4">
                            <svg className="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-red-600">{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="mt-2 text-sm text-blue-600 hover:underline"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                )}

                <iframe
                    src={buildCalendarUrl()}
                    style={{ border: 0, width: "100%", height: "100%" }}
                    frameBorder="0"
                    scrolling="no"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setError("No se pudo cargar el calendario. Verifica que tengas acceso.");
                    }}
                />
            </div>
        </div>
    );
}

// Componente de vista rápida para mostrar junto al chat
export function CalendarQuickView({
    calendarId,
    timezone = "America/Lima",
}: {
    calendarId?: string;
    timezone?: string;
}) {
    return (
        <div className="w-full max-w-md">
            <GoogleCalendarEmbed
                calendarId={calendarId}
                mode="AGENDA"
                showTitle={false}
                showNav={false}
                showDate={true}
                showTabs={false}
                height={300}
                timezone={timezone}
            />
        </div>
    );
}

// Componente de calendario completo
export function CalendarFullView({
    calendarId,
    timezone = "America/Lima",
}: {
    calendarId?: string;
    timezone?: string;
}) {
    const [viewMode, setViewMode] = useState<"WEEK" | "MONTH" | "AGENDA">("WEEK");

    return (
        <div className="w-full">
            {/* View mode selector */}
            <div className="flex gap-1 mb-3">
                {(["WEEK", "MONTH", "AGENDA"] as const).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === mode
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        {mode === "WEEK" ? "Semana" : mode === "MONTH" ? "Mes" : "Agenda"}
                    </button>
                ))}
            </div>

            <GoogleCalendarEmbed
                calendarId={calendarId}
                mode={viewMode}
                showTitle={false}
                showNav={true}
                showDate={true}
                showTabs={false}
                height={600}
                timezone={timezone}
            />
        </div>
    );
}

export default GoogleCalendarEmbed;
