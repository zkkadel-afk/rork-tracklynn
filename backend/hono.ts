import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

// Add CORS middleware - permissive for development
app.use("*", cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-trpc-source'],
  exposeHeaders: ['Content-Type', 'Content-Length'],
  maxAge: 86400,
  credentials: false,
}));

// Additional OPTIONS handler for preflight requests
app.options('*', (c) => {
  c.status(204);
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, x-trpc-source');
  c.header('Access-Control-Max-Age', '86400');
  return c.body(null);
});

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
