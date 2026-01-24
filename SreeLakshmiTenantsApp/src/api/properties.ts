import apiClient from './client';
import { API_ENDPOINTS } from '../config/api';

export interface Property {
  id: number;
  name: string;
  address: string;
  city: string;
  total_rooms: number;
  occupied_beds: number;
  vacant_beds: number;
}

export interface Room {
  id: number;
  room_name: string;
  sharing_type: number;
  sharing_type_display: string;
  branch: number;
  branch_name: string;
  rent: number;
  current_occupancy: number;
  is_full: boolean;
  status: string;
  attached_bath: boolean;
  ac_room: boolean;
}

export const propertyAPI = {
  listProperties: async (): Promise<Property[]> => {
    const response = await apiClient.get(API_ENDPOINTS.BRANCHES);
    return response.data;
  },

  getPropertyDetails: async (id: number): Promise<Property> => {
    const response = await apiClient.get(API_ENDPOINTS.BRANCH_DETAIL(id));
    return response.data;
  },

  listRooms: async (filters?: {
    branch?: number;
    status?: string;
  }): Promise<Room[]> => {
    const response = await apiClient.get(API_ENDPOINTS.ROOMS, { params: filters });
    return response.data;
  },

  getRoomDetails: async (id: number): Promise<Room> => {
    const response = await apiClient.get(API_ENDPOINTS.ROOM_DETAIL(id));
    return response.data;
  },
};
