import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Función para refrescar el access token de Google
async function refreshAccessToken(token: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
}) {
    try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken!,
            }),
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
            console.error("Error refreshing token:", refreshedTokens);
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
            // El refresh token puede o no ser devuelto, mantener el anterior si no viene uno nuevo
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        };
    } catch (error) {
        console.error("Error in refreshAccessToken:", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/calendar",
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            // Primer login: guardar tokens de Google
            if (account) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: account.expires_at,
                };
            }

            // Token aún válido (con 60 segundos de margen)
            if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000 - 60000) {
                return token;
            }

            // Token expirado, intentar refrescar
            console.log("Access token expired, refreshing...");
            return await refreshAccessToken(token);
        },
        async session({ session, token }) {
            // Pasar el access_token a la sesión del cliente
            session.accessToken = token.accessToken as string;
            session.refreshToken = token.refreshToken as string;
            session.expiresAt = token.expiresAt as number;

            // Si hubo error al refrescar, marcarlo en la sesión
            if (token.error) {
                session.error = token.error as string;
            }

            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
};
