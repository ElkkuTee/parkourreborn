import type { Metadata } from 'next';
import Menu from '@/components/menu';
import './globals.css';

const siteUrl = 'https://parkourreborn-new.vercel.app';

const siteTitle = 'Parkour Reborn Hub';
const siteDescription = 'A hub for PARKOUR Reborn links, tools, games, and community stuff. Everything useful is kept in one spot.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  icons: { icon: '/logo.ico' },
  openGraph: {
    siteName: 'PARKOUR Reborn',
    title: siteTitle,
    description: siteDescription,
    images: [{ url: '/embed.png', width: 760, height: 399, alt: 'PARKOUR Reborn' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/embed.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Menu />
        {children}
      </body>
    </html>
  );
}
