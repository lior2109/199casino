import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#060a0f',
          card: '#0d1520',
        },
        border: {
          subtle: 'rgba(255,255,255,0.07)',
        },
        accent: {
          cyan: '#00e5ff',
          green: '#00d68f',
          gold: '#f5c842',
          danger: '#ff3c5f',
          sport: '#3b82f6',
          casino: '#a855f7',
          cashier: '#f97316',
        },
        text: {
          primary: '#e2e8f0',
          muted: '#64748b',
        },
      },
      fontFamily: {
        heading: ['Bebas Neue', 'sans-serif'],
        body: ['Noto Sans Hebrew', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
