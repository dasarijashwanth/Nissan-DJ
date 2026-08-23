// India transfer amounts are tracked in INR, but the user pays in USD — showing an approximate
// USD equivalent is a nice-to-have, not a source of truth, so any failure here just falls back
// to a fixed recent rate rather than breaking the page.
const FALLBACK_USD_TO_INR = 83.5;

export async function getUsdToInrRate(): Promise<number> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return FALLBACK_USD_TO_INR;

    const data = (await res.json()) as { rates?: Record<string, number> };
    const rate = data.rates?.INR;
    return typeof rate === "number" && rate > 0 ? rate : FALLBACK_USD_TO_INR;
  } catch {
    return FALLBACK_USD_TO_INR;
  }
}
