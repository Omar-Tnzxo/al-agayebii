/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#0F4C81',
          50: '#E3F0FF',
          100: '#B6D9F9',
          200: '#87C1F5',
          300: '#5BA9F0',
          400: '#3E93EC',
          500: '#0F4C81',
          600: '#0E4473',
          700: '#0C3D66',
          800: '#0B3558',
          900: '#092C4A',
          foreground: '#FFFFFF'
        },
        secondary: {
          DEFAULT: '#102A43',
          50: '#E9EDF1',
          100: '#C6D1DC',
          200: '#A3B5C8',
          300: '#8099B3',
          400: '#5C7D9F',
          500: '#102A43',
          600: '#0E263D',
          700: '#0C2136',
          800: '#0A1C30',
          900: '#081829',
          foreground: '#FFFFFF'
        },
        accent: {
            DEFAULT: '#D97706', /* لون برتقالي غامق للوضوح على الخلفيات البيضاء */
          50: '#FFF5E5',
          100: '#FFE5B8',
          200: '#FFD58A',
          300: '#FFC55C',
          400: '#FFB52E',
          500: '#D97706',
          600: '#D97B00',
          700: '#B36600',
          800: '#8C5000',
          900: '#663A00',
          foreground: '#102A43'
        },
        success: {
          DEFAULT: '#10B981',
          50: '#E7F9F4',
          100: '#C4F0E2',
          200: '#A1E7D0',
          300: '#7EDEBD',
          400: '#5BD5AB',
          500: '#10B981',
          600: '#0FA874',
          700: '#0D9668',
          800: '#0C855B',
          900: '#0A734F',
          foreground: '#FFFFFF'
        },
        warning: {
          DEFAULT: '#FBBF24',
          50: '#FEF8E7',
          100: '#FEF0C3',
          200: '#FDE79F',
          300: '#FCDF7B',
          400: '#FCD657',
          500: '#FBBF24',
          600: '#E3AC20',
          700: '#CA991D',
          800: '#B18619',
          900: '#987316',
          foreground: '#102A43'
        },
        danger: {
          DEFAULT: '#EF4444',
          50: '#FEF0F0',
          100: '#FDD8D8',
          200: '#FBB9B9',
          300: '#F99B9B',
          400: '#F77C7C',
          500: '#EF4444',
          600: '#D93D3D',
          700: '#C13636',
          800: '#A92F2F',
          900: '#912828',
          foreground: '#FFFFFF'
        },
        neutral: {
          DEFAULT: '#64748B',
          50: '#F1F3F6',
          100: '#DCE0E8',
          200: '#C7CDD9',
          300: '#B2BBCB',
          400: '#9EA8BC',
          500: '#64748B',
          600: '#5A697D',
          700: '#505E70',
          800: '#455262',
          900: '#3B4655',
          foreground: '#FFFFFF'
        },
        category: {
          electrical: '#0F4C81',
          plumbing: '#10B981',
          tools: '#FFA500'
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF'
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: '#102A43',
          foreground: '#FFFFFF',
          primary: '#0F4C81',
          'primary-foreground': '#FFFFFF',
          accent: '#FFA500',
          'accent-foreground': '#102A43',
          border: '#1E3A5F',
          ring: '#0F4C81'
        }
      },
      fontFamily: {
        sans: ['var(--font-tajawal)', 'Tajawal', 'sans-serif'],
        heading: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
        tajawal: ['var(--font-tajawal)', 'Tajawal', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'slide-left': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'slide-right': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'scale-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' }
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%, 100%': { transform: 'scale(1.5)', opacity: '0' }
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'slide-left': 'slide-left 0.4s ease-out',
        'slide-right': 'slide-right 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'scale-out': 'scale-out 0.3s ease-out',
        'ping-slow': 'ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite'
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'fancy': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'inner-light': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(15, 76, 129, 0.5)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-shine': 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent)',
      },
      textAlign: {
        'start': 'start',
        'end': 'end',
      },
      margin: {
        'inline-start': 'margin-inline-start',
        'inline-end': 'margin-inline-end',
      },
      padding: {
        'inline-start': 'padding-inline-start',
        'inline-end': 'padding-inline-end',
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    function({ addUtilities }) {
      const newUtilities = {
        '.rtl': {
          direction: 'rtl',
          'text-align': 'right'
        },
        '.ltr': {
          direction: 'ltr',
          'text-align': 'left'
        },
        '.flip-x': {
          transform: 'scaleX(-1)'
        },
        '.space-start': {
          'margin-inline-start': '0.25rem'
        },
        '.space-end': {
          'margin-inline-end': '0.25rem'
        }
      }
      addUtilities(newUtilities)
    }
  ],
} 