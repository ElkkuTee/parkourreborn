import type { Metadata } from 'next';
import Menu from '@/components/menu';
import './globals.css';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Parkour Reborn Hub',
  description: 'Parkour Reborn Hub',
  icons: { icon: '/logo.ico' },
  openGraph: {
    title: 'Parkour Reborn Hub',
    description: 'Parkour Reborn Hub',
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
