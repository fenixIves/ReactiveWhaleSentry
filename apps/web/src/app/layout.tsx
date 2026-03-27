import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";

import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import Providers from "./providers";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces"
});

export const metadata: Metadata = {
  title: "Smart Whale Sentinel",
  description: "Reactive-powered whale behavior dashboard and automated strategy console."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${fraunces.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
