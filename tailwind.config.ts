import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography' // Import the plugin

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // Adjust paths as needed for your project structure
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // You can add theme extensions here if needed
    },
  },
  plugins: [
    typography, // Add the typography plugin here
  ],
  darkMode: 'class', // Assuming you use class-based dark mode
}
export default config