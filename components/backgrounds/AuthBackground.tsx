export function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: "#1e1b4b" }}
    >
      <svg className="absolute inset-0 size-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMax slice">
        {/* Converging road lines toward a horizon */}
        <line x1="60" y1="400" x2="190" y2="180" stroke="#f8fafc" strokeWidth="2" opacity="0.12" />
        <line x1="340" y1="400" x2="210" y2="180" stroke="#f8fafc" strokeWidth="2" opacity="0.12" />
        <line x1="200" y1="400" x2="200" y2="180" stroke="#f8fafc" strokeWidth="1" opacity="0.08" strokeDasharray="6 10" />

        {/* Simple car silhouette on the road */}
        <g transform="translate(160,300)">
          <rect x="0" y="18" width="80" height="24" rx="8" fill="#cbd5e1" opacity="0.5" />
          <path d="M12 18 L24 2 H56 L68 18 Z" fill="#cbd5e1" opacity="0.5" />
          <circle cx="18" cy="44" r="8" fill="#0f172a" opacity="0.6" />
          <circle cx="62" cy="44" r="8" fill="#0f172a" opacity="0.6" />
        </g>
      </svg>

      <div className="absolute left-[8%] top-[20%] animate-float rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
        ⛽ 32.4 MPG
      </div>
      <div
        className="absolute right-[10%] top-[42%] animate-float rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
        style={{ animationDelay: "0.6s" }}
      >
        💰 -$450 this month
      </div>
      <div
        className="absolute left-[14%] bottom-[16%] animate-float rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
        style={{ animationDelay: "1.2s" }}
      >
        🔧 Oil change in 340mi
      </div>
    </div>
  );
}
