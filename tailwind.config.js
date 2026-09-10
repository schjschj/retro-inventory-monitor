/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        retro: ['"Press Start 2P"', 'monospace'],
        pixel: ['"VT323"', 'monospace'],
        tech: ['"Share Tech Mono"', 'monospace'],
        sans: ['"Pretendard"', 'sans-serif'],
      },
      colors: {
        retro: {
          dark: '#0a0d14',
          panel: '#101622',
          card: '#162032',
          border: '#24334d',
          neonCyan: '#00f0ff',
          neonGreen: '#00ff66',
          neonYellow: '#ffe600',
          neonOrange: '#ff8800',
          neonPink: '#ff0077',
          neonRed: '#ff2244',
          crtGreen: '#33ff33',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radar 3s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
