"use client";

import { HeroUIProvider } from "@heroui/react";
import { ReactNode } from "react";

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return <HeroUIProvider>{children}</HeroUIProvider>;
}
