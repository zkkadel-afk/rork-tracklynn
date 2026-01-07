import { z } from 'zod';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { ShipmentData, ProcessedShipment, CustomerGroup } from '@/types/shipment';
import { getBatchDistances, batchZipToCityState } from '@/utils/googleMaps';

const ShipmentSchema = z.object({
  shipments: z.array(
    z.object({
      bol: z.string().describe('The BOL/PO number'),
      customer: z.string().describe('The customer name'),
      lastCallinCity: z.string().describe('The last call-in city (current location)'),
      brokerageStatus: z.string().describe('The brokerage status (COVRD, DISPATCH, IN-TRANS, DLVD, etc.)'),
      originZip: z.string().describe('The origin/shipper zip code'),
      destZip: z.string().describe('The destination/receiver zip code'),
      reeferTemp: z.string().optional().describe('The min temp/reefer temperature requirement - LEAVE EMPTY if cell is blank/empty'),
    })
  ),
});

export async function extractShipmentData(base64Image: string): Promise<ShipmentData[]> {
  console.log('Starting shipment data extraction from image...');
  
  const result = await generateObject({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: `data:image/png;base64,${base64Image}`,
          },
          {
            type: 'text',
            text: `You are analyzing a TMS (Transportation Management System) screenshot showing a table of shipment data.

CRITICAL INSTRUCTIONS:
1. Process the table ONE ROW AT A TIME - each row is a separate shipment
2. NEVER mix data from adjacent rows - align each data field to its correct row
3. Extract ALL visible rows in the screenshot (there may be 20-30+ rows)
4. Read column headers carefully as they may be abbreviated

COLUMN MAPPING (headers may vary slightly):
- "BOL" → Extract as the bol/PO number (e.g., "919628907", "H0752257"). If the cell is EMPTY or contains only the customer name, use "N/A"
- "Customer" → Full customer name (e.g., "VITAAUTX - Vital Farms", "WORLDCT - World Class Distribution Hartford")
- "Brokerage status" OR "Brokerage" → Status value (COVRD, DISPATCH, IN-TRANS, DLVD, Accepted, etc.)
- "Last callin city" → Current truck location - city name, may include state (e.g., "South Amboy, NJ", "BLOOMFIELD, CT"). If empty or unclear, use "N/A"
- "Origin zip" → Shipper zip code (e.g., "65802", "97070")
- "Dest zip" → Receiver zip code (e.g., "08832", "06002")
- "Min temp" OR "min temp" → Reefer temperature requirement (e.g., "34F", "-10F") - ONLY extract if cell has a value. If cell is BLANK/EMPTY, leave this field empty (not "N/A" or any default value)

STEP BY STEP PROCESS:
1. Identify the header row to understand column positions
2. For each data row, carefully extract values column by column
3. Ensure each value belongs to the SAME horizontal line
4. Double-check you haven't skipped any rows
5. If a cell is empty or unclear, use "N/A" for that field only

EXAMPLE from image:
Row with BOL "919628907" should extract:
- bol: "919628907"
- customer: "VITAAUTX - Vital Farms"
- brokerageStatus: "IN-TRANS" (or whatever status is in that row)
- lastCallinCity: "South Amboy, NJ" (or the location in that row, or "N/A" if empty)
- originZip: "65802" (or whatever zip is in that row)
- destZip: "08832" (or whatever zip is in that row)
- reeferTemp: "34F" (or whatever min temp is in that row, LEAVE EMPTY/BLANK if the cell is empty - do not infer or add any value)

Extract ALL shipments visible in the table. Be thorough and accurate.`,
          },
        ],
      },
    ],
    schema: ShipmentSchema,
  });

  console.log('Extracted shipments:', result.shipments.length);
  return result.shipments;
}



function formatETA(
  distanceMiles: number,
  destinationType: 'shipper' | 'receiver',
  currentLocation: string,
  status: string
): string {
  if (status.toUpperCase() === 'DLVD') {
    return 'Delivered';
  }
  
  if (currentLocation.toUpperCase() === 'N/A') {
    return 'N/A';
  }
  
  if (distanceMiles === 1) {
    return `1 mile from the ${destinationType}`;
  }
  return `${distanceMiles} miles from the ${destinationType}`;
}

function cleanCustomerName(customerName: string): string {
  const dashIndex = customerName.indexOf('-');
  let cleanName = customerName.trim();
  if (dashIndex !== -1) {
    cleanName = customerName.substring(dashIndex + 1).trim();
  }
  
  // Normalize World Class Distribution variations to single customer
  if (cleanName.toLowerCase().includes('world class distribution')) {
    return 'World Class Distribution';
  }
  
  return cleanName;
}

export async function processShipments(rawShipments: ShipmentData[]): Promise<ProcessedShipment[]> {
  console.log('Processing shipments with Google Maps data...');
  
  // Step 1: Collect all unique zip codes
  const uniqueZips = new Set<string>();
  rawShipments.forEach((shipment) => {
    if (shipment.originZip && shipment.originZip.trim() && shipment.originZip.toUpperCase() !== 'N/A') {
      uniqueZips.add(shipment.originZip);
    }
    if (shipment.destZip && shipment.destZip.trim() && shipment.destZip.toUpperCase() !== 'N/A') {
      uniqueZips.add(shipment.destZip);
    }
  });
  
  // Step 2: Convert all zip codes to city/state format
  const zipArray = Array.from(uniqueZips);
  const geocodeResults = await batchZipToCityState(zipArray);
  
  // Create a map for quick lookup
  const zipToCityStateMap = new Map<string, string>();
  zipArray.forEach((zip, index) => {
    zipToCityStateMap.set(zip, geocodeResults[index].cityState);
  });
  
  // Step 3: Build routes using city/state instead of zip codes
  const routes = rawShipments.map((shipment) => {
    const status = shipment.brokerageStatus.toUpperCase();
    const isGoingToShipper = status === 'COVRD' || status === 'DISPATCH';
    
    const destinationZip = isGoingToShipper
      ? shipment.originZip
      : shipment.destZip;
    
    // Convert zip to city/state or use N/A if conversion failed
    let destination = zipToCityStateMap.get(destinationZip) || 'N/A';
    let currentLocation = shipment.lastCallinCity || 'N/A';
    
    // Ensure we don't send empty strings to the map API
    if (!destination || destination.trim() === '') destination = 'N/A';
    if (!currentLocation || currentLocation.trim() === '') currentLocation = 'N/A';
    
    return { origin: currentLocation, destination };
  });

  const distanceResults = await getBatchDistances(routes);
  
  return rawShipments.map((shipment, index) => {
    const status = shipment.brokerageStatus.toUpperCase();
    const isGoingToShipper = status === 'COVRD' || status === 'DISPATCH';
    const destinationType = isGoingToShipper ? 'shipper' : 'receiver';
    
    const destinationZip = isGoingToShipper
      ? shipment.originZip
      : shipment.destZip;
    
    // Use city/state format instead of zip code, fall back to zip if geocoding failed
    let destination = zipToCityStateMap.get(destinationZip) || destinationZip;
    if (!destination || destination.trim() === '' || destination.toUpperCase() === 'N/A') {
      destination = destinationZip;
    }

    const currentLocation = shipment.lastCallinCity || 'N/A';
    const distanceData = distanceResults[index];
    
    const distance = distanceData.success ? distanceData.distance : 0;
    const travelTime = distanceData.success ? distanceData.duration : 0;
    
    let eta = 'ETA Unavailable';
    
    if (distanceData.success) {
      eta = formatETA(distanceData.distance, destinationType, currentLocation, status);
    } else if (status === 'DLVD') {
      eta = 'Delivered';
    } else if (distanceData.formattedDistance === 'N/A') {
       // Should match the case where origin/dest was N/A
       eta = 'N/A';
    }

    const bol = shipment.bol && shipment.bol.trim() && shipment.bol.toUpperCase() !== 'N/A' ? shipment.bol : 'N/A';
    const cleanedCustomer = cleanCustomerName(shipment.customer);
    
    // If BOL matches the customer name, treat it as N/A
    const poNumber = bol !== 'N/A' && !bol.toLowerCase().includes(cleanedCustomer.toLowerCase()) ? bol : 'N/A';
    
    return {
      poNumber,
      customer: cleanedCustomer,
      currentLocation,
      destination,
      destinationType,
      eta,
      distance,
      travelTime,
      status: shipment.brokerageStatus,
      reeferTemp: shipment.reeferTemp,
    };
  });
}

export function groupByCustomer(shipments: ProcessedShipment[]): CustomerGroup[] {
  console.log('Grouping shipments by customer...');
  
  const groups: Record<string, ProcessedShipment[]> = {};

  shipments.forEach((shipment) => {
    const customer = shipment.customer || 'Unknown';
    if (!groups[customer]) {
      groups[customer] = [];
    }
    groups[customer].push(shipment);
  });

  return Object.entries(groups).map(([customer, shipments]) => ({
    customer,
    shipments,
  }));
}
