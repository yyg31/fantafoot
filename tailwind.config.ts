import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#0b3d24",
        pitchdark: "#082a19",
      },
    },
  },
  plugins: [],
};
export default config;
