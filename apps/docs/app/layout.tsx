import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title:       { template: '%s | holi', default: 'holi — zero-runtime CSS' },
  description: 'One config file. Pure CSS output. No runtime. No dependencies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/holi.css" />
      </head>
      <body className={inter.className}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
