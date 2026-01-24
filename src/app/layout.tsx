import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PowerSyncProviderWithHydration } from "@/lib/powersync/PowerSyncContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Water Mapper Lifeline",
  description: "A lifeline for water mapping.",
  themeColor: "#ffffff",
  manifest: "/manifest.webmanifest",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PowerSyncProviderWithHydration>
          {children}
        </PowerSyncProviderWithHydration>
      </body>
    </html>
  );
}
