import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";

import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Energy Optimizer · Patagonian SMEs",
  description:
    "Climate-aware energy consumption projections for small and medium enterprises in Tierra del Fuego.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
