import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import FirebaseProvider from '@/components/FirebaseProvider';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#B2967D',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'HUDA HOMES — Premium Marble, Natural Stone & Tiles',
  description:
    'Surface Your Vision. Exceptional marble, natural stone & architectural surfaces selected for timeless interiors and architectural spaces.',
  openGraph: {
    title: 'HUDA HOMES — Premium Marble, Natural Stone & Tiles',
    description:
      'Surface Your Vision. Exceptional marble, natural stone & architectural surfaces.',
    type: 'website',
    siteName: 'HUDA HOMES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HUDA HOMES — Premium Marble, Natural Stone & Tiles',
    description:
      'Surface Your Vision. Exceptional marble, natural stone & architectural surfaces.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body
        className="bg-[#B2967D] text-white antialiased min-h-screen selection:bg-[#F55B31]/30"
        suppressHydrationWarning
      >
        <FirebaseProvider>{children}</FirebaseProvider>
      </body>
    </html>
  );
}
