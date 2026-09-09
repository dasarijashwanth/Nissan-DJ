"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", fontFamily: "system-ui, sans-serif" }}>
          <p style={{ fontSize: "1rem", fontWeight: 600 }}>Something went wrong</p>
          <p style={{ fontSize: "0.875rem", color: "#666" }}>The app hit an unexpected error and couldn&apos;t render.</p>
          <button
            onClick={reset}
            style={{ marginTop: "8px", padding: "8px 16px", borderRadius: "8px", background: "#4f46e5", color: "white", border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
