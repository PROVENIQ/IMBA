import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IMBA-OS',
  description: 'A nonprofit operating system and executive decision cockpit for IMBA.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
