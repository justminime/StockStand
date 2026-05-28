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
  title:       'StockStand',
  description: 'Run your lemonade stand, learn to invest! 🍋',
};

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
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
