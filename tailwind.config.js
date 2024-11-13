/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./views/**/*.ejs"],
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
  plugins: [],
};
