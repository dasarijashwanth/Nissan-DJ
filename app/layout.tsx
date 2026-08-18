import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("sentratrack-theme");
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
  title: "SentraTrack",
  description: "Personal income, expense, and Nissan Sentra cost tracker",
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
