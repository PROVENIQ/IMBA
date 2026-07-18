import type { Config } from 'tailwindcss';

// Tailwind powers the IMBA-OS cockpit (ported from SYSOP). The finance sub-app
// uses plain CSS in globals.css; the two coexist. IMBA-OS components use only
// standard utilities + arbitrary values, so no custom color tokens are needed.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-down': 'fade-in-down 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
