module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Medical/Hospital Color Palette
        'medical-primary': '#0ea5a4',    // Teal (trust, care)
        'medical-secondary': '#0369a1',  // Dark Blue (professionalism)
        'medical-accent': '#d946ef',     // Purple/Magenta
        'medical-light': '#06b6d4',      // Cyan (healing)
        'medical-dark': '#0c4a6e',       // Navy Blue
        'health-green': '#10b981',       // Green (health, growth)
        'warning-red': '#dc2626',        // Red (emergency)
        'success-green': '#059669',      // Success Green
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        rotateScale: {
          '0%': { transform: 'rotateY(90deg) scale(0.5)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg) scale(1)', opacity: '1' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' }
        }
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        slideInLeft: 'slideInLeft 0.6s ease-out',
        slideInRight: 'slideInRight 0.6s ease-out',
        fadeIn: 'fadeIn 0.8s ease-out',
        rotateScale: 'rotateScale 0.8s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      backgroundImage: {
        'gradient-medical': 'linear-gradient(135deg, #0ea5a4 0%, #0369a1 100%)',
        'gradient-light': 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      }
    }
  },
  plugins: [require('@tailwindcss/forms')],
}