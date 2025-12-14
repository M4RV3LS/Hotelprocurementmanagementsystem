# Database Setup Guide

This guide will help you set up your Supabase database for the Hotel Procurement Management System.

## Prerequisites

- A Supabase project created
- Your Supabase project credentials (Project URL, Anon Key, Service Role Key)

## Setup Steps

### Step 1: Run the SQL Migration

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `/supabase/migrations/001_initial_schema.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

This will create all necessary tables:
- `payment_methods`
- `item_categories`
- `master_items`
- `vendors`
- `vendor_catalog_items`
- `procurement_requests`
- `request_items`
- `activity_logs`
- `purchase_orders`

### Step 2: Create Storage Buckets

The application needs storage buckets for file uploads:

1. Navigate to **Storage** in your Supabase Dashboard
2. Click **Create a new bucket**
3. Create a bucket named: `Delivery Proof`
   - Set it to **Public** (or Private if you prefer signed URLs)
   - Click **Create bucket**

### Step 3: Verify Table Creation

1. Go to **Table Editor** in your Supabase Dashboard
2. You should see all 9 tables listed
3. Each table should have the proper columns and indexes

### Step 4: Run the Application

1. The application will automatically detect if the database is empty
2. On first run, it will seed the database with initial data:
   - Sample procurement requests
   - Sample vendors
   - Sample items
   - Default payment methods

### What Gets Seeded Automatically

When you run the app for the first time with an empty database, it will automatically populate:

✅ **Payment Methods**
- Cash Before Delivery
- Payment Terms - NET 30
- Payment Terms - NET 45
- Bank Transfer
- Credit Card
- Cash on Delivery (COD)

✅ **Master Items** (Sample items from seed data)
- Various operational items
- Furniture items
- Cleaning supplies

✅ **Vendors** (Sample vendors from seed data)
- Multiple vendors with different regions
- Vendor item catalogs with pricing

✅ **Procurement Requests** (Sample requests from seed data)
- Multiple PRs in various statuses
- With items assigned to vendors

## Troubleshooting

### Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error means the application is trying to reach API endpoints that don't exist. **This is now fixed** - all API calls now use Supabase client directly instead of HTTP endpoints.

### Error: Table does not exist

If you get "relation does not exist" errors:
1. Make sure you ran the SQL migration script
2. Check that all tables are visible in the Table Editor
3. Verify your Supabase credentials are correct

### Error: Storage bucket not found

If file uploads fail:
1. Make sure you created the "Delivery Proof" storage bucket
2. Verify the bucket permissions are set correctly
3. Check storage policies allow uploads

### Database is not seeding automatically

If the database doesn't seed on first run:
1. Check the browser console for errors
2. Verify your Supabase credentials
3. Check RLS policies are set correctly
4. Make sure the anon key has proper permissions

### Need to reset the database?

To clear all data and reseed:

1. Go to SQL Editor in Supabase
2. Run these commands in order:

```sql
-- Clear all data (respects foreign key constraints)
DELETE FROM activity_logs;
DELETE FROM request_items;
DELETE FROM purchase_orders;
DELETE FROM procurement_requests;
DELETE FROM vendor_catalog_items;
DELETE FROM vendors;
DELETE FROM master_items;
DELETE FROM item_categories;
DELETE FROM payment_methods;
```

3. Refresh the application - it will automatically reseed

## Database Schema Overview

### Core Tables

1. **payment_methods** - Payment method configurations
2. **item_categories** - Item category classifications
3. **master_items** - Master item catalog
4. **vendors** - Vendor information and legal details
5. **vendor_catalog_items** - Items each vendor can supply with pricing
6. **procurement_requests** - PR headers
7. **request_items** - Line items for each PR
8. **activity_logs** - Audit trail for PR actions
9. **purchase_orders** - Generated POs

### Key Relationships

```
procurement_requests (1) ──→ (many) request_items
request_items (many) ──→ (1) master_items
request_items (many) ──→ (1) vendors
request_items (many) ──→ (1) purchase_orders
purchase_orders (many) ──→ (1) vendors
vendors (1) ──→ (many) vendor_catalog_items (many) ──→ (1) master_items
```

## Security Notes

The current RLS policies allow all operations for development purposes. For production:

1. Implement proper authentication
2. Update RLS policies to restrict access
3. Consider separating read/write permissions
4. Add user role-based access control

## Next Steps

After setup:
1. ✅ Database tables created
2. ✅ Storage buckets created
3. ✅ Initial data seeded
4. 🎉 Start using the application!

You can now:
- Create new procurement requests
- Configure vendors and items
- Generate purchase orders
- Track delivery status
- Manage the entire procurement workflow

## Support

If you encounter issues:
1. Check the browser console for detailed errors
2. Verify Supabase credentials in `/utils/supabase/info.tsx`
3. Review the RLS policies in your Supabase dashboard
4. Check that all tables and indexes were created successfully
