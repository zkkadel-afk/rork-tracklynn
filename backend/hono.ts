import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

// Add CORS middleware
app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-trpc-source', 'trpc-accept'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: false,
}));

// Match the client's URL structure: /api/trpc
// IMPORTANT: This must match what is defined in lib/trpc.ts
app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

// Fallback for /trpc/* just in case (legacy)
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

// Health check endpoint (REST)
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
