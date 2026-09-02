import type { Metadata, Viewport } from 'next';

import './globals.css';

const TITLE = 'PINTR - Create plotter-like line drawings from your images';
const DESCRIPTION = 'Create plotter-like line drawings from your images.';

export const metadata: Metadata = {
  metadataBase: new URL('https://javier.xyz'),
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: 'javierbyte', url: 'https://javier.xyz' }],
  alternates: {
    canonical: 'https://javier.xyz/pintr',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://javier.xyz/pintr',
    siteName: 'PINTR',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://javier.xyz/pintr/pintr.jpg',
        alt: 'PINTR app generating a plotter-like line drawing from a photo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    site: '@javierbyte',
    creator: '@javierbyte',
    images: [
      {
        url: 'https://javier.xyz/pintr/pintr.jpg',
        alt: 'PINTR app generating a plotter-like line drawing from a photo',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#ecf0f1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
