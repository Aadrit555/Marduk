/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        redshift: {
          50: '#fff1f0',
          100: '#ffdfdc',
          200: '#ffc5c0',
          300: '#ff9d93',
          400: '#ff6454',
          500: '#f83b27',
          600: '#e5220e',
          700: '#c11807',
          800: '#9f170a',
          900: '#831a0f',
          950: '#480803',
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', '"Playfair Display"', '"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', '"Plus Jakarta Sans"', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'beam-flicker': 'beamFlicker 3s ease-in-out infinite alternate',
      },
      keyframes: {
        beamFlicker: {
          '0%': { opacity: '0.85', filter: 'drop-shadow(0 0 15px rgba(255, 100, 50, 0.6))' },
          '100%': { opacity: '1', filter: 'drop-shadow(0 0 30px rgba(255, 60, 20, 0.9))' },
        },
      },
    },
  },
  plugins: [],
};
