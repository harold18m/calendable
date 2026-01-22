export function HeartIcon({ className }: { className?: string }) {
  // Generar un ID único para el gradiente para evitar conflictos cuando hay múltiples instancias
  const gradientId = `heartGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <svg className={className || "w-full h-full"} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="100%" stopColor="#6b7280" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
}
