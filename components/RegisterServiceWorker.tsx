"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/serwist/sw.js")
      .then((registration) => {
        // The browser's own update check can be slow to kick in (especially for an installed
        // PWA that's rarely backgrounded/reopened), leaving a stale cached version in place for
        // a long time. Force a check on every load/foreground instead of waiting for that.
        registration.update().catch(() => {});
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") registration.update().catch(() => {});
        });
      })
      .catch(() => {});
  }, []);

  return null;
}
