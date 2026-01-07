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
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
          input.origin
        )}&destinations=${encodeURIComponent(
          input.destination
        )}&units=imperial&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

        console.log(
          `[Maps API] Fetching distance: ${input.origin} → ${input.destination}`
        );
        // Log masked key for debugging
        console.log(`[Maps API] Using API key: ${GOOGLE_MAPS_API_KEY.substring(0, 5)}...${GOOGLE_MAPS_API_KEY.substring(GOOGLE_MAPS_API_KEY.length - 4)}`);

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          const text = await response.text();
          console.error(`[Maps API] HTTP error! status: ${response.status}`, text.substring(0, 200));
          throw new Error(`Google Maps API HTTP ${response.status}`);
        }
        
        const data = await response.json();

        if (data.status !== "OK") {
          console.error(
            `[Maps API] API error: ${data.status} - ${data.error_message || 'No error message'}`
          );
          throw new Error(`Google Maps API error: ${data.status}`);
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
        console.error("[Maps API] Error fetching distance:", error.message);
        throw error;
      }
    }),
});
