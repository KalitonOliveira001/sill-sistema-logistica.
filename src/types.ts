
export type Language = 'pt' | 'en';

export type UserRole = 'manager' | 'driver' | 'customer';

export type DeliveryStatus = 'pending' | 'in-transit' | 'delivered' | 'delayed';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
}

export interface Delivery {
  id: string;
  packageId: string;
  customerName: string;
  address: string;
  status: DeliveryStatus;
  driverId?: string;
  driverName?: string;
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  photoProof?: string; // base64 or placeholder
  location?: {
    lat: number;
    lng: number;
  };
}
