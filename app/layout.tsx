import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import LiveScoreTicker from "@/components/LiveScoreTicker";
import OfflineIndicator from "@/components/OfflineIndicator";
import { ThemeProvider } from "@/components/ThemeProvider";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "Cricket Scorer Pro — Live Match Scoring & Analytics",
  description:
    "Complete, modern, production-ready Cricket Scorer app for scoring ball-by-ball matches, managing teams and tournaments, and tracking statistics.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('cric_theme') || 'midnight';
                  document.documentElement.setAttribute('data-theme', saved);
                  if (saved === 'daylight') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased transition-colors duration-200">
        <ThemeProvider>
          <LiveScoreTicker />
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12">
            {children}
          </main>
          <OfflineIndicator />
          <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
