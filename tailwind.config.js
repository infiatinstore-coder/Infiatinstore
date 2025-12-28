/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Brand colors infiatin.store - Gold & Teal
                primary: {
                    50: '#FFFDF7',
                    100: '#FFF9E6',
                    200: '#F5E6C4',
                    300: '#E8D5A3',
                    400: '#D4BE82',
                    500: '#C9A962', // Main brand color - Gold
                    600: '#B89A4A',
                    700: '#A88B4A',
                    800: '#8B7340',
                    900: '#6B5A32',
                },
                secondary: {
                    50: '#E6F2F2',
                    100: '#CCE5E5',
                    200: '#99CCCC',
                    300: '#4D9999',
                    400: '#1A7A7A',
                    500: '#0F5C5C', // Main Teal
                    600: '#0A4A4A',
                    700: '#0A4040',
                    800: '#083333',
                    900: '#052626',
                },
                neutral: {
                    50: '#fafafa',
                    100: '#f5f5f5',
                    200: '#e5e5e5',
                    300: '#d4d4d4',
                    400: '#a3a3a3',
                    500: '#737373',
                    600: '#525252',
                    700: '#404040',
                    800: '#262626',
                    900: '#171717',
                },
                cream: {
                    50: '#FFFEF9',
                    100: '#FDF8F0',
                    200: '#FAF3E8',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'card': '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
                'card-hover': '0 10px 40px 0 rgba(0, 0, 0, 0.1)',
                'button': '0 4px 14px 0 rgba(201, 169, 98, 0.35)',
            },
            borderRadius: {
                '4xl': '2rem',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
            },
        },
    },
    plugins: [],
}
