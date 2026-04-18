import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      colors: {
        bg:       '#0a0c14',
        surface:  '#0f1220',
        surface2: '#151929',
        surface3: '#1c2035',
        cyan:     '#00e5ff',
        pink:     '#e040fb',
        green:    '#00e676',
        red:      '#ff1744',
        gold:     '#ffd740',
        blue:     '#448aff',
        dim:      '#7c84a3',
        muted:    '#4a5170',
      },
    },
  },
  plugins: [],
}
export default config
