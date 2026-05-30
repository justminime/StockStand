import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import '@/styles/tokens.css';
import './globals.css';

const fredoka = Fredoka({
  weight:   '400',
  subsets:  ['latin'],
  variable: '--font-fredoka',
  display:  'swap',
});

const nunito = Nunito({
  weight:   ['400', '600', '700', '800'],
  subsets:  ['latin'],
  variable: '--font-nunito',
  display:  'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://stockstand.shifth.com'),
  title:       'StockStand 🍋',
  description: 'Run a lemonade stand, secretly learn to invest. Real stock prices, kids-first design.',
  keywords:    ['lemonade stand', 'kids investing game', 'stock market for kids', 'financial education'],
  icons: {
    icon:  [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple:    '/icon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title:       'StockStand 🍋',
    description: 'Run a lemonade stand, secretly learn to invest.',
    type:        'website',
    url:         'https://stockstand.shifth.com',
    siteName:    'StockStand',
  },
  twitter: {
    card:  'summary',
    title: 'StockStand 🍋',
  },
  other: {
    'mobile-web-app-capable':               'yes',
    'apple-mobile-web-app-capable':         'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title':           'StockStand',
  },
};

export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  maximumScale:       5,          // allow pinch-zoom (accessibility)
  userScalable:       true,
  viewportFit:        'cover',    // use full screen on notched devices
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${nunito.variable}`}>
        {children}
      </body>
    </html>
  );
}
