import { trpcClient } from '@/lib/trpc';

export interface DistanceMatrixResult {
  distance: number;
  duration: number;
  formattedDistance: string;
  formattedDuration: string;
  success: boolean;
}

export interface GeocodeResult {
  cityState: string;
  success: boolean;
}

export async function zipToCityState(zipCode: string): Promise<GeocodeResult> {
  if (!zipCode || zipCode.toUpperCase() === 'N/A' || zipCode.trim() === '') {
    return {
      cityState: 'N/A',
      success: false,
    };
  }

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('[Geocoding] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not configured!');
    return {
      cityState: 'N/A',
      success: false,
    };
  }

  try {
    console.log(`[Geocoding] ═══════════════════════════════════════════════`);
    console.log(`[Geocoding] Converting zip code: ${zipCode}`);
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      zipCode + ', USA'
    )}&key=${apiKey}`;

    console.log(`[Geocoding] API key (masked): ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`[Geocoding] Full URL (masked): https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zipCode + ', USA')}&key=***`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log(`[Geocoding] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`[Geocoding] ❌ HTTP ERROR:`);
      console.error(`[Geocoding] Status: ${response.status} ${response.statusText}`);
      console.error(`[Geocoding] Response body:`, text.substring(0, 500));
      return {
        cityState: 'N/A',
        success: false,
      };
    }
    
    const data = await response.json();
    console.log(`[Geocoding] Response data:`, JSON.stringify(data, null, 2));

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.error(`[Geocoding] ❌ API STATUS ERROR:`);
      console.error(`[Geocoding] Status: ${data.status}`);
      console.error(`[Geocoding] Error message: ${data.error_message || 'No error message provided'}`);
      console.error(`[Geocoding] No results for zip: ${zipCode}`);
      return {
        cityState: 'N/A',
        success: false,
      };
    }

    const result = data.results[0];
    let city = '';
    let state = '';

    for (const component of result.address_components) {
      if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      if (!city && component.types.includes('locality')) {
        city = component.long_name;
      }
      if (!city && component.types.includes('postal_town')) {
        city = component.long_name;
      }
      if (!city && component.types.includes('sublocality')) {
        city = component.long_name;
      }
      if (!city && component.types.includes('administrative_area_level_3')) {
        city = component.long_name;
      }
    }

    if (city && state) {
      const cityState = `${city}, ${state}`;
      console.log(`[Geocoding] ✓ ${zipCode} → ${cityState}`);
      return {
        cityState,
        success: true,
      };
    }

    console.warn(`[Geocoding] Could not extract city/state from zip: ${zipCode}`);
    return {
      cityState: 'N/A',
      success: false,
    };
  } catch (error: any) {
    console.error(`[Geocoding] ❌ FETCH ERROR:`);
    console.error(`[Geocoding] Error type: ${error.constructor.name}`);
    console.error(`[Geocoding] Error message: ${error.message}`);
    console.error(`[Geocoding] Error stack:`, error.stack);
    console.error(`[Geocoding] Zip code: ${zipCode}`);
    console.error(`[Geocoding] ═══════════════════════════════════════════════`);
    return {
      cityState: 'N/A',
      success: false,
    };
  }
}

export async function batchZipToCityState(zipCodes: string[]): Promise<GeocodeResult[]> {
  console.log(`[Geocoding] Converting ${zipCodes.length} zip codes to city/state...`);
  
  const chunkSize = 5;
  const results: GeocodeResult[] = [];
  
  for (let i = 0; i < zipCodes.length; i += chunkSize) {
    const chunk = zipCodes.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (zipCode) => {
        const result = await zipToCityState(zipCode);
        return result;
      })
    );
    results.push(...chunkResults);
    if (i + chunkSize < zipCodes.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`[Geocoding] Successfully converted ${successCount}/${zipCodes.length} zip codes`);

  return results;
}

export async function getDistanceAndDuration(
  origin: string,
  destination: string
): Promise<DistanceMatrixResult> {
  if (origin.toUpperCase() === 'N/A' || destination.toUpperCase() === 'N/A') {
    return {
      distance: 0,
      duration: 0,
      formattedDistance: 'N/A',
      formattedDuration: 'N/A',
      success: false,
    };
  }

  try {
    console.log(`[Google Maps] Calculating route: ${origin} → ${destination}`);
    
    const result = await trpcClient.maps.getDistance.mutate({
      origin,
      destination,
    });
    
    console.log(`[Google Maps] ✓ ${result.distance} miles, ${result.duration.toFixed(1)} hours`);
    
    return result;
  } catch (error: any) {
    console.error(`[Google Maps] ❌ ERROR:`);
    console.error(`[Google Maps] Error message: ${error.message}`);
    console.error(`[Google Maps] Route: ${origin} -> ${destination}`);
    
    return {
      distance: 0,
      duration: 0,
      formattedDistance: 'Error',
      formattedDuration: 'Error',
      success: false,
    };
  }
}

export async function getBatchDistances(
  routes: { origin: string; destination: string }[]
): Promise<DistanceMatrixResult[]> {
  console.log(`Fetching distances for ${routes.length} routes...`);
  
  // Process in smaller chunks to avoid overwhelming the server/network
  const chunkSize = 5;
  const results: DistanceMatrixResult[] = [];
  
  for (let i = 0; i < routes.length; i += chunkSize) {
    const chunk = routes.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async ({ origin, destination }) => {
        const result = await getDistanceAndDuration(origin, destination);
        return result;
      })
    );
    results.push(...chunkResults);
    // Small delay between chunks
    if (i + chunkSize < routes.length) {
       await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`Successfully fetched ${successCount}/${routes.length} distances`);

  return results;
}
