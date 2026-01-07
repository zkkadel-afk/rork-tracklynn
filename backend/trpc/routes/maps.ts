import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { Surreal } from "surrealdb";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const db = new Surreal();
let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;
  
  try {
    await db.connect(process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT!);
    await db.signin({
      namespace: process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE!,
      database: process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE!,
      access: 'account',
      variables: {
        token: process.env.EXPO_PUBLIC_RORK_DB_TOKEN!,
      },
    });
    await db.use({
      namespace: process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE!,
      database: process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE!,
    });
    dbInitialized = true;
    console.log('[Maps Cache] Database initialized');
  } catch (error) {
    console.error('[Maps Cache] Failed to initialize database:', error);
  }
}

function createCacheKey(origin: string, destination: string): string {
  const normalized = [origin.toLowerCase().trim(), destination.toLowerCase().trim()].sort();
  return `${normalized[0]}::${normalized[1]}`;
}

interface CachedDistance {
  id?: string;
  cacheKey: string;
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  formattedDistance: string;
  formattedDuration: string;
  createdAt: string;
}

export const mapsRouter = createTRPCRouter({
  getDistance: publicProcedure
    .input(
      z.object({
        origin: z.string(),
        destination: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (!GOOGLE_MAPS_API_KEY) {
        console.error("Google Maps API key not configured");
        throw new Error("Google Maps API key not configured");
      }

      await initDB();
      const cacheKey = createCacheKey(input.origin, input.destination);

      try {
        const cached = await db.query<[CachedDistance[]]>(
          'SELECT * FROM distance_cache WHERE cacheKey = $cacheKey LIMIT 1',
          { cacheKey }
        );

        if (cached?.[0]?.[0]) {
          const result = cached[0][0];
          console.log(`[Maps Cache] ✓ Cache hit: ${input.origin} → ${input.destination} (${result.distance} miles)`);
          return {
            distance: result.distance,
            duration: result.duration,
            formattedDistance: result.formattedDistance,
            formattedDuration: result.formattedDuration,
            success: true,
          };
        }

        console.log(`[Maps Cache] Cache miss, calling Google Maps API...`);
      } catch (cacheError) {
        console.error('[Maps Cache] Error checking cache:', cacheError);
      }

      try {
        const encodedOrigin = encodeURIComponent(input.origin);
        const encodedDestination = encodeURIComponent(input.destination);
        
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodedOrigin}&destinations=${encodedDestination}&units=imperial&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

        console.log(`[Maps API] ═══════════════════════════════════════════════`);
        console.log(`[Maps API] Fetching distance: ${input.origin} → ${input.destination}`);
        console.log(`[Maps API] Encoded origin: ${encodedOrigin}`);
        console.log(`[Maps API] Encoded destination: ${encodedDestination}`);
        console.log(`[Maps API] API key (masked): ${GOOGLE_MAPS_API_KEY.substring(0, 8)}...${GOOGLE_MAPS_API_KEY.substring(GOOGLE_MAPS_API_KEY.length - 4)}`);
        console.log(`[Maps API] Full URL (masked): https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodedOrigin}&destinations=${encodedDestination}&units=imperial&mode=driving&key=***`);

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        console.log(`[Maps API] Response status: ${response.status} ${response.statusText}`);
        console.log(`[Maps API] Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const text = await response.text();
          console.error(`[Maps API] ❌ HTTP ERROR:`);
          console.error(`[Maps API] Status: ${response.status} ${response.statusText}`);
          console.error(`[Maps API] Response body:`, text.substring(0, 500));
          throw new Error(`Google Maps API HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`[Maps API] Response data:`, JSON.stringify(data, null, 2));

        if (data.status !== "OK") {
          console.error(`[Maps API] ❌ API STATUS ERROR:`);
          console.error(`[Maps API] Status: ${data.status}`);
          console.error(`[Maps API] Error message: ${data.error_message || 'No error message provided'}`);
          console.error(`[Maps API] Full response:`, JSON.stringify(data, null, 2));
          throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'No details'}`);
        }

        const element = data.rows[0]?.elements[0];

        if (!element || element.status !== "OK") {
          console.log(`[Maps API] Route not found or issue: ${element?.status} for ${input.origin} -> ${input.destination}`);
          
          if (element?.status === 'NOT_FOUND' || element?.status === 'ZERO_RESULTS') {
             return {
                distance: 0,
                duration: 0,
                formattedDistance: 'N/A',
                formattedDuration: 'N/A',
                success: false,
             };
          }
          
          throw new Error(`No route found. Status: ${element?.status || 'UNKNOWN'}`);
        }

        const distanceInMiles = Math.round(
          element.distance.value * 0.000621371
        );
        const durationInHours = element.duration.value / 3600;

        console.log(
          `[Maps API] ✓ Distance: ${distanceInMiles} miles, Duration: ${durationInHours.toFixed(1)} hours`
        );

        const result = {
          distance: distanceInMiles,
          duration: durationInHours,
          formattedDistance: element.distance.text,
          formattedDuration: element.duration.text,
          success: true,
        };

        try {
          await db.create('distance_cache', {
            cacheKey,
            origin: input.origin,
            destination: input.destination,
            distance: distanceInMiles,
            duration: durationInHours,
            formattedDistance: element.distance.text,
            formattedDuration: element.duration.text,
            createdAt: new Date().toISOString(),
          });
          console.log(`[Maps Cache] ✓ Cached result for ${input.origin} → ${input.destination}`);
        } catch (cacheError) {
          console.error('[Maps Cache] Failed to cache result:', cacheError);
        }

        return result;
      } catch (error: any) {
        console.error(`[Maps API] ❌ FETCH ERROR:`);
        console.error(`[Maps API] Error type: ${error.constructor.name}`);
        console.error(`[Maps API] Error message: ${error.message}`);
        console.error(`[Maps API] Error stack:`, error.stack);
        console.error(`[Maps API] Full error object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error(`[Maps API] ═══════════════════════════════════════════════`);
        throw error;
      }
    }),
});
