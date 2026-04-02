/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        panic: {
          "0%, 100%": {
            transform: "translateX(0) rotate(0)",
            backgroundColor: "rgba(17, 24, 39, 0.5)",
          },
          "25%": {
            transform: "translateX(-3px) rotate(-2deg)",
            backgroundColor: "rgba(153, 27, 27, 0.5)",
          },
          "75%": {
            transform: "translateX(3px) rotate(2deg)",
            backgroundColor: "rgba(153, 27, 27, 0.5)",
          },
        },
      },
      animation: {
        panic: "panic 0.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
