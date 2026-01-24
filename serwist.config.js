// @ts-check
/** @type {import("@serwist/cli").SerwistConfig} */
export default {
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: "app-shell",
  globDirectory: "public",
  globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
};
