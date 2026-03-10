const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src', '**', '*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0d0c0a',
        paper: '#f5f0e8',
        accent: '#e84b2a',
        accent2: '#2a6be8',
        muted: '#8a8070',
        rule: '#d4cec0',
        surface: '#ffffff',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        border: '#E5E7EB',
        error: '#DC2626',
        'user-bubble': '#6B7280',
        'user-bubble-hover': '#4B5563',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        serif: ['DM Serif Display', 'serif'],
        syne: ['Syne', 'sans-serif'],
        fraunces: ['Fraunces', 'serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
};
