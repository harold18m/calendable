"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Spinner } from "@heroui/react";

interface AuthGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/auth/signin?redirect_url=/app");
        }
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded) {
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

    if (!isSignedIn) {
        return null;
    }

    return <>{children}</>;
}

export default AuthGuard;
