"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { RouteProgress } from "@/components/layout/RouteProgress";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <RouteProgress />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
