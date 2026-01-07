import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { mapsRouter } from "./routes/maps";
import { healthRouter } from "./routes/health";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  maps: mapsRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
