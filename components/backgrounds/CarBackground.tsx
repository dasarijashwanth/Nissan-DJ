export function CarBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "#0a0e1a" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-96"
        style={{
          background: "linear-gradient(to bottom, rgba(245, 158, 11, 0.12), transparent)",
        }}
      />

      <svg
        className="absolute -bottom-40 -right-40 size-[520px] opacity-[0.05]"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="90" stroke="#f8fafc" strokeWidth="2" />
        <circle cx="100" cy="100" r="60" stroke="#f8fafc" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="6" fill="#f8fafc" />
      </svg>

      <div className="absolute inset-x-0 top-24 flex flex-col gap-8 opacity-[0.03]">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-px w-full bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
