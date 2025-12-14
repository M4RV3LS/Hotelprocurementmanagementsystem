import { createClient } from "@jsr/supabase__supabase-js";
import { projectId, publicAnonKey } from "./supabase/info";
import type {
  ProcurementRequest,
  PurchaseOrder,
  DeliveryProof,
  ItemCategory,
} from "../data/mockData";

const API_BASE = "/make-server-1e4a32a5";

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP Error: ${response.status}`,
    );
  }
  return response.json();
};

// Initialize Supabase Client
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
);

// Helper to check and update PR status (Requirement 5)
const checkAndClosePR = async (prNumber: string) => {
  if (!prNumber) return;

  // Get all items for this PR
  const { data: items, error } = await supabase
    .from("procurement_requests")
    .select(
      `
      request_items (status)
    `,
    )
    .eq("pr_number", prNumber)
    .single();

  if (error || !items) return;

  const allItems = items.request_items || [];
  if (allItems.length === 0) return;

  // Check if all items are either Delivered or Cancelled
  const allClosed = allItems.every(
    (item: any) =>
      item.status === "Delivered" ||
      item.status === "Cancelled by Procurement",
  );

  const newStatus = allClosed ? "Close" : "Open";

  await supabase
    .from("procurement_requests")
    .update({ status: newStatus })
    .eq("pr_number", prNumber);
};

// Helper function to determine region from a procurement request row
const determineRegion = (row: any): string => {
  if (row.region) return row.region;
  if (row.request_items?.[0]) {
    return "DKI Jakarta";
  }
  return "DKI Jakarta";
};

const mapDBRequestToFrontend = (
  row: any,
): ProcurementRequest => {
  const region = determineRegion(row);
  return {
    prNumber: row.pr_number,
    prDate: row.pr_date,
    propertyName: row.property_name,
    propertyCode: row.property_code,
    propertyType: row.property_type || "Leasing",
    brandName: "RedDoorz",
    propertyAddress: row.property_address || "",
    picName: row.pic_name || "",
    picNumber: row.pic_number || "",
    requestorName: row.requestor_name,
    requestorEmail: row.requestor_email,
    status: row.status,
    // @ts-ignore - Assuming note exists in DB but might not be in type yet
    note: row.note || "",
    // Added mapping for poFileLink
    poFileLink: row.po_file_link || "",
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
      taxPercentage: item.tax_percentage || 0,
      totalPrice: item.total_price,
      poNumber: item.po_number,
      poDate: item.po_date,
      estimatedDeliveryStart: item.estimated_delivery_start,
      estimatedDeliveryEnd: item.estimated_delivery_end,
      // Handle legacy single ID or new JSON array of IDs
      deliveryProofId: item.delivery_proof_id,
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

// Internal Helper for Activity Logs
const _logActivityInternal = async (
  requestId: string,
  userEmail: string,
  action: string,
  details: string,
) => {
  const { error } = await supabase
    .from("activity_logs")
    .insert({
      request_id: requestId,
      user_email: userEmail,
      action: action,
      details: details,
      timestamp: new Date().toISOString(),
    });
  if (error) console.error("Failed to log activity:", error);
};

export const procurementRequestsAPI = {
  getAll: async (): Promise<ProcurementRequest[]> => {
    const { data, error } = await supabase
      .from("procurement_requests")
      .select(
        `
        *,
        request_items (
          *,
          master_items (code, name, category), 
          vendors (name, code)
        ),
        activity_logs (*)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Helper to map DB row to Frontend
    const mapRow = (row: any): ProcurementRequest => {
      const region = row.region || "DKI Jakarta";
      return {
        prNumber: row.pr_number,
        prDate: row.pr_date,
        propertyName: row.property_name,
        propertyCode: row.property_code,
        propertyType: row.property_type || "Leasing",
        brandName: row.brand_name || "RedDoorz",
        propertyAddress: row.property_address || "",
        picName: row.pic_name || "",
        picNumber: row.pic_number || "",
        requestorName: row.requestor_name,
        requestorEmail: row.requestor_email,
        status: row.status,
        note: row.note || "",
        poFileLink: row.po_file_link || "",
        items: (row.request_items || []).map((item: any) => ({
          id: item.id,
          prNumber: row.pr_number,
          itemCode: item.master_items?.code || "UNKNOWN",
          itemName:
            item.master_items?.name || item.item_name_snapshot,
          itemCategory:
            item.master_items?.category || "Ops Item",
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
          taxPercentage: item.tax_percentage || 0,
          totalPrice: item.total_price,
          poNumber: item.po_number,
          poDate: item.po_date,
          estimatedDeliveryStart: item.estimated_delivery_start,
          estimatedDeliveryEnd: item.estimated_delivery_end,
          deliveryProofId: item.delivery_proof_id,
        })),
        activityLog: (row.activity_logs || []).map(
          (log: any) => ({
            id: log.id,
            timestamp: log.timestamp,
            user: log.user_email,
            action: log.action,
            details: log.details,
          }),
        ),
      };
    };

    return data.map(mapRow);
  },

  save: async (request: ProcurementRequest) => {
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
          region: request.items?.[0]?.region || "DKI Jakarta",
          property_type: request.propertyType,
          requestor_name: request.requestorName,
          requestor_email: request.requestorEmail,
          pic_name: request.picName,
          pic_number: request.picNumber,
          status: request.status,
          note: request.note,
          po_file_link: request.poFileLink,
        },
        { onConflict: "pr_number" },
      )
      .select("id")
      .single();

    if (prError) throw prError;
    const prId = prData.id;

    // 2. Resolve Vendors
    const uniqueVendorCodes = Array.from(
      new Set(
        (request.items || [])
          .map((i: any) => i.vendorCode)
          .filter(Boolean),
      ),
    ) as string[];

    const vendorMap = new Map<string, string>();
    if (uniqueVendorCodes.length > 0) {
      const { data: vendors } = await supabase
        .from("vendors")
        .select("code, id")
        .in("code", uniqueVendorCodes);
      vendors?.forEach((v) => vendorMap.set(v.code, v.id));
    }

    // 3. Resolve Master Items
    const itemCodes = (request.items || []).map(
      (i: any) => i.itemCode,
    );
    const { data: masterItems } = await supabase
      .from("master_items")
      .select("code, id")
      .in("code", itemCodes);
    const itemMap = new Map(
      masterItems?.map((i) => [i.code, i.id]),
    );

    // 4. Upsert Items
    const itemsToUpsert = request.items.map((item: any) => ({
      id: item.id && item.id.length > 30 ? item.id : undefined,
      request_id: prId,
      master_item_id: itemMap.get(item.itemCode),
      item_name_snapshot: item.itemName,
      status: item.status,
      item_status: item.itemStatus,
      quantity: item.quantity,
      uom: item.uom,
      assigned_vendor_id: item.vendorCode
        ? vendorMap.get(item.vendorCode)
        : null,
      payment_terms: item.paymentTerms,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      tax_percentage: item.taxPercentage,
      po_number: item.poNumber,
      estimated_delivery_start: item.estimatedDeliveryStart,
      estimated_delivery_end: item.estimatedDeliveryEnd,
    }));

    if (itemsToUpsert.length > 0) {
      await supabase
        .from("request_items")
        .upsert(itemsToUpsert, { onConflict: "id" });
    }

    return { success: true, message: "Saved" };
  },

  updateStatus: async (
    prNumber: string,
    status: string,
    note?: string,
  ) => {
    // Note: You might need to add a specific endpoint for status update in index.tsx
    // or just use save() with updated status for now if simple
    const reqs = await procurementRequestsAPI.getAll();
    const req = reqs.find((r) => r.prNumber === prNumber);
    if (req) {
      await procurementRequestsAPI.save({
        ...req,
        status,
        note,
      });
    }
  },

  updateAllItemsStatus: async () => {
    /* Handled by Server Logic usually */
  },
  logActivity: async () => {
    /* Log Logic */
  },
  bulkUpdate: async (reqs: any[]) => {
    for (const r of reqs) await procurementRequestsAPI.save(r);
    return reqs;
  },

  delete: async (prNumber: string): Promise<void> => {
    const { error } = await supabase
      .from("procurement_requests")
      .delete()
      .eq("pr_number", prNumber);
    if (error) throw error;
  },
};

export const purchaseOrdersAPI = {
  getAll: async (): Promise<PurchaseOrder[]> => {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(
        `
        *,
        vendor:vendors(name, email, address, contact_person, phone),
        items:request_items(
          *,
          master_items(name, code, category),
          request:procurement_requests(
            pr_number,
            property_name,
            property_code, 
            property_address, 
            property_type,
            brand_name,
            pic_name, 
            pic_number
          )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map((po: any) => ({
      id: po.id,
      poNumber: po.po_number,
      generatedDate: po.generated_date,
      vendorId: po.vendor_id,
      vendorName: po.vendor?.name || "Unknown",
      // Extended Vendor Data
      vendorEmail: po.vendor?.email,
      vendorAddress: po.vendor?.address,
      vendorPhone: po.vendor?.phone,
      vendorContact: po.vendor?.contact_person,

      status: po.status,
      approvalStatus: po.approval_status,
      signedPoLink: po.signed_po_link,
      totalAmount: po.total_amount,
      deliveryProofs: po.delivery_proofs || [],
      items: (po.items || []).map((i: any) => ({
        id: i.id,
        prNumber: i.request?.pr_number || "PR-LINKED",
        request_id: i.request_id,
        itemName: i.master_items?.name || i.item_name_snapshot,
        quantity: i.quantity,
        uom: i.uom,
        unitPrice: i.unit_price,
        totalPrice: i.total_price,
        status: i.status,
        itemCategory: i.master_items?.category || "Ops Item",
        deliveryProofId: i.delivery_proof_id,
        propertyName: i.request?.property_name,
        propertyCode: i.request?.property_code,
        propertyAddress: i.request?.property_address,
        brandName: i.request?.brand_name || "RedDoorz", // Default or fetched
        picName: i.request?.pic_name,
      })),
      prNumbers: Array.from(
        new Set((po.items || []).map((i: any) => i.request_id)),
      ),
    }));
  },

  create: async (poData: {
    poNumber: string;
    vendorId: string;
    generatedDate: string;
    totalAmount: number;
    items: Array<{
      id: string;
      whtPercentage: number;
      eta: string;
    }>;
  }): Promise<void> => {
    const { data: newPO, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        po_number: poData.poNumber,
        vendor_id: poData.vendorId,
        generated_date: poData.generatedDate,
        total_amount: poData.totalAmount,
        status: "Open",
        approval_status: "Pending",
      })
      .select()
      .single();

    if (poError) throw poError;

    const updates = poData.items.map(async (item) => {
      const updatePayload: any = {
        purchase_order_id: newPO.id,
        po_number: poData.poNumber,
        po_date: poData.generatedDate,
        status: "Waiting PO Approval",
        tax_percentage: item.whtPercentage,
      };

      if (item.eta) {
        updatePayload.estimated_delivery_start = item.eta;
      }

      const { error } = await supabase
        .from("request_items")
        .update(updatePayload)
        .eq("id", item.id);

      if (error) {
        console.error(
          `Failed to update item ${item.id}:`,
          error,
        );
        throw error;
      }
    });

    await Promise.all(updates);
  },

  delete: async (poId: string): Promise<void> => {
    const { error: updateError } = await supabase
      .from("request_items")
      .update({
        status: "Waiting PO",
        purchase_order_id: null,
        po_number: null,
        po_date: null,
      })
      .eq("purchase_order_id", poId);

    if (updateError) throw updateError;

    const { error: deleteError } = await supabase
      .from("purchase_orders")
      .delete()
      .eq("id", poId);

    if (deleteError) throw deleteError;
  },

  uploadSignedPO: async (
    poId: string,
    fileLink: string,
  ): Promise<void> => {
    const { error } = await supabase
      .from("purchase_orders")
      .update({
        signed_po_link: fileLink,
        approval_status: "Approved",
      })
      .eq("id", poId);
    if (error) throw error;
  },

  markAsProcessByVendor: async (
    poId: string,
  ): Promise<void> => {
    const { data: items } = await supabase
      .from("request_items")
      .select("id")
      .eq("purchase_order_id", poId);

    if (!items || items.length === 0) return;
    const itemIds = items.map((i) => i.id);

    const { error } = await supabase
      .from("request_items")
      .update({ status: "Process by Vendor" })
      .in("id", itemIds);

    if (error) throw error;
  },

  // Helper to upload file
  uploadFile: async (
    file: File,
    bucket: string,
    path: string,
  ): Promise<string> => {
    // 1. Sanitize the path to ensure it doesn't contain double slashes or invalid chars
    const cleanPath = path.replace(/\/+/g, "/");

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(cleanPath, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: file.type,
      });

    if (error) {
      console.error("Storage Upload Error Details:", {
        message: error.message,
        path: cleanPath,
        bucket: bucket,
      });
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  },

  addDeliveryProof: async (
    poId: string,
    proofData: {
      name: string;
      file: File | null;
      existingLink?: string;
    },
  ): Promise<DeliveryProof> => {
    let fileLink = proofData.existingLink || "";

    if (proofData.file) {
      // FIX: Strict regex to remove special chars causing "Invalid Key" error
      // Keeps only alphanumeric, dot, hyphen, underscore.
      const safeName = proofData.file.name.replace(
        /[^a-zA-Z0-9.\-_]/g,
        "_",
      );
      const fileName = `${poId}/${Date.now()}_${safeName}`;

      fileLink = await purchaseOrdersAPI.uploadFile(
        proofData.file,
        "Delivery Proof", // Explicitly matching your bucket name
        fileName,
      );
    }

    const { data: po, error: fetchError } = await supabase
      .from("purchase_orders")
      .select("delivery_proofs")
      .eq("id", poId)
      .single();

    if (fetchError) throw fetchError;

    const currentProofs = po.delivery_proofs || [];

    const newProof: DeliveryProof = {
      id: `proof-${Date.now()}`,
      name: proofData.name,
      fileLink: fileLink,
      uploadedAt: new Date().toISOString(),
    };

    const updatedProofs = [...currentProofs, newProof];

    const { error: updateError } = await supabase
      .from("purchase_orders")
      .update({ delivery_proofs: updatedProofs })
      .eq("id", poId);

    if (updateError) throw updateError;

    return newProof;
  },

  rejectItem: async (
    itemId: string,
    requestId: string, // pr_number or ID needed for checkAndClosePR? Logic uses prNumber usually
    prNumber: string,
    reason: string,
    proofFile: File | null,
  ): Promise<void> => {
    let proofLink = "";

    if (proofFile) {
      // Sanitize filename
      const safeName = proofFile.name.replace(
        /[^a-zA-Z0-9.\-_]/g,
        "_",
      );
      const path = `Rejections/${itemId}/${Date.now()}_${safeName}`;

      // Reuse the uploadFile helper from existing code
      const { data, error } = await supabase.storage
        .from("Delivery Proof") // Using same bucket for simplicity, or create a 'Rejections' bucket
        .upload(path, proofFile, { upsert: true });

      if (!error) {
        const { data: publicUrl } = supabase.storage
          .from("Delivery Proof")
          .getPublicUrl(data.path);
        proofLink = publicUrl.publicUrl;
      }
    }

    const { error } = await supabase
      .from("request_items")
      .update({
        status: "Cancelled by Procurement",
        rejection_reason: reason,
        rejection_proof_link: proofLink,
      })
      .eq("id", itemId);

    if (error) throw error;

    // Check if PR should close
    await checkAndClosePR(prNumber);
  },

  // Requirement 4: Support multiple proof IDs
  updateItemDeliveryStatus: async (
    itemId: string,
    requestId: string,
    poId: string,
    isDelivered: boolean,
    proofIds?: string[] | string, // Updated Type
    reason?: string,
  ): Promise<void> => {
    // Logic to serialize array if needed
    const proofIdValue = Array.isArray(proofIds)
      ? JSON.stringify(proofIds)
      : proofIds;

    const updatePayload: any = {
      status: isDelivered ? "Delivered" : "Process by Vendor",
      delivery_proof_id: isDelivered ? proofIdValue : null,
    };

    const { error: itemError } = await supabase
      .from("request_items")
      .update(updatePayload)
      .eq("id", itemId);

    if (itemError) throw itemError;

    const action = isDelivered
      ? "Item Delivered"
      : "Delivery Cancelled";
    const details = isDelivered
      ? `Item marked as Delivered. Linked Proofs: ${proofIdValue || "N/A"}`
      : `Delivery status revoked. Reason: ${reason}`;

    await _logActivityInternal(
      requestId,
      "System User",
      action,
      details,
    );

    // Check PO Closure
    const { data: allItems, error: itemsError } = await supabase
      .from("request_items")
      .select("status")
      .eq("purchase_order_id", poId);

    if (itemsError) throw itemsError;

    if (allItems && allItems.length > 0) {
      // Logic Update: A PO is Closed if ALL items are either 'Delivered' OR 'Cancelled'
      const allItemsFinalized = allItems.every(
        (i) =>
          i.status === "Delivered" ||
          i.status === "Cancelled by Procurement",
      );

      const newPOStatus = allItemsFinalized ? "Close" : "Open";

      // Only update if the status is actually changing (optional optimization, but good practice)
      const { error: poError } = await supabase
        .from("purchase_orders")
        .update({ status: newPOStatus })
        .eq("id", poId);

      if (poError) throw poError;
    }
  },
  deleteDeliveryProof: async (
    poId: string,
    proofIdToDelete: string,
  ): Promise<void> => {
    // 1. Fetch current PO to get the list
    const { data: po, error: fetchError } = await supabase
      .from("purchase_orders")
      .select("delivery_proofs")
      .eq("id", poId)
      .single();

    if (fetchError) throw fetchError;

    const currentProofs = (po.delivery_proofs as any[]) || [];

    // 2. Filter out the specific proof
    const updatedProofs = currentProofs.filter(
      (p: any) => p.id !== proofIdToDelete,
    );

    // 3. Update the PO record
    const { error: updateError } = await supabase
      .from("purchase_orders")
      .update({ delivery_proofs: updatedProofs })
      .eq("id", poId);

    if (updateError) throw updateError;
  },
};

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
      id: v.id,
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
      paymentMethods: v.payment_methods,
      isActive: v.is_active,
      vendorAgreementLink: v.agreement_link,
      propertyType: v.property_type || "All",
      agreements: Array.isArray(v.agreements)
        ? v.agreements
        : [],
      // Legal/Bank Fields
      nibNumber: v.nib_number,
      nibFileLink: v.nib_file_link,
      ktpNumber: v.ktp_number,
      ktpFileLink: v.ktp_file_link,
      npwpdNumber: v.npwpd_number,
      npwpdFileLink: v.npwpd_file_link,
      bankName: v.bank_name,
      bankAccountName: v.bank_account_name,
      bankAccountNumber: v.bank_account_number,
      bankAccountDocLink: v.bank_account_doc_link,
      legalDocLink: v.legal_doc_link,
      deliveryFee: v.delivery_fee,
      items: v.items.map((vi: any) => ({
        itemCode: vi.master_item?.code,
        itemName: vi.master_item?.name,
        priceType: vi.price_type,
        unitPrice: vi.unit_price,
        minQuantity: vi.min_quantity,
        agreementNumber: vi.agreement_number,
        taxPercentage: vi.wht_percentage || 0,
        propertyTypes: vi.property_types || [],
        selectedPhotos: vi.selected_photos || [],
        masterPhotos: vi.master_item?.photos || [],
      })),
    }));
  },

  save: async (vendor: any): Promise<any> => {
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
            agreements: vendor.agreements,
            delivery_fee: vendor.deliveryFee,
            nib_number: vendor.nibNumber,
            nib_file_link: vendor.nibFileLink,
            ktp_number: vendor.ktpNumber,
            ktp_file_link: vendor.ktpFileLink,
            npwpd_number: vendor.npwpdNumber,
            npwpd_file_link: vendor.npwpdFileLink,
            bank_name: vendor.bankName,
            bank_account_name: vendor.bankAccountName,
            bank_account_number: vendor.bankAccountNumber,
            bank_account_doc_link: vendor.bankAccountDocLink,
            legal_doc_link: vendor.legalDocLink,
          },
          { onConflict: "code" },
        )
        .select("id")
        .single();

    if (vendorError) throw vendorError;
    const vendorId = vendorData.id;

    if (vendor.items && vendor.items.length > 0) {
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
            wht_percentage: vItem.taxPercentage,
            property_types: vItem.propertyTypes || [],
            selected_photos: vItem.selectedPhotos || [],
          };
        })
        .filter((i: any) => i !== null);

      await supabase
        .from("vendor_catalog_items")
        .delete()
        .eq("vendor_id", vendorId);

      if (catalogItems.length > 0) {
        const { error: insertError } = await supabase
          .from("vendor_catalog_items")
          .insert(catalogItems);
        if (insertError) throw insertError;
      }
    } else {
      await supabase
        .from("vendor_catalog_items")
        .delete()
        .eq("vendor_id", vendorId);
    }
    return { ...vendor, id: vendorId };
  },

  delete: async (vendorCode: string): Promise<void> => {
    const { error } = await supabase
      .from("vendors")
      .delete()
      .eq("code", vendorCode);
    if (error) throw error;
  },
};

// --- ITEMS API ---
export const itemsAPI = {
  getAll: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from("master_items")
      .select(`
        *,
        category:item_categories(name)
      `)
      .order("name");

    if (error) {
      console.error("Error fetching items:", error);
      return [];
    }

    return (data || []).map((i: any) => ({
      itemCode: i.code,
      itemName: i.name,
      brandName: i.brand_name,
      // Priority: Relation Name > Fallback Text > Default
      itemCategory:
        i.category?.name || i.category || "Uncategorized",
      categoryId: i.category_id, // Critical for UI linking
      uom: i.uom,
      isActive: i.is_active,
      description: i.description,
      photos: i.photos || [],
    }));
  },

  save: async (item: any) => {
    const { data, error } = await supabase
      .from("master_items")
      .upsert(
        {
          code: item.itemCode,
          name: item.itemName,
          brand_name: item.brandName,
          category: item.itemCategory,
          category_id: item.categoryId,
          uom: item.uom,
          is_active: item.isActive,
          description: item.description,
          photos: item.photos || [],
        },
        { onConflict: "code" }
      )
      .select()
      .single();

    if (error) throw error;

    // Return in the same format as getAll
    return {
      itemCode: data.code,
      itemName: data.name,
      brandName: data.brand_name,
      itemCategory: data.category,
      categoryId: data.category_id,
      uom: data.uom,
      isActive: data.is_active,
      description: data.description,
      photos: data.photos || [],
    };
  },

  delete: async (code: string) => {
    const { error } = await supabase
      .from("master_items")
      .delete()
      .eq("code", code);
    
    if (error) throw error;
  },
};

export const paymentMethodsAPI = {
  getAll: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("name");
    if (error) return [];
    return data.map((pm) => ({
      id: pm.id,
      name: pm.name,
      isActive: pm.is_active,
    }));
  },
  save: async (paymentMethods: any[]): Promise<any[]> => {
    const { error } = await supabase
      .from("payment_methods")
      .upsert(
        paymentMethods.map((pm) => ({
          name: pm.name,
          is_active: pm.isActive,
        })),
        { onConflict: "name" },
      );
    if (error) throw error;
    return paymentMethods;
  },
};

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
    if (data.requests?.length) {
      for (const req of data.requests) {
        const derivedRegion =
          req.items?.[0]?.region || "DKI Jakarta";

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

// --- NEW CATEGORY API ---
export const itemCategoriesAPI = {
  getAll: async (): Promise<ItemCategory[]> => {
    const { data, error } = await supabase
      .from("item_categories")
      .select(`*, items:master_items(count)`);

    if (error) throw error;

    return data.map((cat: any) => ({
      ...cat,
      itemCount: cat.items?.[0]?.count || 0,
    }));
  },
  save: async (name: string) => {
    const { data, error } = await supabase
      .from("item_categories")
      .upsert({ name }, { onConflict: "name" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    // Detach items first
    await supabase
      .from("master_items")
      .update({ category_id: null })
      .eq("category_id", id);

    const { error } = await supabase
      .from("item_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};