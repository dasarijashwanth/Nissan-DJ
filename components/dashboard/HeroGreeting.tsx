"use client";

import { useEffect, useState } from "react";

function timeOfDayGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HeroGreeting({ name }: { name: string }) {
  // Greeting/date must reflect the visitor's local clock, not the server's — compute after
  // mount so SSR and first client paint match (both render the neutral fallback below).
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setNow(new Date()));
    return () => cancelAnimationFrame(raf);
  }, []);

  const greeting = now ? timeOfDayGreeting(now.getHours()) : "Welcome back";
  const monthYear = now
    ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(now)
    : null;
  const dateStr = now
    ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now)
    : null;

  return (
    <div
      className="relative overflow-hidden rounded-lg p-6"
      style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.08), transparent 70%)" }}
    >
      <h1 className="font-display text-[28px] font-semibold text-text-primary">
        {greeting}
        {name ? `, ${name}` : ""} 👋
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        {monthYear ? `Here's your financial snapshot for ${monthYear}` : "Here's your financial snapshot"}
      </p>
      {dateStr && <p className="mt-0.5 text-xs text-text-muted">{dateStr}</p>}
    </div>
  );
}
