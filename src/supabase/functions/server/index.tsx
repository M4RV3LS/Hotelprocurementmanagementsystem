import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

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
// PROCUREMENT REQUESTS ROUTES
// ========================================

// Get all procurement requests
app.get("/make-server-1e4a32a5/procurement-requests", async (c) => {
  try {
    const requests = await kv.getByPrefix("pr:");
    return c.json({ success: true, data: requests });
  } catch (error) {
    console.log("Error fetching procurement requests:", error);
    return c.json({ 
      success: false, 
      error: `Failed to fetch procurement requests: ${error.message}` 
    }, 500);
  }
});

// Get single procurement request by PR number
app.get("/make-server-1e4a32a5/procurement-requests/:prNumber", async (c) => {
  try {
    const prNumber = c.req.param("prNumber");
    const request = await kv.get(`pr:${prNumber}`);
    
    if (!request) {
      return c.json({ 
        success: false, 
        error: `Procurement request ${prNumber} not found` 
      }, 404);
    }
    
    return c.json({ success: true, data: request });
  } catch (error) {
    console.log("Error fetching procurement request:", error);
    return c.json({ 
      success: false, 
      error: `Failed to fetch procurement request: ${error.message}` 
    }, 500);
  }
});

// Create or update procurement request
app.post("/make-server-1e4a32a5/procurement-requests", async (c) => {
  try {
    const request = await c.req.json();
    
    if (!request.prNumber) {
      return c.json({ 
        success: false, 
        error: "PR Number is required" 
      }, 400);
    }
    
    await kv.set(`pr:${request.prNumber}`, request);
    return c.json({ 
      success: true, 
      message: `Procurement request ${request.prNumber} saved successfully`,
      data: request
    });
  } catch (error) {
    console.log("Error saving procurement request:", error);
    return c.json({ 
      success: false, 
      error: `Failed to save procurement request: ${error.message}` 
    }, 500);
  }
});

// Update multiple procurement requests (bulk update)
app.post("/make-server-1e4a32a5/procurement-requests/bulk", async (c) => {
  try {
    const requests = await c.req.json();
    
    if (!Array.isArray(requests)) {
      return c.json({ 
        success: false, 
        error: "Requests must be an array" 
      }, 400);
    }
    
    const keys = requests.map(r => `pr:${r.prNumber}`);
    await kv.mset(keys, requests);
    
    return c.json({ 
      success: true, 
      message: `${requests.length} procurement requests updated successfully`,
      data: requests
    });
  } catch (error) {
    console.log("Error bulk updating procurement requests:", error);
    return c.json({ 
      success: false, 
      error: `Failed to bulk update procurement requests: ${error.message}` 
    }, 500);
  }
});

// Delete procurement request
app.delete("/make-server-1e4a32a5/procurement-requests/:prNumber", async (c) => {
  try {
    const prNumber = c.req.param("prNumber");
    await kv.del(`pr:${prNumber}`);
    
    return c.json({ 
      success: true, 
      message: `Procurement request ${prNumber} deleted successfully` 
    });
  } catch (error) {
    console.log("Error deleting procurement request:", error);
    return c.json({ 
      success: false, 
      error: `Failed to delete procurement request: ${error.message}` 
    }, 500);
  }
});

// ========================================
// VENDORS ROUTES
// ========================================

// Get all vendors
app.get("/make-server-1e4a32a5/vendors", async (c) => {
  try {
    const vendors = await kv.getByPrefix("vendor:");
    return c.json({ success: true, data: vendors });
  } catch (error) {
    console.log("Error fetching vendors:", error);
    return c.json({ 
      success: false, 
      error: `Failed to fetch vendors: ${error.message}` 
    }, 500);
  }
});

// Get single vendor by code
app.get("/make-server-1e4a32a5/vendors/:vendorCode", async (c) => {
  try {
    const vendorCode = c.req.param("vendorCode");
    const vendor = await kv.get(`vendor:${vendorCode}`);
    
    if (!vendor) {
      return c.json({ 
        success: false, 
        error: `Vendor ${vendorCode} not found` 
      }, 404);
    }
    
    return c.json({ success: true, data: vendor });
  } catch (error) {
    console.log("Error fetching vendor:", error);
    return c.json({ 
      success: false, 
      error: `Failed to fetch vendor: ${error.message}` 
    }, 500);
  }
});

// Create or update vendor
app.post("/make-server-1e4a32a5/vendors", async (c) => {
  try {
    const vendor = await c.req.json();
    
    if (!vendor.vendorCode) {
      return c.json({ 
        success: false, 
        error: "Vendor Code is required" 
      }, 400);
    }
    
    await kv.set(`vendor:${vendor.vendorCode}`, vendor);
    return c.json({ 
      success: true, 
      message: `Vendor ${vendor.vendorCode} saved successfully`,
      data: vendor
    });
  } catch (error) {
    console.log("Error saving vendor:", error);
    return c.json({ 
      success: false, 
      error: `Failed to save vendor: ${error.message}` 
    }, 500);
  }
});

// Delete vendor
app.delete("/make-server-1e4a32a5/vendors/:vendorCode", async (c) => {
  try {
    const vendorCode = c.req.param("vendorCode");
    await kv.del(`vendor:${vendorCode}`);
    
    return c.json({ 
      success: true, 
      message: `Vendor ${vendorCode} deleted successfully` 
    });
  } catch (error) {
    console.log("Error deleting vendor:", error);
    return c.json({ 
      success: false, 
      error: `Failed to delete vendor: ${error.message}` 
    }, 500);
  }
});

// ========================================
// ITEMS ROUTES
// ========================================

// Get all items
app.get("/make-server-1e4a32a5/items", async (c) => {
  try {
    const items = await kv.getByPrefix("item:");
    return c.json({ success: true, data: items });
  } catch (error) {
    console.log("Error fetching items:", error);
    return c.json({ 
      success: false, 
      error: `Failed to fetch items: ${error.message}` 
    }, 500);
  }
});

// Get single item by code
app.get("/make-server-1e4a32a5/items/:itemCode", async (c) => {
  try {
    const itemCode = c.req.param("itemCode");
    const item = await kv.get(`item:${itemCode}`);
    
    if (!item) {
      return c.json({ 
        success: false, 
        error: `Item ${itemCode} not found` 
      }, 404);
    }
    
    return c.json({ success: true, data: item });
  } catch (error) {
    console.log("Error fetching item:", error);
    return c.json({ 
      success: false, 
      error: `Failed to fetch item: ${error.message}` 
    }, 500);
  }
});

// Create or update item
app.post("/make-server-1e4a32a5/items", async (c) => {
  try {
    const item = await c.req.json();
    
    if (!item.itemCode) {
      return c.json({ 
        success: false, 
        error: "Item Code is required" 
      }, 400);
    }
    
    await kv.set(`item:${item.itemCode}`, item);
    return c.json({ 
      success: true, 
      message: `Item ${item.itemCode} saved successfully`,
      data: item
    });
  } catch (error) {
    console.log("Error saving item:", error);
    return c.json({ 
      success: false, 
      error: `Failed to save item: ${error.message}` 
    }, 500);
  }
});

// Delete item
app.delete("/make-server-1e4a32a5/items/:itemCode", async (c) => {
  try {
    const itemCode = c.req.param("itemCode");
    await kv.del(`item:${itemCode}`);
    
    return c.json({ 
      success: true, 
      message: `Item ${itemCode} deleted successfully` 
    });
  } catch (error) {
    console.log("Error deleting item:", error);
    return c.json({ 
      success: false, 
      error: `Failed to delete item: ${error.message}` 
    }, 500);
  }
});

// ========================================
// PAYMENT METHODS ROUTES
// ========================================

// Get all payment methods
app.get("/make-server-1e4a32a5/payment-methods", async (c) => {
  try {
    const paymentMethods = await kv.get("payment-methods");
    return c.json({ 
      success: true, 
      data: paymentMethods || [] 
    });
  } catch (error) {
    console.log("Error fetching payment methods:", error);
    return c.json({ 
      success: false, 
      error: `Failed to fetch payment methods: ${error.message}` 
    }, 500);
  }
});

// Update payment methods
app.post("/make-server-1e4a32a5/payment-methods", async (c) => {
  try {
    const paymentMethods = await c.req.json();
    
    if (!Array.isArray(paymentMethods)) {
      return c.json({ 
        success: false, 
        error: "Payment methods must be an array" 
      }, 400);
    }
    
    await kv.set("payment-methods", paymentMethods);
    return c.json({ 
      success: true, 
      message: "Payment methods updated successfully",
      data: paymentMethods
    });
  } catch (error) {
    console.log("Error saving payment methods:", error);
    return c.json({ 
      success: false, 
      error: `Failed to save payment methods: ${error.message}` 
    }, 500);
  }
});

// ========================================
// INITIALIZATION ROUTE
// ========================================

// Initialize database with mock data (one-time setup)
app.post("/make-server-1e4a32a5/initialize", async (c) => {
  try {
    const { requests, vendors, items, paymentMethods } = await c.req.json();
    
    // Store procurement requests
    if (requests && Array.isArray(requests)) {
      const prKeys = requests.map(r => `pr:${r.prNumber}`);
      await kv.mset(prKeys, requests);
    }
    
    // Store vendors
    if (vendors && Array.isArray(vendors)) {
      const vendorKeys = vendors.map(v => `vendor:${v.vendorCode}`);
      await kv.mset(vendorKeys, vendors);
    }
    
    // Store items
    if (items && Array.isArray(items)) {
      const itemKeys = items.map(i => `item:${i.itemCode}`);
      await kv.mset(itemKeys, items);
    }
    
    // Store payment methods
    if (paymentMethods && Array.isArray(paymentMethods)) {
      await kv.set("payment-methods", paymentMethods);
    }
    
    return c.json({ 
      success: true, 
      message: "Database initialized successfully",
      stats: {
        requests: requests?.length || 0,
        vendors: vendors?.length || 0,
        items: items?.length || 0,
        paymentMethods: paymentMethods?.length || 0
      }
    });
  } catch (error) {
    console.log("Error initializing database:", error);
    return c.json({ 
      success: false, 
      error: `Failed to initialize database: ${error.message}` 
    }, 500);
  }
});

Deno.serve(app.fetch);