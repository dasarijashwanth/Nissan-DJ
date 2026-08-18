export function SettingsBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 opacity-30"
      style={{
        backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}
