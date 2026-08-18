import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

const inter = Inter({
  variable: "--font-inter",
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-slate-900 font-sans">
        <NextTopLoader color="#4f46e5" showSpinner={false} />
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
