import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth-provider';
import Menu from '@/components/menu';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"
import { images } from '@/lib/assets';

export const metadata: Metadata = { 
  metadataBase: new URL('https://www.parkourreborn.com'),
  title: 'Parkour Reborn Hub',
  description: 'A hub for PARKOUR Reborn links, tools, games, and community stuff. Everything useful is kept in one spot.',
  icons: {icon: images.logo.icon},
  openGraph: {
    siteName: 'PARKOUR Reborn',
    title: 'Parkour Reborn Hub',
    description: 'A hub for PARKOUR Reborn links, tools, games, and community stuff. Everything useful is kept in one spot.',
    images: [{url: images.logo.og, width: 760, height: 399, alt: 'PARKOUR Reborn'}],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parkour Reborn Hub',
    description: 'A hub for PARKOUR Reborn links, tools, games, and community stuff. Everything useful is kept in one spot.',
    images: [images.logo.og],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="hub-bg" aria-hidden="true">
          <span className="hub-bg__icons" />
          <span className="hub-bg__shade" />
        </div>
        <AuthProvider>
          <Menu />
          {children}
        </AuthProvider>
        <Analytics/>
      </body>
    </html>
  );
}
