/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        beef: {
          bg: '#0b0b0c',
          card: '#121214',
          line: 'rgba(255,255,255,0.08)',
          text: 'rgba(255,255,255,0.92)',
          muted: 'rgba(255,255,255,0.70)',
          accent: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}
