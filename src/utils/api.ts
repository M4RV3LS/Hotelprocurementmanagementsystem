// src/utils/api.ts
import { createClient } from "@jsr/supabase__supabase-js";
import { projectId, publicAnonKey } from "./supabase/info";
import type {
  ProcurementRequest,
  ProcurementItem,
} from "../data/mockData";

// Initialize Supabase Client
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);

// ========================================
// HELPERS: Data Mapping (DB <-> Frontend)
// ========================================

// 1. Helper to determine region (Fix for Requirement #4)
const determineRegion = (row: any): string => {
  if (row.region) return row.region;

  // Fallback logic if region is empty in DB
  const address = (row.property_address || "").toLowerCase();
  if (address.includes("jakarta")) return "DKI Jakarta";
  if (address.includes("bali")) return "Bali";
  if (address.includes("bandung")) return "Jawa Barat";
  if (address.includes("surabaya")) return "Jawa Timur";
  if (address.includes("yogya"))
    return "Daerah Istimewa Yogyakarta";
  if (address.includes("medan")) return "Sumatera Utara";
  return "DKI Jakarta"; // Default fallback
};

// 2. Updated Mapper
const mapDBRequestToFrontend = (
  row: any,
): ProcurementRequest => {
  const region = determineRegion(row);

  return {
    prNumber: row.pr_number,
    prDate: row.pr_date,
    propertyName: row.property_name,
    propertyCode: row.property_code,
    propertyType: "Hotel",
    brandName: "RedDoorz",
    propertyAddress: row.property_address || "",
    picName: row.pic_name || "",
    picNumber: row.pic_number || "",
    requestorName: row.requestor_name,
    requestorEmail: row.requestor_email,
    status: row.status,
    items: (row.request_items || []).map((item: any) => ({
      id: item.id,
      prNumber: row.pr_number,
      itemCode: item.master_items?.code || "UNKNOWN",
      // Fix: Use raw name, don't append properties
      itemName:
        item.master_items?.name || item.item_name_snapshot,
      itemCategory: item.master_items?.category || "Ops Item",
      selectedProperties: {}, // CLEARED (Requirement #1)
      quantity: item.quantity,
      uom: item.uom,
      region: region, // Fix: Use derived region
      itemStatus: item.item_status || "Not Set",
      status: item.status,
      vendorName: item.vendors?.name,
      vendorCode: item.vendors?.code,
      paymentTerms: item.payment_terms,
      unitPrice: item.unit_price,
      taxPercentage: item.tax_percentage || 11, // Ensure tax exists
      totalPrice: item.total_price,
      poNumber: item.po_number,
      poDate: item.po_date,
      estimatedDeliveryStart: item.estimated_delivery_start,
      estimatedDeliveryEnd: item.estimated_delivery_end,
    })),
    activityLog: (row.activity_logs || []).map((log: any) => ({
      id: log.id,
      timestamp: log.timestamp,
      user: log.user_email,
      action: log.action,
      details: log.details,
    })),
  };
};

// ========================================
// PROCUREMENT REQUESTS API
// ========================================

export const procurementRequestsAPI = {
  getAll: async (): Promise<ProcurementRequest[]> => {
    const { data, error } = await supabase
      .from("procurement_requests")
      .select(
        `
        *,
        request_items (
          *,
          master_items (code, category), 
          vendors (name, code)
        ),
        activity_logs (*)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(mapDBRequestToFrontend);
  },

  save: async (
    request: ProcurementRequest,
  ): Promise<ProcurementRequest> => {
    // 1. Upsert Header
    // Derive region from the first item if available, or default
    const derivedRegion =
      request.items[0]?.region || "DKI Jakarta";

    const { data: prData, error: prError } = await supabase
      .from("procurement_requests")
      .upsert(
        {
          pr_number: request.prNumber,
          pr_date: request.prDate,
          property_name: request.propertyName,
          property_code: request.propertyCode,
          property_address: request.propertyAddress,
          region: derivedRegion, // Save Region
          requestor_name: request.requestorName,
          requestor_email: request.requestorEmail,
          pic_name: request.picName,
          pic_number: request.picNumber,
          status: request.status,
        },
        { onConflict: "pr_number" },
      )
      .select()
      .single();

    if (prError) throw prError;

    // 2. Upsert Items
    const prId = prData.id;

    const itemsToUpsert = request.items.map((item) => ({
      request_id: prId,
      id:
        item.id.includes("-") && item.id.length < 36
          ? undefined
          : item.id,
      item_name_snapshot: item.itemName,
      status: item.status,
      item_status: item.itemStatus,
      quantity: item.quantity,
      uom: item.uom,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      po_number: item.poNumber,
      po_date: item.poDate ? new Date(item.poDate) : null,
      estimated_delivery_start: item.estimatedDeliveryStart,
      estimated_delivery_end: item.estimatedDeliveryEnd,
      // Note: assigned_vendor_id updating requires fetching vendor UUID first in a real scenario
    }));

    if (itemsToUpsert.length > 0) {
      const { error: itemsError } = await supabase
        .from("request_items")
        .upsert(itemsToUpsert);

      if (itemsError)
        console.error("Error saving items:", itemsError);
    }

    return request;
  },

  bulkUpdate: async (
    requests: ProcurementRequest[],
  ): Promise<ProcurementRequest[]> => {
    for (const req of requests) {
      await procurementRequestsAPI.save(req);
    }
    return requests;
  },

  delete: async (prNumber: string): Promise<void> => {
    const { error } = await supabase
      .from("procurement_requests")
      .delete()
      .eq("pr_number", prNumber);
    if (error) throw error;
  },
};

// ========================================
// VENDORS API
// ========================================

export const vendorsAPI = {
  getAll: async (): Promise<any[]> => {
    const { data, error } = await supabase.from("vendors")
      .select(`
        *,
        items:vendor_catalog_items (
          *,
          master_item:master_items (*)
        )
      `);

    if (error) throw error;

    return data.map((v) => ({
      vendorCode: v.code,
      vendorName: v.name,
      vendorRegion: v.region,
      vendorAddress: v.address,
      vendorEmail: v.email,
      vendorPhone: v.phone,
      // Mapped for PO Modal (Requirement #2c)
      contact_person: v.contact_person,
      // Fallback for UI if it expects picName
      picName: v.contact_person,
      ppnPercentage: v.ppn_percentage,
      paymentMethods: v.payment_methods,
      isActive: v.is_active,
      items: v.items.map((vi: any) => ({
        itemCode: vi.master_item?.code,
        itemName: vi.master_item?.name,
        priceType: vi.price_type,
        unitPrice: vi.unit_price,
        minQuantity: vi.min_quantity,
        taxPercentage: 11,
      })),
    }));
  },

  save: async (vendor: any): Promise<any> => {
    const { data, error } = await supabase
      .from("vendors")
      .upsert(
        {
          code: vendor.vendorCode,
          name: vendor.vendorName,
          region: vendor.vendorRegion,
          address: vendor.vendorAddress,
          email: vendor.vendorEmail,
          phone: vendor.vendorPhone,
          contact_person:
            vendor.picName || vendor.contact_person, // Save PIC
          payment_methods: vendor.paymentMethods,
          ppn_percentage: vendor.ppnPercentage,
          is_active: vendor.isActive,
        },
        { onConflict: "code" },
      )
      .select()
      .single();

    if (error) throw error;
    return vendor;
  },

  delete: async (vendorCode: string): Promise<void> => {
    const { error } = await supabase
      .from("vendors")
      .delete()
      .eq("code", vendorCode);
    if (error) throw error;
  },
};

// ========================================
// ITEMS API
// ========================================

export const itemsAPI = {
  getAll: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from("master_items")
      .select("*");

    if (error) throw error;

    return data.map((i) => ({
      itemCode: i.code,
      itemName: i.name,
      brandName: i.brand_name,
      itemCategory: i.category,
      uom: i.uom,
      properties: [], // CLEARED (Requirement #1)
      isActive: i.is_active,
    }));
  },

  save: async (item: any): Promise<any> => {
    const { data, error } = await supabase
      .from("master_items")
      .upsert(
        {
          code: item.itemCode,
          name: item.itemName,
          brand_name: item.brandName,
          category: item.itemCategory,
          uom: item.uom,
          // properties: Removed (Requirement #1)
          is_active: item.isActive,
        },
        { onConflict: "code" },
      )
      .select()
      .single();

    if (error) throw error;
    return item;
  },

  delete: async (itemCode: string): Promise<void> => {
    const { error } = await supabase
      .from("master_items")
      .delete()
      .eq("code", itemCode);
    if (error) throw error;
  },
};

// ========================================
// PAYMENT METHODS API
// ========================================

export const paymentMethodsAPI = {
  getAll: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("name");

    if (error) {
      console.warn(
        "Payment methods table might not exist, returning empty",
      );
      return [];
    }

    return data.map((pm) => ({
      id: pm.id,
      name: pm.name,
      isActive: pm.is_active,
    }));
  },

  save: async (paymentMethods: any[]): Promise<any[]> => {
    const { data, error } = await supabase
      .from("payment_methods")
      .upsert(
        paymentMethods.map((pm) => ({
          name: pm.name,
          is_active: pm.isActive,
        })),
        { onConflict: "name" },
      )
      .select();

    if (error) throw error;
    return paymentMethods;
  },
};

// ========================================
// DATABASE SEEDING / INITIALIZATION
// ========================================

export const initializeDatabase = async (data: {
  requests: ProcurementRequest[];
  vendors: any[];
  items: any[];
  paymentMethods: any[];
}): Promise<void> => {
  console.log("Starting Relational Database Seeding...");

  try {
    // 1. SEED PAYMENT METHODS
    if (data.paymentMethods?.length) {
      await supabase.from("payment_methods").upsert(
        data.paymentMethods.map((pm) => ({
          name: pm.name,
          is_active: pm.isActive,
        })),
        { onConflict: "name" },
      );
    }

    // 2. SEED MASTER ITEMS
    console.log("Seeding Master Items...");
    const itemMap = new Map<string, string>();

    if (data.items?.length) {
      const { data: insertedItems, error } = await supabase
        .from("master_items")
        .upsert(
          data.items.map((item) => ({
            code: item.itemCode,
            name: item.itemName,
            brand_name: item.brandName,
            category: item.itemCategory,
            uom: item.uom,
            // properties: Removed (Requirement #1)
            is_active: item.isActive,
          })),
          { onConflict: "code" },
        )
        .select("code, id");

      if (error)
        throw new Error(`Master Items Error: ${error.message}`);
      insertedItems?.forEach((i) => itemMap.set(i.code, i.id));
    }

    // 3. SEED VENDORS
    console.log("Seeding Vendors...");
    const vendorMap = new Map<string, string>();

    if (data.vendors?.length) {
      const vendorsToInsert = data.vendors.map((v) => ({
        code: v.vendorCode,
        name: v.vendorName,
        region: v.vendorRegion,
        address: v.vendorAddress,
        email: v.vendorEmail,
        phone: v.vendorPhone,
        payment_methods: v.paymentMethods,
        ppn_percentage: v.ppnPercentage,
        is_active: v.isActive,
      }));

      const { data: insertedVendors, error } = await supabase
        .from("vendors")
        .upsert(vendorsToInsert, { onConflict: "code" })
        .select("code, id");

      if (error)
        throw new Error(`Vendors Error: ${error.message}`);
      insertedVendors?.forEach((v) =>
        vendorMap.set(v.code, v.id),
      );

      // 4. SEED VENDOR CATALOG
      const catalogItems = [];
      for (const v of data.vendors) {
        const vendorId = vendorMap.get(v.vendorCode);
        if (!vendorId || !v.items) continue;

        for (const vItem of v.items) {
          const itemId = itemMap.get(vItem.itemCode);
          if (itemId) {
            catalogItems.push({
              vendor_id: vendorId,
              item_id: itemId,
              price_type: vItem.priceType,
              unit_price: vItem.unitPrice,
              min_quantity: vItem.minQuantity,
              agreement_number: vItem.agreementNumber,
            });
          }
        }
      }

      if (catalogItems.length > 0) {
        await supabase
          .from("vendor_catalog_items")
          .upsert(catalogItems, {
            onConflict: "vendor_id,item_id",
          });
      }
    }

    // 5. SEED PROCUREMENT REQUESTS & ITEMS
    console.log("Seeding Procurement Requests...");

    if (data.requests?.length) {
      for (const req of data.requests) {
        // DERIVE REGION (Fix for Requirement #4)
        const derivedRegion =
          req.items?.[0]?.region || "DKI Jakarta";

        // A. Insert Header
        const { data: prData, error: prError } = await supabase
          .from("procurement_requests")
          .upsert(
            {
              pr_number: req.prNumber,
              pr_date: req.prDate,
              property_name: req.propertyName,
              property_code: req.propertyCode,
              property_address: req.propertyAddress,
              region: derivedRegion, // Save to DB
              requestor_name: req.requestorName,
              requestor_email: req.requestorEmail,
              pic_name: req.picName,
              pic_number: req.picNumber,
              status: req.status,
            },
            { onConflict: "pr_number" },
          )
          .select("id")
          .single();

        if (prError) continue;

        const prId = prData.id;

        // B. Insert Line Items
        if (req.items?.length) {
          const itemsToInsert = req.items.map((item) => {
            const masterItemId = itemMap.get(item.itemCode);
            const vendorId = item.vendorCode
              ? vendorMap.get(item.vendorCode)
              : null;

            return {
              request_id: prId,
              master_item_id: masterItemId,
              item_name_snapshot: item.itemName,
              status: item.status,
              item_status: item.itemStatus,
              quantity: item.quantity,
              uom: item.uom,
              assigned_vendor_id: vendorId,
              payment_terms: item.paymentTerms,
              unit_price: item.unitPrice,
              tax_percentage: item.taxPercentage,
              tax_amount: item.taxAmount,
              total_price: item.totalPrice,
              po_number: item.poNumber,
              po_date: item.poDate
                ? new Date(item.poDate)
                : null,
              estimated_delivery_start:
                item.estimatedDeliveryStart,
              estimated_delivery_end: item.estimatedDeliveryEnd,
            };
          });

          await supabase
            .from("request_items")
            .delete()
            .eq("request_id", prId);

          await supabase
            .from("request_items")
            .insert(itemsToInsert);
        }

        // C. Insert Activity Logs
        if (req.activityLog?.length) {
          const logsToInsert = req.activityLog.map((log) => ({
            request_id: prId,
            user_email: log.user,
            action: log.action,
            details: log.details,
            timestamp: log.timestamp,
          }));

          await supabase
            .from("activity_logs")
            .delete()
            .eq("request_id", prId);

          await supabase
            .from("activity_logs")
            .insert(logsToInsert);
        }
      }
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Critical Seeding Error:", error);
    throw error;
  }
};