/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: [
    "./src/*.{html,js,css}",
    "./src/views/**/*.ejs",
    "./public/js/**/*.js",
    "./node_modules/flowbite/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        gray33: "#333",
        orangefa: "#ffa400",
      },
      spacing: {
        35: "35px",
      },
    },
  },
  plugins: [require("flowbite/plugin")],
};
