/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // PRD §6.6 palette, sourced from the CSS vars in src/index.css so the
      // vars stay the single source of truth while components get real tokens
      // (e.g. bg-bg-secondary, text-content-primary, bg-square-filled).
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        accent: {
          blue: 'var(--accent-blue)',
          green: 'var(--accent-green)',
          yellow: 'var(--accent-yellow)',
        },
        square: {
          DEFAULT: 'var(--square-default)',
          filled: 'var(--square-filled)',
          'filled-text': 'var(--square-filled-text)',
          hover: 'var(--square-hover)',
        },
        'filled-square': 'var(--filled-square)',
        'free-space': 'var(--free-space)',
        'winning-line': 'var(--winning-line)',
      },
      animation: {
        // 'confetti' animation omitted on purpose (plan §4 #3): the architecture
        // draft referenced a missing keyframe; celebration uses canvas-confetti (JS).
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in': 'bounceIn 0.5s ease-out',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
