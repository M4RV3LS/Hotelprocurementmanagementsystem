import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY") ||
  "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-1e4a32a5/health", (c) => {
  return c.json({ status: "ok" });
});

// ========================================
// ITEM CATEGORIES ROUTES (FIXED)
// ========================================

app.get("/make-server-1e4a32a5/item-categories", async (c) => {
  const { data, error } = await supabase
    .from("item_categories")
    .select(`*, items:master_items(count)`);

  if (error) return c.json({ error: error.message }, 500);

  const formatted = data.map((cat: any) => ({
    ...cat,
    itemCount: cat.items?.[0]?.count || 0,
  }));

  return c.json(formatted);
});

app.post("/make-server-1e4a32a5/item-categories", async (c) => {
  try {
    const payload = await c.req.json();
    const { data, error } = await supabase
      .from("item_categories")
      .upsert({ name: payload.name }, { onConflict: "name" })
      .select()
      .single();

    if (error) throw error;
    return c.json(data);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete(
  "/make-server-1e4a32a5/item-categories/:id",
  async (c) => {
    const id = c.req.param("id");
    // Detach items first
    await supabase
      .from("master_items")
      .update({ category_id: null })
      .eq("category_id", id);

    const { error } = await supabase
      .from("item_categories")
      .delete()
      .eq("id", id);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true });
  },
);

// ========================================
// ITEMS ROUTES
// ========================================

app.get("/make-server-1e4a32a5/items", async (c) => {
  try {
    const { data, error } = await supabase
      .from("master_items")
      .select(`*, category:item_categories(name, id)`);

    if (error) throw error;
    return c.json({ success: true, data });
  } catch (error) {
    return c.json(
      { success: false, error: error.message },
      500,
    );
  }
});

app.post("/make-server-1e4a32a5/items", async (c) => {
  try {
    const item = await c.req.json();

    if (!item.itemCode) {
      return c.json(
        { success: false, error: "Item Code is required" },
        400,
      );
    }

    // FIX: Convert empty string to null for UUID field
    const categoryId =
      item.categoryId && item.categoryId.trim() !== ""
        ? item.categoryId
        : null;

    const { data, error } = await supabase
      .from("master_items")
      .upsert(
        {
          code: item.itemCode,
          name: item.itemName,
          brand_name: item.brandName,
          category: item.itemCategory, // Text fallback
          category_id: categoryId, // Link to Category Table
          uom: item.uom,
          description: item.description,
          photos: item.photos,
          is_active: item.isActive,
        },
        { onConflict: "code" },
      )
      .select()
      .single();

    if (error) throw error;
    return c.json({ success: true, data: data });
  } catch (error) {
    console.error("Save Item Error:", error);
    return c.json(
      { success: false, error: error.message },
      500,
    );
  }
});

app.delete(
  "/make-server-1e4a32a5/items/:itemCode",
  async (c) => {
    const itemCode = c.req.param("itemCode");
    const { error } = await supabase
      .from("master_items")
      .delete()
      .eq("code", itemCode);
    if (error)
      return c.json(
        { success: false, error: error.message },
        500,
      );
    return c.json({ success: true });
  },
);

// ========================================
// VENDORS ROUTES
// ========================================

app.get("/make-server-1e4a32a5/vendors", async (c) => {
  const { data, error } = await supabase.from("vendors")
    .select(`
      *,
      items:vendor_catalog_items (
        *,
        master_item:master_items (*)
      )
    `);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true, data });
});

app.post("/make-server-1e4a32a5/vendors", async (c) => {
  try {
    const vendor = await c.req.json();

    // Upsert Vendor
    const { data: vData, error: vError } = await supabase
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
          // New Legal Fields
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

    if (vError) throw vError;
    const vendorId = vData.id;

    // Handle Catalog Items
    if (vendor.items && vendor.items.length > 0) {
      const itemCodes = vendor.items.map(
        (i: any) => i.itemCode,
      );
      const { data: masterItems } = await supabase
        .from("master_items")
        .select("code, id")
        .in("code", itemCodes);

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
        await supabase
          .from("vendor_catalog_items")
          .insert(catalogItems);
      }
    } else {
      await supabase
        .from("vendor_catalog_items")
        .delete()
        .eq("vendor_id", vendorId);
    }

    return c.json({ success: true, data: vData });
  } catch (error) {
    return c.json(
      { success: false, error: error.message },
      500,
    );
  }
});

app.delete("/make-server-1e4a32a5/vendors/:code", async (c) => {
  const code = c.req.param("code");
  const { error } = await supabase
    .from("vendors")
    .delete()
    .eq("code", code);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// ========================================
// PROCUREMENT REQUESTS ROUTES (SQL MIGRATED)
// ========================================

app.get(
  "/make-server-1e4a32a5/procurement-requests",
  async (c) => {
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

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, data });
  },
);

app.post(
  "/make-server-1e4a32a5/procurement-requests",
  async (c) => {
    try {
      const request = await c.req.json();

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
        id:
          item.id && item.id.length > 30 ? item.id : undefined,
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

      return c.json({ success: true, message: "Saved" });
    } catch (error) {
      return c.json(
        { success: false, error: error.message },
        500,
      );
    }
  },
);

// ========================================
// PAYMENT METHODS ROUTES
// ========================================

app.get("/make-server-1e4a32a5/payment-methods", async (c) => {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*");
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true, data });
});

app.post("/make-server-1e4a32a5/payment-methods", async (c) => {
  const methods = await c.req.json();
  const { data, error } = await supabase
    .from("payment_methods")
    .upsert(
      methods.map((m: any) => ({
        name: m.name,
        is_active: m.isActive,
      })),
      { onConflict: "name" },
    );
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true, data });
});

Deno.serve(app.fetch);