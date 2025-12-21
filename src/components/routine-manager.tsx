"use client";

import { useState } from "react";

interface Routine {
    id: string;
    name: string;
    goal: string;
    frequency: string;
    duration_minutes: number;
    preferred_days: string[];
    preferred_time_start: string;
    preferred_time_end: string;
    active: boolean;
    success_count: number;
    failure_count: number;
}

interface CalendarEvent {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    recurring: boolean;
    recurrence_pattern?: string;
}

interface PendingAction {
    intent: string;
    event_id?: string;
    routine_id?: string;
    details: Record<string, unknown>;
}

interface RoutineManagerProps {
    routines: Routine[];
    calendar: CalendarEvent[];
    pendingAction?: PendingAction | null;
    onConfirmAction?: (action: PendingAction) => void;
    onRejectAction?: (action: PendingAction) => void;
}

const DAYS_SHORT: Record<string, string> = {
    Monday: "Lun",
    Tuesday: "Mar",
    Wednesday: "Mié",
    Thursday: "Jue",
    Friday: "Vie",
    Saturday: "Sáb",
    Sunday: "Dom",
};

function formatTime(time: string): string {
    return time.slice(0, 5);
}

function formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString("es-ES", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getSuccessRate(routine: Routine): number {
    const total = routine.success_count + routine.failure_count;
    if (total === 0) return 0;
    return Math.round((routine.success_count / total) * 100);
}

function getStatusColor(rate: number): string {
    if (rate >= 80) return "text-green-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-red-600";
}

export function RoutineManager({
    routines,
    calendar,
    pendingAction,
    onConfirmAction,
    onRejectAction,
}: RoutineManagerProps) {
    const [activeTab, setActiveTab] = useState<"routines" | "calendar">("routines");

    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Gestor de Rutinas</h2>
                <p className="text-sm text-gray-500">Planificación y seguimiento</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("routines")}
                    className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === "routines"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Rutinas ({routines.length})
                </button>
                <button
                    onClick={() => setActiveTab("calendar")}
                    className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === "calendar"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Calendario ({calendar.length})
                </button>
            </div>

            {/* Pending Action Banner */}
            {pendingAction && (
                <div className="p-4 bg-amber-50 border-b border-amber-200">
                    <div className="flex items-start gap-3">
                        <div className="shrink-0">
                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-amber-800">
                                Acción pendiente: {pendingAction.intent.replace("_", " ")}
                            </h3>
                            <p className="text-sm text-amber-700 mt-1">
                                {JSON.stringify(pendingAction.details, null, 2)}
                            </p>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => onConfirmAction?.(pendingAction)}
                                    className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                >
                                    Confirmar
                                </button>
                                <button
                                    onClick={() => onRejectAction?.(pendingAction)}
                                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                >
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                {activeTab === "routines" && (
                    <div className="space-y-3">
                        {routines.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                                No hay rutinas configuradas. Pide al agente que te ayude a crear una.
                            </p>
                        ) : (
                            routines.map((routine) => {
                                const successRate = getSuccessRate(routine);
                                return (
                                    <div
                                        key={routine.id}
                                        className={`p-4 rounded-lg border ${routine.active ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-gray-900">{routine.name}</h3>
                                                    {!routine.active && (
                                                        <span className="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded">
                                                            Pausada
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{routine.goal}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-lg font-semibold ${getStatusColor(successRate)}`}>
                                                    {successRate}%
                                                </div>
                                                <div className="text-xs text-gray-500">cumplimiento</div>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{routine.duration_minutes} min</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>
                                                    {routine.preferred_days.map((d) => DAYS_SHORT[d] || d.slice(0, 3)).join(", ")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>
                                                    {formatTime(routine.preferred_time_start)} - {formatTime(routine.preferred_time_end)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex gap-4 text-xs">
                                            <span className="text-green-600">
                                                ✓ {routine.success_count} completadas
                                            </span>
                                            <span className="text-red-600">
                                                ✗ {routine.failure_count} fallidas
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {activeTab === "calendar" && (
                    <div className="space-y-2">
                        {calendar.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                                No hay eventos en el calendario.
                            </p>
                        ) : (
                            calendar.map((event) => (
                                <div
                                    key={event.id}
                                    className="p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{event.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {formatDateTime(event.start_time)} - {formatDateTime(event.end_time)}
                                            </p>
                                        </div>
                                        {event.recurring && (
                                            <span className="px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded">
                                                {event.recurrence_pattern || "Recurrente"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default RoutineManager;
