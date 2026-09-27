import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("dj-theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DJ",
  description: "Personal income, expense, vehicle, and family money tracker",
  // iOS Safari ignores the web manifest for "Add to Home Screen" — without these it either
  // falls back to a page screenshot as the icon or opens the installed shortcut in a regular
  // browser tab (full address bar/chrome) instead of a standalone app-like window.
  appleWebApp: {
    title: "DJ",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <NextTopLoader color="#4f46e5" showSpinner={false} />
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
