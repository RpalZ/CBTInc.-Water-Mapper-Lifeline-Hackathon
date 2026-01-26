import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst } from "serwist";

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
        handler: new CacheFirst({
            cacheName: "map-tiles",
            plugins: [
                {
                    handlerDidError: async () => new Response('Not found', { status: 404 }),
                },
            ],
        }),
    },
    ...defaultCache
  ],
});

serwist.addEventListeners();