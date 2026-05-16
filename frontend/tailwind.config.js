/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#121212',
        surface: '#27272A',
        pink: {
          DEFAULT: '#FF007F',
          dim: 'rgba(255,0,127,0.15)',
          glow: 'rgba(255,0,127,0.4)',
        },
        blue: {
          DEFAULT: '#00E5FF',
          dim: 'rgba(0,229,255,0.15)',
          glow: 'rgba(0,229,255,0.4)',
        },
        neutral: '#6B7280',
        assassin: '#000000',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        roboto: ['"Roboto Condensed"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        pink: '0 0 12px rgba(255,0,127,0.7), 0 0 30px rgba(255,0,127,0.3)',
        blue: '0 0 12px rgba(0,229,255,0.7), 0 0 30px rgba(0,229,255,0.3)',
        red: '0 0 12px rgba(255,0,0,0.7), 0 0 30px rgba(255,0,0,0.3)',
      },
      keyframes: {
        flipIn: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        clueSlideIn: {
          '0%': { opacity: 0, transform: 'scale(0.7)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        fadeOut: {
          '0%': { opacity: 1 },
          '100%': { opacity: 0, pointerEvents: 'none' },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      animation: {
        'flip-in': 'flipIn 0.5s ease-in-out forwards',
        'clue-in': 'clueSlideIn 0.3s ease-out forwards',
        pulse: 'pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
