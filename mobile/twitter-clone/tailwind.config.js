/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // 'class' lets NativeWind toggle dark mode via a class instead of CSS media
  // queries. This is required whenever you manually control the color scheme
  // (e.g. via StyleSheet.setFlag or expo-status-bar's style prop).
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};
