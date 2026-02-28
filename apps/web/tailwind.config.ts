import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        ribbon: {
          bg: '#f3f3f3',
          border: '#d1d1d1',
          hover: '#e5e5e5',
          active: '#d4e8ff',
          'bg-dark': '#2d2d2d',
          'border-dark': '#404040',
          'hover-dark': '#3a3a3a',
          'active-dark': '#1a3a5c',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
