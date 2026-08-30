import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Skin Tracker',
    template: '%s · Skin Tracker',
  },
  description: 'Persönliches Tracking von Haut, Routine und Ernährung.',
  applicationName: 'Skin Tracker',
  appleWebApp: {
    capable: true,
    title: 'Skin Tracker',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  // Gesundheitsdaten gehören nicht in Suchmaschinen oder Vorschauen.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Randlos bis unter den Home-Indicator — Basis für die Safe-Area-Utilities.
  viewportFit: 'cover',
  // Kein Zoom-Sprung beim Fokussieren von Feldern, Zoom bleibt aber möglich.
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf8' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1d21' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="top-center"
          offset={12}
          toastOptions={{
            classNames: {
              toast:
                'rounded-xl border border-border bg-popover text-popover-foreground shadow-raised',
            },
          }}
        />
      </body>
    </html>
  );
}
