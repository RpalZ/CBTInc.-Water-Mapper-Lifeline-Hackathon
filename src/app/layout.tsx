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
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
                  const html = document.documentElement;
                  
                  if (shouldBeDark) {
                    html.classList.add('dark');
                  } else {
                    html.classList.remove('dark');
                  }
                } catch (e) {}
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
