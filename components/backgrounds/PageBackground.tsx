import { FinanceBackground } from "@/components/backgrounds/FinanceBackground";
import { CarBackground } from "@/components/backgrounds/CarBackground";
import { SettingsBackground } from "@/components/backgrounds/SettingsBackground";
import { AuthBackground } from "@/components/backgrounds/AuthBackground";

export type BackgroundVariant = "finance" | "car" | "settings" | "auth";

export function PageBackground({ variant }: { variant: BackgroundVariant }) {
  switch (variant) {
    case "finance":
      return <FinanceBackground />;
    case "car":
      return <CarBackground />;
    case "settings":
      return <SettingsBackground />;
    case "auth":
      return <AuthBackground />;
  }
}
