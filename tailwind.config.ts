import type { Config } from "tailwindcss";
const { nextui } = require("@nextui-org/react");

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "spring-green": {
          "50": "#eefff7",
          "100": "#d8ffee",
          "200": "#b4fede",
          "300": "#7afbc5",
          "400": "#38f0a2",
          "500": "#13ef93", // dg brand
          "600": "#05b46b",
          "700": "#088d56",
          "800": "#0d6e47",
          "900": "#0d5a3b",
          "950": "#003320",
        },
        "dodger-blue": {
          "50": "#eefbff",
          "100": "#d8f4ff",
          "200": "#baecff",
          "300": "#8ae4ff",
          "400": "#54d2ff",
          "500": "#2cb6ff",
          "600": "#149afb", // dg brand
          "700": "#0e81e7",
          "800": "#1267bb",
          "900": "#155893",
          "950": "#123559",
        },
        "cod-gray": {
          "50": "#f5f5f6",
          "100": "#e5e6e8",
          "200": "#ceced3",
          "300": "#acadb4",
          "400": "#82838e",
          "500": "#676873",
          "600": "#585962",
          "700": "#4b4b53",
          "800": "#424248",
          "900": "#3b3a3f",
          "950": "#0b0b0c", // dg brand
        },
        woodsmoke: {
          "50": "#f6f6f9",
          "100": "#ededf1",
          "200": "#d7d8e0",
          "300": "#b4b6c5",
          "400": "#8b8da5",
          "500": "#6c6e8b",
          "600": "#575972",
          "700": "#47485d",
          "800": "#3d3e4f",
          "900": "#363744",
          "950": "#101014", // dg brand
        },
        mercury: {
          "50": "#f6f6f7",
          "100": "#eeeef1",
          "200": "#e1e1e5", // dg brand
          "300": "#cdcdd4",
          "400": "#b9b8c1",
          "500": "#a7a5af",
          "600": "#92909b",
          "700": "#7e7c86",
          "800": "#68656e",
          "900": "#56545b",
          "950": "#323135",
        },
        "mountain-mist": {
          "50": "#f6f6f7",
          "100": "#efeff0",
          "200": "#e2e2e3",
          "300": "#cfd0d2",
          "400": "#bbbbbe",
          "500": "#a8a8ac",
          "600": "#949498", // dg brand
          "700": "#7f7f83",
          "800": "#68686b",
          "900": "#575659",
          "950": "#323234",
        },
        apple: {
          "50": "#f5faf3",
          "100": "#e7f4e4",
          "200": "#d0e8ca",
          "300": "#acd4a1",
          "400": "#7fb870",
          "500": "#5fa04e", // node brand
          "600": "#497f3a",
          "700": "#3a6530",
          "800": "#31512a",
          "900": "#2a4324",
          "950": "#12240f",
        },
        "next-blue": {
          "50": "#e8f7ff",
          "100": "#d5efff",
          "200": "#b3dfff",
          "300": "#85c7ff",
          "400": "#56a0ff",
          "500": "#2f79ff",
          "600": "#0c4cff",
          "700": "#0141ff", // next brand
          "800": "#063bcd",
          "900": "#103a9f",
          "950": "#0a205c",
        },
        "white-lilac": {
          "50": "#fbfbff", // dg brand
          "100": "#dbdbfe",
          "200": "#bfbffe",
          "300": "#9397fd",
          "400": "#6062fa",
          "500": "#463bf6",
          "600": "#3e25eb",
          "700": "#3e1dd8",
          "800": "#3b1eaf",
          "900": "#311e8a",
          "950": "#241754",
        },
        cerise: {
          "50": "#fff0fa",
          "100": "#ffe3f8",
          "200": "#ffc7f1",
          "300": "#ff99e3",
          "400": "#ff5ace",
          "500": "#ff29b7",
          "600": "#ee028c", // dg brand
          "700": "#dd0077",
          "800": "#b60062",
          "900": "#970454",
          "950": "#5e002e",
        },
        "electric-violet": {
          "50": "#f5f0ff",
          "100": "#ede4ff",
          "200": "#ddcdff",
          "300": "#c5a6ff",
          "400": "#ab73ff",
          "500": "#953bff",
          "600": "#8d14ff",
          "700": "#7800ed", // dg brand
          "800": "#6d01d6",
          "900": "#5a03af",
          "950": "#370077",
        },
      },
      animation: {
        // Bounces 5 times 1s equals 5 seconds
        "ping-short": "ping 1s ease-in-out 5",
      },
      screens: {
        betterhover: { raw: "(hover: hover)" },
      },
      transitionProperty: {
        height: "height",
        width: "width",
      },
      dropShadow: {
        glowBlue: [
          "0px 0px 2px #000",
          "0px 0px 4px #000",
          "0px 0px 30px #0141ff",
          "0px 0px 100px #0141ff80",
        ],
        glowRed: [
          "0px 0px 2px #f00",
          "0px 0px 4px #000",
          "0px 0px 15px #ff000040",
          "0px 0px 30px #f00",
          "0px 0px 100px #ff000080",
        ],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        favorit: ["var(--font-favorit)"],
        inter: ["Inter", "Arial", "sans serif"],
      },
    },
  },
  plugins: [nextui()],
};
export default config;
