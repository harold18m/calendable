"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@heroui/react";

function SignUpContent() {
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") || "/app";

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-primary/10 p-4">
            <SignUp 
                routing="path"
                path="/auth/signup"
                signInUrl="/auth/signin"
                afterSignUpUrl={redirectUrl}
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-lg",
                    },
                }}
            />
        </div>
    );
}

export default function SignUpPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-primary/10">
                    <Spinner size="lg" color="primary" />
                </div>
            }
        >
            <SignUpContent />
        </Suspense>
    );
}
