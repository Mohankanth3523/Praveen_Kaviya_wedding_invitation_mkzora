/** @type {import('tailwindcss').Config} */
/*
 * Light blush theme (Oct 2026 redesign). The palette is defined ONCE here and
 * mirrored as CSS variables in src/styles/global.css (:root).
 *
 * Contrast notes (WCAG 2.2):
 *  - rose (#754457) and ink (#49333D) pass AA on every light surface.
 *  - gold (#B58A45) is for ornaments, borders and large display text only.
 *  - gold-dark (#7D5A28) is the gold used for small text (≥ 4.5:1 everywhere).
 *
 * Legacy names (burgundy, ivory) are kept so existing class names continue to
 * work, but they now resolve to the light theme's colours.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brief palette
        pearl: '#FFF7FA', // main background
        blush: { DEFAULT: '#FCE8EF', rose: '#F5D3DF' }, // light blush / soft rose pink
        champagne: '#F8EBDD', // pale champagne
        panel: '#FFFCFD', // white panels
        petal: '#E8C5D2', // fine borders
        rose: { DEFAULT: '#754457', wine: '#5C3446', line: '#A9788F' }, // deep rose text, hover wine, input borders
        ink: '#49333D', // main text
        gold: { DEFAULT: '#B58A45', light: '#D9BC85', dark: '#7D5A28' }, // antique gold

        // Legacy aliases → light theme
        burgundy: { DEFAULT: '#754457', deep: '#5C3446', soft: '#8E5A6E' },
        ivory: { DEFAULT: '#FFFCFD', warm: '#F8EBDD', deep: '#F5D3DF' },

        // Night palette — used ONLY by the 3D temple stage and its illustrated fallback.
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
      boxShadow: {
        petal: '0 24px 50px -30px rgba(117, 68, 87, 0.35)',
        'petal-lg': '0 34px 70px -36px rgba(117, 68, 87, 0.42)',
      },
    },
  },
  plugins: [],
};
