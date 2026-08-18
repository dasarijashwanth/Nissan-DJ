export function FinanceBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute -top-32 -right-32 size-96 rounded-full"
        style={{
          background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
          opacity: 0.06,
        }}
      />
      <div
        className="absolute -bottom-24 -left-24 size-72 rounded-full"
        style={{
          background: "radial-gradient(circle, var(--color-income) 0%, transparent 70%)",
          opacity: 0.06,
        }}
      />
    </div>
  );
}
