import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth-provider';
import Menu from '@/components/menu';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"
import { images } from '@/lib/assets';

const site = 'https://www.parkourreborn.com';
const description = 'A hub for PARKOUR Reborn links, tools, games, and community stuff. Everything useful is kept in one spot.';

export const metadata: Metadata = { 
  metadataBase: new URL(site),
  applicationName: 'Parkour Reborn Hub',
  title: {
    default: 'Parkour Reborn Hub',
    template: '%s | PR Hub',
  },
  description,
  keywords: [
    'Parkour Reborn',
    'PARKOUR Reborn',
    'Parkour Reborn Hub',
    'Roblox Parkour Reborn',
    'Parkour Reborn tools',
    'Parkour Reborn map',
    'Parkour Reborn XP calculator',
    'Parkour Reborn time trials',
    'Parkour Reborn tech list',
    'Parkour Reborn techs',
    'Parkour Reborn games',
    'Parkour Reborn Discord',
    'PR Hub',
    'xp calculator',
  ],
  authors: [{name: 'Elkku'}],
  creator: 'Elkku',
  publisher: 'Parkour Reborn Hub',
  category: 'gaming',
  alternates: {canonical: '/'},
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {icon: images.logo.icon},
  openGraph: {
    type: 'website',
    url: '/',
    locale: 'en_US',
    siteName: 'PARKOUR Reborn',
    title: 'Parkour Reborn Hub',
    description,
    images: [{url: images.logo.og, width: 760, height: 399, alt: 'PARKOUR Reborn'}],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parkour Reborn Hub',
    description,
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
