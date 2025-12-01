// Custom hook for managing configuration data (vendors, items, payment methods)
import { useState, useEffect } from 'react';
import { vendorsAPI, itemsAPI, paymentMethodsAPI } from '../utils/api';

export function useConfigData() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all configuration data
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [vendorsData, itemsData, paymentMethodsData] = await Promise.all([
        vendorsAPI.getAll(),
        itemsAPI.getAll(),
        paymentMethodsAPI.getAll(),
      ]);

      setVendors(vendorsData || []);
      setItems(itemsData || []);
      setPaymentMethods(paymentMethodsData || []);
    } catch (err) {
      console.error('Error loading configuration data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Vendor operations
  const saveVendor = async (vendor: any) => {
    try {
      const savedVendor = await vendorsAPI.save(vendor);
      
      // Update local state
      setVendors((prev) => {
        const index = prev.findIndex((v) => v.vendorCode === vendor.vendorCode);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = savedVendor;
          return updated;
        }
        return [...prev, savedVendor];
      });

      return savedVendor;
    } catch (err) {
      console.error('Error saving vendor:', err);
      throw err;
    }
  };

  const deleteVendor = async (vendorCode: string) => {
    try {
      await vendorsAPI.delete(vendorCode);
      
      // Update local state
      setVendors((prev) => prev.filter((v) => v.vendorCode !== vendorCode));
    } catch (err) {
      console.error('Error deleting vendor:', err);
      throw err;
    }
  };

  // Item operations
  const saveItem = async (item: any) => {
    try {
      const savedItem = await itemsAPI.save(item);
      
      // Update local state
      setItems((prev) => {
        const index = prev.findIndex((i) => i.itemCode === item.itemCode);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = savedItem;
          return updated;
        }
        return [...prev, savedItem];
      });

      return savedItem;
    } catch (err) {
      console.error('Error saving item:', err);
      throw err;
    }
  };

  const deleteItem = async (itemCode: string) => {
    try {
      await itemsAPI.delete(itemCode);
      
      // Update local state
      setItems((prev) => prev.filter((i) => i.itemCode !== itemCode));
    } catch (err) {
      console.error('Error deleting item:', err);
      throw err;
    }
  };

  // Payment methods operations
  const savePaymentMethods = async (methods: any[]) => {
    try {
      const savedMethods = await paymentMethodsAPI.save(methods);
      
      // Update local state
      setPaymentMethods(savedMethods);

      return savedMethods;
    } catch (err) {
      console.error('Error saving payment methods:', err);
      throw err;
    }
  };

  return {
    vendors,
    items,
    paymentMethods,
    isLoading,
    error,
    saveVendor,
    deleteVendor,
    saveItem,
    deleteItem,
    savePaymentMethods,
    refreshData: loadData,
  };
}
