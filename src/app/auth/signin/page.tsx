"use client";

import { Card, CardHeader, CardBody, CardFooter, Button, Divider, Spinner } from "@heroui/react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function GoogleIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
    );
}

function SignInContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/app";
    const error = searchParams.get("error");

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-primary/10 p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader className="flex flex-col items-center gap-3 pb-0 pt-8">
                    <CalendarIcon />
                    <div className="flex flex-col items-center gap-1">
                        <h1 className="text-2xl font-bold">Routine Agent</h1>
                        <p className="text-small text-default-500">
                            Tu asistente personal de rutinas
                        </p>
                    </div>
                </CardHeader>

                <Divider className="my-4" />

                <CardBody className="gap-4 px-8">
                    {error && (
                        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                            {error === "OAuthSignin" && "Error al iniciar sesión con Google"}
                            {error === "OAuthCallback" && "Error en el callback de autenticación"}
                            {error === "OAuthCreateAccount" && "Error al crear la cuenta"}
                            {error === "Callback" && "Error en el proceso de autenticación"}
                            {!["OAuthSignin", "OAuthCallback", "OAuthCreateAccount", "Callback"].includes(error) &&
                                "Ocurrió un error durante el inicio de sesión"}
                        </div>
                    )}

                    <div className="text-center text-default-600 text-sm">
                        <p>Inicia sesión con tu cuenta de Google para acceder a tu calendario y gestionar tus rutinas de manera inteligente.</p>
                    </div>

                    <Button
                        color="default"
                        variant="bordered"
                        size="lg"
                        className="w-full font-medium"
                        startContent={<GoogleIcon />}
                        onPress={handleGoogleSignIn}
                    >
                        Continuar con Google
                    </Button>
                </CardBody>

                <CardFooter className="flex-col gap-2 pb-8">
                    <p className="text-tiny text-default-400 text-center">
                        Acceso seguro con OAuth 2.0 • Solo lectura/escritura de Calendar
                    </p>
                </CardFooter>
            </Card>
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
