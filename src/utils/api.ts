// API utility for communicating with Supabase backend
import { projectId, publicAnonKey } from './supabase/info';
import type { ProcurementRequest } from '../data/mockData';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-1e4a32a5`;

// Helper function to make API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`API error calling ${endpoint}:`, data);
      throw new Error(data.error || `API call failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`Failed to call API endpoint ${endpoint}:`, error);
    throw error;
  }
}

// ========================================
// PROCUREMENT REQUESTS API
// ========================================

export const procurementRequestsAPI = {
  // Get all procurement requests
  getAll: async (): Promise<ProcurementRequest[]> => {
    const response = await apiCall('/procurement-requests');
    return response.data;
  },

  // Get single procurement request
  getOne: async (prNumber: string): Promise<ProcurementRequest> => {
    const response = await apiCall(`/procurement-requests/${prNumber}`);
    return response.data;
  },

  // Create or update a procurement request
  save: async (request: ProcurementRequest): Promise<ProcurementRequest> => {
    const response = await apiCall('/procurement-requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  },

  // Bulk update procurement requests
  bulkUpdate: async (requests: ProcurementRequest[]): Promise<ProcurementRequest[]> => {
    const response = await apiCall('/procurement-requests/bulk', {
      method: 'POST',
      body: JSON.stringify(requests),
    });
    return response.data;
  },

  // Delete a procurement request
  delete: async (prNumber: string): Promise<void> => {
    await apiCall(`/procurement-requests/${prNumber}`, {
      method: 'DELETE',
    });
  },
};

// ========================================
// VENDORS API
// ========================================

export const vendorsAPI = {
  // Get all vendors
  getAll: async (): Promise<any[]> => {
    const response = await apiCall('/vendors');
    return response.data;
  },

  // Get single vendor
  getOne: async (vendorCode: string): Promise<any> => {
    const response = await apiCall(`/vendors/${vendorCode}`);
    return response.data;
  },

  // Create or update a vendor
  save: async (vendor: any): Promise<any> => {
    const response = await apiCall('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendor),
    });
    return response.data;
  },

  // Delete a vendor
  delete: async (vendorCode: string): Promise<void> => {
    await apiCall(`/vendors/${vendorCode}`, {
      method: 'DELETE',
    });
  },
};

// ========================================
// ITEMS API
// ========================================

export const itemsAPI = {
  // Get all items
  getAll: async (): Promise<any[]> => {
    const response = await apiCall('/items');
    return response.data;
  },

  // Get single item
  getOne: async (itemCode: string): Promise<any> => {
    const response = await apiCall(`/items/${itemCode}`);
    return response.data;
  },

  // Create or update an item
  save: async (item: any): Promise<any> => {
    const response = await apiCall('/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return response.data;
  },

  // Delete an item
  delete: async (itemCode: string): Promise<void> => {
    await apiCall(`/items/${itemCode}`, {
      method: 'DELETE',
    });
  },
};

// ========================================
// PAYMENT METHODS API
// ========================================

export const paymentMethodsAPI = {
  // Get all payment methods
  getAll: async (): Promise<any[]> => {
    const response = await apiCall('/payment-methods');
    return response.data;
  },

  // Update payment methods
  save: async (paymentMethods: any[]): Promise<any[]> => {
    const response = await apiCall('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(paymentMethods),
    });
    return response.data;
  },
};

// ========================================
// INITIALIZATION API
// ========================================

export const initializeDatabase = async (data: {
  requests: ProcurementRequest[];
  vendors: any[];
  items: any[];
  paymentMethods: any[];
}): Promise<void> => {
  await apiCall('/initialize', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
