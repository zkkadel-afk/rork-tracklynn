export interface ShipmentData {
  bol: string;
  customer: string;
  lastCallinCity: string;
  brokerageStatus: string;
  originZip: string;
  destZip: string;
  reeferTemp?: string;
}

export interface ProcessedShipment {
  poNumber: string;
  customer: string;
  currentLocation: string;
  destination: string;
  destinationType: 'shipper' | 'receiver';
  eta: string;
  distance: number;
  travelTime: number;
  status: string;
  reeferTemp?: string;
}

export interface CustomerGroup {
  customer: string;
  shipments: ProcessedShipment[];
}

export interface ExtractedData {
  shipments: ShipmentData[];
}
