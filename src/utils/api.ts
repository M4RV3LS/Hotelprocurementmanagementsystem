import { createClient } from "@jsr/supabase__supabase-js";
import { projectId, publicAnonKey } from "./supabase/info";
import type {
  ProcurementRequest,
  PurchaseOrder,
  DeliveryProof,
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

// Helper to check and update PR status
const checkAndClosePR = async (prNumber: string) => {
  if (!prNumber) return;

  const { data: items, error } = await supabase
    .from("procurement_requests")
    .select(`request_items (status)`)
    .eq("pr_number", prNumber)
    .single();

  if (error || !items) return;

  const allItems = items.request_items || [];
  if (allItems.length === 0) return;

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
          brand_name: request.brandName,
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

    const itemsToUpsert = request.items.map((item: any) => ({
      id: item.id && item.id.length > 30 ? item.id : undefined,
      request_id: prId,
      master_item_id: itemMap.get(item.itemCode),
      item_name_snapshot: item.itemName,
      status: item.status,
      item_status: item.itemStatus,
      quantity: item.quantity,
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

  updateAllItemsStatus: async () => {},
  logActivity: async () => {},
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
        unitPrice: i.unit_price,
        totalPrice: i.total_price,
        status: i.status,
        itemCategory: i.master_items?.category || "Ops Item",
        deliveryProofId: i.delivery_proof_id,
        propertyName: i.request?.property_name,
        propertyCode: i.request?.property_code,
        propertyAddress: i.request?.property_address,
        brandName: i.request?.brand_name || "RedDoorz",
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

  uploadFile: async (
    file: File,
    bucket: string,
    path: string,
  ): Promise<string> => {
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
      const safeName = proofData.file.name.replace(
        /[^a-zA-Z0-9.\-_]/g,
        "_",
      );
      const fileName = `${poId}/${Date.now()}_${safeName}`;

      fileLink = await purchaseOrdersAPI.uploadFile(
        proofData.file,
        "Delivery Proof",
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
    requestId: string,
    prNumber: string,
    reason: string,
    proofFile: File | null,
  ): Promise<void> => {
    let proofLink = "";

    if (proofFile) {
      const safeName = proofFile.name.replace(
        /[^a-zA-Z0-9.\-_]/g,
        "_",
      );
      const path = `Rejections/${itemId}/${Date.now()}_${safeName}`;

      const { data, error } = await supabase.storage
        .from("Delivery Proof")
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

    await checkAndClosePR(prNumber);
  },

  updateItemDeliveryStatus: async (
    itemId: string,
    requestId: string,
    poId: string,
    isDelivered: boolean,
    proofIds?: string[] | string,
    reason?: string,
  ): Promise<void> => {
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

    const { data: allItems, error: itemsError } = await supabase
      .from("request_items")
      .select("status")
      .eq("purchase_order_id", poId);

    if (itemsError) throw itemsError;

    if (allItems && allItems.length > 0) {
      const allItemsFinalized = allItems.every(
        (i) =>
          i.status === "Delivered" ||
          i.status === "Cancelled by Procurement",
      );

      const newPOStatus = allItemsFinalized ? "Close" : "Open";

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
    const { data: po, error: fetchError } = await supabase
      .from("purchase_orders")
      .select("delivery_proofs")
      .eq("id", poId)
      .single();

    if (fetchError) throw fetchError;

    const currentProofs = (po.delivery_proofs as any[]) || [];

    const updatedProofs = currentProofs.filter(
      (p: any) => p.id !== proofIdToDelete,
    );

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
      vendorType: v.vendor_type || "Corporation",

      // Requirement 4: Handling Regional Coverage as structured data (JSONB)
      regionalCoverages: v.regional_coverage || [],
      vendorRegion: v.region,

      // Requirement 3: Emails and Phone
      vendorAddress: v.address,
      vendorEmail: v.email, // Email 1
      email2: v.email_2 || "", // Email 2 (Mapping to a potential column or placeholder)
      vendorPhone: v.phone,

      contact_person: v.contact_person,
      picName: v.contact_person,

      ppnPercentage: v.ppn_percentage,
      serviceChargePercentage: v.service_charge_percentage,
      paymentMethods: v.payment_methods,
      isActive: v.is_active,
      vendorAgreementLink: v.agreement_link,
      deliveryFee: v.delivery_fee,

      agreements: Array.isArray(v.agreements)
        ? v.agreements
        : [],

      // Legal Fields
      nibNumber: v.nib_number,
      nibFileLink: v.nib_file_link,
      ktpNumber: v.ktp_number,
      ktpFileLink: v.ktp_file_link,
      npwpNumber: v.npwpd_number,
      npwpFileLink: v.npwpd_file_link,
      bankName: v.bank_name,
      bankAccountName: v.bank_account_name,
      bankAccountNumber: v.bank_account_number,
      bankAccountDocLink: v.bank_account_doc_link,
      legalDocLink: v.legal_doc_link,

      // Extra Legal Fields
      sppkpNumber: v.sppkp_number,
      sppkpFileLink: v.sppkp_file_link,
      deedNumber: v.deed_number,
      deedFileLink: v.deed_file_link,
      sbuNumber: v.sbu_number,
      sbuFileLink: v.sbu_file_link,
      constructionNumber: v.construction_number,
      constructionFileLink: v.construction_file_link,
      localTaxNumber: v.local_tax_number,
      localTaxFileLink: v.local_tax_file_link,
      corNumber: v.cor_number,
      corFileLink: v.cor_file_link,
      gptcNumber: v.gptc_number,
      gptcFileLink: v.gptc_file_link,
      otherLicenseFileLink: v.other_license_file_link,

      items: v.items.map((vi: any) => ({
        itemCode: vi.master_item?.code,
        itemName: vi.master_item?.name,
        priceType: vi.price_type,
        unitPrice: vi.unit_price,
        minQuantity: vi.min_quantity,
        multipleOf: vi.multiple_of || 1,
        agreementNumber: vi.agreement_number,
        taxPercentage: vi.wht_percentage || 0,
        propertyTypes: vi.property_types || [],
        selectedPhotos: vi.selected_photos || [],
        masterPhotos: vi.master_item?.photos || [],
      })),
    }));
  },

  save: async (vendor: any): Promise<any> => {
    // Upsert Vendor
    const { data: vendorData, error: vendorError } =
      await supabase
        .from("vendors")
        .upsert(
          {
            code: vendor.vendorCode,
            name: vendor.vendorName,

            // Regions & Structured Coverage
            region: Array.isArray(vendor.vendorRegion)
              ? vendor.vendorRegion
              : [vendor.vendorRegion],
            regional_coverage: vendor.regionalCoverages, // Saving structured data

            address: vendor.vendorAddress,
            email: vendor.vendorEmail,
            // email_2: vendor.email2, // Assuming column exists or is ignored if RLS/Schema allows
            phone: vendor.vendorPhone,
            contact_person:
              vendor.picName || vendor.contact_person,

            payment_methods: vendor.paymentMethods,
            ppn_percentage: vendor.ppnPercentage,
            service_charge_percentage:
              vendor.serviceChargePercentage,
            is_active: vendor.isActive,
            delivery_fee: vendor.deliveryFee,
            agreement_link: vendor.vendorAgreementLink,
            agreements: vendor.agreements,

            // Legal Mappings
            nib_number: vendor.nibNumber,
            nib_file_link: vendor.nibFileLink,
            ktp_number: vendor.ktpNumber,
            ktp_file_link: vendor.ktpFileLink,
            npwpd_number: vendor.npwpNumber,
            npwpd_file_link: vendor.npwpFileLink,
            bank_name: vendor.bankName,
            bank_account_name: vendor.bankAccountName,
            bank_account_number: vendor.bankAccountNumber,
            bank_account_doc_link: vendor.bankAccountDocLink,
            legal_doc_link: vendor.legalDocLink,

            // Extra Legal (Mapped for consistency, even if columns missing in basic schema, Supabase handles it if added)
            sppkp_number: vendor.sppkpNumber,
            sppkp_file_link: vendor.sppkpFileLink,
            deed_number: vendor.deedNumber,
            deed_file_link: vendor.deedFileLink,
            sbu_number: vendor.sbuNumber,
            sbu_file_link: vendor.sbuFileLink,
            construction_number: vendor.constructionNumber,
            construction_file_link: vendor.constructionFileLink,
            local_tax_number: vendor.localTaxNumber,
            local_tax_file_link: vendor.localTaxFileLink,
            cor_number: vendor.corNumber,
            cor_file_link: vendor.corFileLink,
            gptc_number: vendor.gptcNumber,
            gptc_file_link: vendor.gptcFileLink,
            other_license_file_link:
              vendor.otherLicenseFileLink,
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
            multiple_of: vItem.multipleOf,
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

export const itemsAPI = {
  getAll: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from("master_items")
      .select(
        `
        *,
        category:item_categories(name)
      `,
      )
      .order("name");

    if (error) {
      console.error("Error fetching items:", error);
      return [];
    }

    return (data || []).map((i: any) => ({
      itemCode: i.code,
      itemName: i.name,
      brandName: i.brand_name,
      itemCategory:
        i.category?.name || i.category || "Uncategorized",
      categoryId: i.category_id,
      uom: i.uom,
      isActive: i.is_active,
      description: i.description,
      photos: i.photos || [],
      commodityCode: i.commodity_code,
      commodityName: i.commodity_name,
      // Requirement 6: New Fields
      weightage: i.weight, // Mapping 'weight' column
      physicalSpec: i.physical_spec, // Mapping hypothetical 'physical_spec' or description
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
          commodity_code: item.commodityCode,
          commodity_name: item.commodityName,
          // Sync new fields
          weight: item.weightage, // Using 'weight' as DB column
          physical_spec: item.physicalSpec, // Using 'physical_spec' as DB column (or map to details)
        },
        { onConflict: "code" },
      )
      .select()
      .single();

    if (error) throw error;

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
      commodityCode: data.commodity_code,
      commodityName: data.commodity_name,
      weightage: data.weight,
      physicalSpec: data.physical_spec,
    };
  },

  delete: async (code: string) => {
    const { error } = await supabase
      .from("master_items")
      .delete()
      .eq("code", code);

    if (error) throw error;
  },

  unassignCategory: async (itemCodes: string[]) => {
    const { error } = await supabase
      .from("master_items")
      .update({ category_id: null, category: "Uncategorized" })
      .in("code", itemCodes);
    if (error) throw error;
  },

  assignCategory: async (
    itemCodes: string[],
    categoryId: string,
    categoryName: string,
  ) => {
    const { error } = await supabase
      .from("master_items")
      .update({
        category_id: categoryId,
        category: categoryName,
      })
      .in("code", itemCodes);
    if (error) throw error;
  },
};

export const itemCategoriesAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("item_categories")
      .select(`*, items:master_items(count)`);

    if (error) throw error;

    return data.map((cat: any) => ({
      ...cat,
      isActive: cat.is_active ?? true,
      itemCount: cat.items?.[0]?.count || 0,
    }));
  },

  save: async (name: string) => {
    const { data, error } = await supabase
      .from("item_categories")
      .upsert({ name, is_active: true }, { onConflict: "name" })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  toggleStatus: async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("item_categories")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) throw error;
  },
};

export const paymentMethodsAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("name");
    if (error) return [];
    return data.map((pm: any) => ({
      id: pm.id,
      name: pm.name,
      isActive: pm.is_active,
    }));
  },
  save: async (paymentMethods: any[]) => {
    const { error } = await supabase
      .from("payment_methods")
      .upsert(
        paymentMethods.map((pm: any) => ({
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
    if (data.paymentMethods?.length) {
      await supabase.from("payment_methods").upsert(
        data.paymentMethods.map((pm) => ({
          name: pm.name,
          is_active: pm.isActive,
        })),
        { onConflict: "name" },
      );
    }

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
            is_active: item.isActive,
            commodity_code: item.commodityCode,
            commodity_name: item.commodityName,
          })),
          { onConflict: "code" },
        )
        .select("code, id");

      if (error)
        throw new Error(`Master Items Error: ${error.message}`);
      insertedItems?.forEach((i) => itemMap.set(i.code, i.id));
    }

    const vendorMap = new Map<string, string>();
    if (data.vendors?.length) {
      const vendorsToInsert = data.vendors.map((v) => ({
        code: v.vendorCode,
        name: v.vendorName,
        region: v.vendorRegion,
        regional_coverage: v.regionalCoverages,
        address: v.vendorAddress,
        email: v.vendorEmail,
        phone: v.vendorPhone,
        payment_methods: v.paymentMethods,
        ppn_percentage: v.ppnPercentage,
        is_active: v.isActive,
        nib_number: v.nibNumber,
        npwpd_number: v.npwpNumber,
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
              wht_percentage: vItem.taxPercentage,
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
              brand_name: req.brandName,
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
              assigned_vendor_id: vendorId,
              payment_terms: item.paymentTerms,
              unit_price: item.unitPrice,
              tax_percentage: item.taxPercentage,
              tax_amount: item.taxAmount,
              total_price: item.totalPrice,
              po_number: item.poNumber,
              po_date: item.po_date
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