
import { Delivery, User } from './types';

export const mockUsers: User[] = [
  { id: 'M001', name: 'Carlos Silva', role: 'manager', pin: '1234' },
  { id: 'D001', name: 'João Motoboy', role: 'driver', pin: '1111' },
  { id: 'D002', name: 'Maria Entrega', role: 'driver', pin: '2222' },
];

export const mockDeliveries: Delivery[] = [
  {
    id: '1',
    packageId: 'PKG-1001',
    customerName: 'Ana Oliveira',
    address: 'Av. Paulista, 1000 - São Paulo, SP',
    status: 'pending',
  },
  {
    id: '2',
    packageId: 'PKG-1002',
    customerName: 'Bruno Santos',
    address: 'Rua Augusta, 500 - São Paulo, SP',
    status: 'in-transit',
    driverId: 'D001',
    driverName: 'João Motoboy',
    startTime: new Date(Date.now() - 50 * 60000).toISOString(), // 50 mins ago (should be delayed)
  },
  {
    id: '3',
    packageId: 'PKG-1003',
    customerName: 'Carla Lima',
    address: 'Al. Santos, 150 - São Paulo, SP',
    status: 'delivered',
    driverId: 'D002',
    driverName: 'Maria Entrega',
    startTime: new Date(Date.now() - 120 * 60000).toISOString(),
    endTime: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  {
    id: '4',
    packageId: 'PKG-1004',
    customerName: 'Diego Costa',
    address: 'Rua Oscar Freire, 200 - São Paulo, SP',
    status: 'pending',
  },
  {
    id: '5',
    packageId: 'PKG-1005',
    customerName: 'Elena Rocha',
    address: 'Av. Brigadeiro Faria Lima, 3000 - São Paulo, SP',
    status: 'in-transit',
    driverId: 'D001',
    driverName: 'João Motoboy',
    startTime: new Date(Date.now() - 20 * 60000).toISOString(), // 20 mins ago
  },
];
