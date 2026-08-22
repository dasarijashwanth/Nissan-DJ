"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { TrackingMode } from "@/lib/trackingMode";

export async function setTrackingMode(mode: TrackingMode) {
  const store = await cookies();
  store.set("trackingMode", mode, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  revalidatePath("/", "layout");
}
