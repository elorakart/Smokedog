import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Libre_Baskerville } from "next/font/google";
import { LenisProvider } from "@/components/providers/LenisProvider";
import "./globals.css";

const display = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "SMOKEDOG's Arena",
  description: "Multiplayer games — Mafia City and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${inter.variable} ${jetbrains.variable} font-sans antialiased`}
      >
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
