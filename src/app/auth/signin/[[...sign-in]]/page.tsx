"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@heroui/react";

function SignInContent() {
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") || "/app";

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-primary/10 p-4">
            <SignIn 
                routing="path"
                path="/auth/signin"
                signUpUrl="/auth/signup"
                afterSignInUrl={redirectUrl}
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

export default function SignInPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-primary/10">
                    <Spinner size="lg" color="primary" />
                </div>
            }
        >
            <SignInContent />
        </Suspense>
    );
}
