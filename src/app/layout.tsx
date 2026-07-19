import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IMBA-OS',
  description: 'A nonprofit operating system and executive decision cockpit for IMBA.',
};

// Applies the saved theme before first paint so there's no light→dark flash.
// Light is the default; only an explicit stored "dark" opts in.
const themeScript = `(function(){try{if(localStorage.getItem('imba-theme')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
