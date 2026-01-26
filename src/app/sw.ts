import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
        // Cache the .pmtiles map file
        matcher: ({ url }) => url.pathname.endsWith('.pmtiles'),
        handler: "CacheFirst",
        options: {
            cacheName: "map-tiles",
            expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
            rangeRequests: true, // IMPORTANT for PMTiles (range requests)
        },
    },
    ...defaultCache
  ],
});

serwist.addEventListeners();