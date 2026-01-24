import { Serwist } from "@serwist/next/worker";

new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // Additional Serwist configuration can be added here
});
