export function Hero3DSkeleton() {
  return (
    <div
      className="animate-pulse"
      style={{
        width: "100%",
        height: "520px",
        borderRadius: "24px",
        background: "linear-gradient(135deg, #080c18 0%, #0f1525 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🚗</div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>Loading 3D view...</div>
      </div>
    </div>
  );
}
