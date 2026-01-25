import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PowerSyncProviderWithHydration } from "@/lib/powersync/PowerSyncContext";

export const metadata: Metadata = {
  title: "Water Mapper Lifeline",
  description: "A lifeline for water mapping.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = stored || (systemPrefersDark ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <PowerSyncProviderWithHydration>
          {children}
        </PowerSyncProviderWithHydration>
      </body>
    </html>
  );
}
