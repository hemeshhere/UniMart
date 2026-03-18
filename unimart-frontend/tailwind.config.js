/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        'primary-orange': '#f89025',
        'dark-blue': '#1b2641',
        'bg-light': '#f4f6fa',
        'text-dark': '#2c3246',
        'text-gray': '#828a9c',
        'white': '#ffffff',
        'danger': '#e74c3c',
        'success': '#2ecc71',
      },
      boxShadow: {
        'sm': '0 4px 10px rgba(0,0,0,0.05)',
        'md': '0 10px 25px rgba(0,0,0,0.08)',
        'lg': '0 20px 40px rgba(0,0,0,0.12)',
        'base': '0 10px 25px rgba(0,0,0,0.08)', /* used for play-btn */
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(5deg)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-in': 'slideInRight 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out infinite 2s',
      }
    },
  },
  plugins: [],
}
