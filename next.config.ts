import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const withSerwist = withSerwistInit({
  disable: process.env.NODE_ENV !== "production",
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
});

export default withSerwist(nextConfig);
