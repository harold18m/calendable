"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Spinner } from "@heroui/react";

interface AuthGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin?callbackUrl=/app");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            fallback || (
                <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-primary/10">
                    <div className="flex flex-col items-center gap-4">
                        <Spinner size="lg" color="primary" />
                        <p className="text-default-500">Verificando sesión...</p>
                    </div>
                </div>
            )
        );
    }

    if (status === "unauthenticated") {
        return null;
    }

    return <>{children}</>;
}

export default AuthGuard;
