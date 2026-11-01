/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        petalyx: {
          ink: 'var(--ink, #121410)',
          olive: 'var(--olive, #4d6a10)',
          green: 'var(--green, #6f9a0c)',
          lime: 'var(--lime, #b4cd52)',
          pill: 'var(--pill, #e7efcf)',
          line: 'var(--line, #eef0ea)',
          bg: 'var(--bg, #ffffff)',
          stage: 'var(--stage, #e9eee0)',
        },
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'petalyx': '22px',
      },
      boxShadow: {
        'btn': 'inset 0 1px 0 rgba(255,255,255,.25), 0 2px 6px rgba(60,80,10,.25)',
        'pill': '0 0 0 1px rgba(0,0,0,.05), 0 6px 18px rgba(0,0,0,.06)',
        'elevated': '0 30px 60px rgba(10,20,60,.12)',
      },
    },
  },
  plugins: [],
};
