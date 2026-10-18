/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: { DEFAULT: '#64151F', deep: '#4A0F17', soft: '#7E2532' },
        gold: { DEFAULT: '#C6A15B', light: '#E2C68C', dark: '#8C6A2E' },
        ivory: { DEFAULT: '#F8F1E5', warm: '#F1E4CC', deep: '#E8D6B5' },
        sandstone: '#9D7957',
        stone: { DEFAULT: '#211B18', soft: '#2E2622' },
        amber: { lamp: '#FFC76B' },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        caps: ['Cinzel', '"Cormorant Garamond"', 'Georgia', 'serif'],
        tamil: ['"Noto Serif Tamil"', '"Cormorant Garamond"', 'serif'],
        body: ['"EB Garamond"', 'Georgia', 'serif'],
        rsvp: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      letterSpacing: { ritual: '0.28em' },
    },
  },
  plugins: [],
};
