/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      listStyleType: {
        square: 'square',
      },
    },
  },
  plugins: [],
}
