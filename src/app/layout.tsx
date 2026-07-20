import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

export const metadata: Metadata = {
  title: 'IMBA-OS',
  description: 'A nonprofit operating system and executive decision cockpit for IMBA.',
};

// Applies the saved theme before first paint so there's no dark→light flash.
// Dark is the default (the command-surface first impression); only an explicit
// stored "light" opts out.
const themeScript = `(function(){try{if(localStorage.getItem('imba-theme')!=='light'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Analytics />
        <GoogleAnalytics gaId="G-99H4GKBKPB" />
      </body>
    </html>
  );
}
