/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Khaki color palette
        khaki: {
          50: '#FBF9F6',
          100: '#F9F7F4',
          200: '#F5F1E8',
          300: '#E8E4DE',
          400: '#D4C4B0',
          500: '#D4A574',
          600: '#C19560',
          700: '#A68968',
          800: '#8B7355',
          900: '#6B5843',
        },
        // Status colors (complementary to khaki)
        status: {
          success: '#6B8E23',
          warning: '#D2691E',
          danger: '#A0522D',
          info: '#4682B4',
        }
      },
      backgroundColor: {
        'khaki-light': '#F5F1E8',
        'khaki-lighter': '#F9F7F4',
        'khaki-primary': '#D4A574',
      },
      borderColor: {
        'khaki': '#E8E4DE',
        'khaki-dark': '#D4C4B0',
      },
      textColor: {
        'khaki-primary': '#D4A574',
        'khaki-dark': '#8B7355',
      },
      boxShadow: {
        'khaki': '0 4px 12px rgba(212, 165, 116, 0.2)',
      }
    },
  },
  plugins: [],
}
