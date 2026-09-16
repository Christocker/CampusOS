"use client";

import { useEffect } from "react";

function isStaleBuildError(error: unknown) {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes("chunk") ||
    lower.includes("dynamically imported module") ||
    lower.includes("loading css chunk") ||
    lower.includes("failed to fetch dynamically imported module")
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isStaleBuildError(error)) {
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          background: "#FFFCF5",
          color: "#1C1C1E",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ maxWidth: 360, fontSize: 15, color: "#8E8E93", margin: 0 }}>
            The app failed to load correctly. This is usually temporary.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => reset()}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid #E8E5DC",
                background: "transparent",
                color: "#1C1C1E",
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "none",
                background: "#FFCC00",
                color: "#1C1C1E",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
