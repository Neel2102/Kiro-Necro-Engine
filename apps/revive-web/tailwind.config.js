/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🎃 HALLOWEEN THEME COLORS 🎃
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff8c00', // Pumpkin orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Spooky dark theme
        dark: {
          900: '#0a0514', // Deep purple-black
          800: '#140a1e', // Dark purple
          700: '#1e0f28', // Purple night
          600: '#2d1b3d', // Witch purple
          500: '#3d2651', // Lighter purple
        },
        accent: {
          purple: '#8a2be2', // Witch purple
          orange: '#ff8c00', // Jack-o'-lantern
          blood: '#8b0000', // Blood red
          ghost: '#f0f0ff', // Ghost white
          fog: '#808080', // Fog gray
        },
        halloween: {
          pumpkin: '#ff8c00',
          witch: '#8a2be2',
          blood: '#8b0000',
          ghost: '#f0f0ff',
          bat: '#1a1a1a',
          candy: '#ff69b4',
          moon: '#fffacd',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-roboto-mono)'],
        serif: ['var(--font-crimson-pro)'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-bat': 'float-bat 8s ease-in-out infinite',
        'float-ghost': 'float-ghost 6s ease-in-out infinite',
        'spooky-glow': 'spooky-glow 4s ease-in-out infinite',
        'flicker': 'flicker 3s ease-in-out infinite',
        'cobweb-sway': 'cobweb-sway 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(5deg)' },
        },
        'float-bat': {
          '0%, 100%': { transform: 'translateY(0) rotate(-5deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        'float-ghost': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-25px) scale(1.1)' },
        },
        'spooky-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 15px rgba(138, 43, 226, 0.5), 0 0 30px rgba(138, 43, 226, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 25px rgba(138, 43, 226, 0.8), 0 0 50px rgba(138, 43, 226, 0.5)' 
          },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
          '75%': { opacity: '0.9' },
        },
        'cobweb-sway': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
  darkMode: 'class',
}
