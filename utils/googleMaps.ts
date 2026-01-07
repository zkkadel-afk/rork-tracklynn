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
      cityState: zipCode,
      success: false,
    };
  }

  try {
    console.log(`[Geocoding] Converting zip code: ${zipCode}`);
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      zipCode + ', USA'
    )}&key=${apiKey}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`[Geocoding] HTTP error! status: ${response.status}`);
      return {
        cityState: zipCode,
        success: false,
      };
    }
    
    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.warn(`[Geocoding] No results for zip: ${zipCode}`);
      return {
        cityState: zipCode,
        success: false,
      };
    }

    const result = data.results[0];
    let city = '';
    let state = '';

    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name;
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
      cityState: zipCode,
      success: false,
    };
  } catch (error: any) {
    console.error(`[Geocoding] Error for ${zipCode}:`, error.message);
    return {
      cityState: zipCode,
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
  
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('[Google Maps] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not configured!');
    return {
      distance: 0,
      duration: 0,
      formattedDistance: 'Config Error',
      formattedDuration: 'Config Error',
      success: false,
    };
  }

  try {
    console.log(`[Google Maps] Calculating route: ${origin} → ${destination}`);
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(
      destination
    )}&units=imperial&mode=driving&key=${apiKey}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`[Google Maps] HTTP error! status: ${response.status}`);
      return {
        distance: 0,
        duration: 0,
        formattedDistance: 'Error',
        formattedDuration: 'Error',
        success: false,
      };
    }
    
    const data = await response.json();

    if (data.status !== "OK") {
      console.error(`[Google Maps] API error: ${data.status} - ${data.error_message || 'No error message'}`);
      return {
        distance: 0,
        duration: 0,
        formattedDistance: 'Error',
        formattedDuration: 'Error',
        success: false,
      };
    }

    const element = data.rows[0]?.elements[0];

    if (!element || element.status !== "OK") {
      console.log(`[Google Maps] Route not found: ${element?.status} for ${origin} -> ${destination}`);
      
      if (element?.status === 'NOT_FOUND' || element?.status === 'ZERO_RESULTS') {
        return {
          distance: 0,
          duration: 0,
          formattedDistance: 'N/A',
          formattedDuration: 'N/A',
          success: false,
        };
      }
      
      return {
        distance: 0,
        duration: 0,
        formattedDistance: 'Error',
        formattedDuration: 'Error',
        success: false,
      };
    }

    const distanceInMiles = Math.round(element.distance.value * 0.000621371);
    const durationInHours = element.duration.value / 3600;

    console.log(`[Google Maps] ✓ ${distanceInMiles} miles, ${durationInHours.toFixed(1)} hours`);

    return {
      distance: distanceInMiles,
      duration: durationInHours,
      formattedDistance: element.distance.text,
      formattedDuration: element.duration.text,
      success: true,
    };
  } catch (error: any) {
    console.error(`[Google Maps] Error for ${origin} -> ${destination}:`, error.message);
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
