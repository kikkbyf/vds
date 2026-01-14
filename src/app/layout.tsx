import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Virtual Digital Studio',
  description: 'AI-Driven Professional Photography Simulation',
};

import { Providers } from '@/components/providers/Providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
