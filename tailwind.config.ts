import type { Config } from 'tailwindcss'

const config: Config = {
  // CRITICAL: Ensure this includes all your component and template files (TSX, JSX, etc.)
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // You can extend the default theme here
    extend: {
    },
  },
  plugins: [
    // Add any Tailwind plugins you install here
    // require('@tailwindcss/forms'),
  ],
}

export default config