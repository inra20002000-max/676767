import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#0D0F17',
          dark: '#0D0F17',
          card: '#161926',
          border: '#2A3048',
          subtle: '#1C2136',
        },
        neon: {
          cyan: '#00F0FF',
          lime: '#39FF14',
          pink: '#FF007F',
          yellow: '#FFE600',
          purple: '#8A2BE2',
          orange: '#FF6B00',
        },
        stat: {
          health: '#10B981',
          happiness: '#F59E0B',
          smarts: '#3B82F6',
          wealth: '#8B5CF6',
        },
      },
      boxShadow: {
        neo: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'neo-sm': '2px 2px 0px 0px rgba(0, 0, 0, 1)',
        'neo-lg': '6px 6px 0px 0px rgba(0, 0, 0, 1)',
        'neo-cyan': '4px 4px 0px 0px #00F0FF',
        'neo-lime': '4px 4px 0px 0px #39FF14',
        'neo-pink': '4px 4px 0px 0px #FF007F',
        'neo-yellow': '4px 4px 0px 0px #FFE600',
        'neo-white': '4px 4px 0px 0px rgba(255, 255, 255, 0.9)',
        brutal: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-lg': '6px 6px 0px 0px rgba(0, 0, 0, 1)',
      },
      fontFamily: {
        display: ['"Cabinet Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};

export default config;
