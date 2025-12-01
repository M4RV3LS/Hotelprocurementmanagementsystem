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

// 1. Helper to determine region
const determineRegion = (row: any): string => {
  if (row.region) return row.region;

  const address = (row.property_address || "").toLowerCase();
  if (address.includes("jakarta")) return "DKI Jakarta";
  if (address.includes("bali")) return "Bali";
  if (address.includes("bandung")) return "Jawa Barat";
  if (address.includes("surabaya")) return "Jawa Timur";
  if (address.includes("yogya"))
    return "Daerah Istimewa Yogyakarta";
  if (address.includes("medan")) return "Sumatera Utara";
  return "DKI Jakarta";
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
      itemName:
        item.master_items?.name || item.item_name_snapshot,
      itemCategory: item.master_items?.category || "Ops Item",
      selectedProperties: {},
      quantity: item.quantity,
      uom: item.uom,
      region: region,
      itemStatus: item.item_status || "Not Set",
      status: item.status,
      vendorName: item.vendors?.name,
      vendorCode: item.vendors?.code,
      paymentTerms: item.payment_terms,
      unitPrice: item.unit_price,
      taxPercentage: item.tax_percentage || 11,
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
    const derivedRegion =
      request.items[0]?.region || "DKI Jakarta";

    // 1. Upsert Header
    const { data: prData, error: prError } = await supabase
      .from("procurement_requests")
      .upsert(
        {
          pr_number: request.prNumber,
          pr_date: request.prDate,
          property_name: request.propertyName,
          property_code: request.propertyCode,
          property_address: request.propertyAddress,
          region: derivedRegion,
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
    const prId = prData.id;

    // 2. Upsert Items
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
      // Note: For updates, we keep existing relations if not passed
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
      contact_person: v.contact_person,
      picName: v.contact_person,
      ppnPercentage: v.ppn_percentage,
      serviceChargePercentage: v.service_charge_percentage,
      // pb1Percentage: v.pb1_percentage, // Uncomment if column exists
      paymentMethods: v.payment_methods,
      isActive: v.is_active,
      vendorAgreementLink: v.agreement_link,
      agreements: [], // Needs separate table to persist properly
      items: v.items.map((vi: any) => ({
        itemCode: vi.master_item?.code,
        itemName: vi.master_item?.name,
        priceType: vi.price_type,
        unitPrice: vi.unit_price,
        minQuantity: vi.min_quantity,
        agreementNumber: vi.agreement_number,
        taxPercentage: 11,
      })),
    }));
  },

  // FIXED: Now saves Vendor AND Vendor Catalog Items
  save: async (vendor: any): Promise<any> => {
    // 1. Save Vendor Header
    const { data: vendorData, error: vendorError } =
      await supabase
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
              vendor.picName || vendor.contact_person,
            payment_methods: vendor.paymentMethods,
            ppn_percentage: vendor.ppnPercentage,
            service_charge_percentage:
              vendor.serviceChargePercentage,
            is_active: vendor.isActive,
            agreement_link: vendor.vendorAgreementLink,
          },
          { onConflict: "code" },
        )
        .select("id")
        .single();

    if (vendorError) throw vendorError;

    const vendorId = vendorData.id;

    // 2. Save Vendor Catalog Items (The mapping configuration)
    if (vendor.items && vendor.items.length > 0) {
      // A. Get UUIDs for the items based on their codes
      const itemCodes = vendor.items.map(
        (i: any) => i.itemCode,
      );
      const { data: masterItems, error: masterError } =
        await supabase
          .from("master_items")
          .select("code, id")
          .in("code", itemCodes);

      if (masterError) throw masterError;

      const itemMap = new Map(
        masterItems?.map((i) => [i.code, i.id]),
      );

      // B. Prepare Data
      const catalogItems = vendor.items
        .map((vItem: any) => {
          const itemId = itemMap.get(vItem.itemCode);
          if (!itemId) return null;

          return {
            vendor_id: vendorId,
            item_id: itemId,
            price_type: vItem.priceType,
            unit_price: vItem.unitPrice,
            min_quantity: vItem.minQuantity,
            agreement_number: vItem.agreementNumber,
          };
        })
        .filter((i: any) => i !== null);

      // C. Sync: Delete old mappings for this vendor and insert new ones
      const { error: deleteError } = await supabase
        .from("vendor_catalog_items")
        .delete()
        .eq("vendor_id", vendorId);

      if (deleteError) throw deleteError;

      if (catalogItems.length > 0) {
        const { error: insertError } = await supabase
          .from("vendor_catalog_items")
          .insert(catalogItems);

        if (insertError) throw insertError;
      }
    } else {
      // If items list is empty, clear the catalog
      await supabase
        .from("vendor_catalog_items")
        .delete()
        .eq("vendor_id", vendorId);
    }

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
      properties: [],
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
              region: derivedRegion,
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