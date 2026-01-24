import apiClient from './client';
import { API_ENDPOINTS } from '../config/api';

export interface TenantRegistration {
  name: string;
  phone_number: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  room: number;
  joining_date: string;
  id_proof_type?: string;
  id_proof_number?: string;
  father_name?: string;
  father_aadhar?: string;
  mother_name?: string;
  mother_aadhar?: string;
  guardian_name?: string;
  guardian_aadhar?: string;
  stay_type: string;
}

export const tenantAPI = {
  createTenant: async (data: TenantRegistration) => {
    const response = await apiClient.post(API_ENDPOINTS.TENANTS, data);
    return response.data;
  },

  getTenantDetails: async (id: number) => {
    const response = await apiClient.get(API_ENDPOINTS.TENANT_DETAIL(id));
    return response.data;
  },

  updateTenant: async (id: number, data: Partial<TenantRegistration>) => {
    const response = await apiClient.put(API_ENDPOINTS.TENANT_DETAIL(id), data);
    return response.data;
  },
};
