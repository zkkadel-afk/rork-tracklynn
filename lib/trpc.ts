import { httpLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    console.error("EXPO_PUBLIC_RORK_API_BASE_URL is not set!");
    // Return a dummy URL to prevent immediate crash, but it will fail network requests
    return "http://localhost:3000";
  }

  return url;
};

export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" ||
        (opts.direction === "down" && opts.result instanceof Error),
      console: console,
      // Custom logger to avoid [object Object] in logs
      logger: (opts) => {
        const { direction, input, path, id } = opts;
        
        if (direction === 'up') {
          console.log(`>> mutation #${id} ${path}`, input);
        } else {
          const { result, elapsedMs } = opts;
          const duration = elapsedMs.toFixed(1);
          if (result instanceof Error) {
            console.error(`<< mutation #${id} ${path} failed in ${duration}ms`, result);
          } else {
            console.log(`<< mutation #${id} ${path} succeeded in ${duration}ms`);
          }
        }
      }
    }),
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
