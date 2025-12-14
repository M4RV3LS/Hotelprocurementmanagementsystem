# 🚀 Quick Start Guide

Get your Hotel Procurement Management System up and running in 5 minutes!

## ⚡ Quick Setup (5 Minutes)

### Step 1: Run Database Migration (2 min)
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `/supabase/migrations/001_initial_schema.sql` in this project
5. Copy ALL the SQL code
6. Paste into Supabase SQL Editor
7. Click **RUN** button (bottom right)
8. ✅ Wait for "Success. No rows returned" message

### Step 2: Create Storage Bucket (1 min)
1. In Supabase Dashboard, click **Storage** in left sidebar
2. Click **Create a new bucket**
3. Name it exactly: `Delivery Proof`
4. Set visibility: **Public**
5. Click **Create bucket**

### Step 3: Launch Application (1 min)
1. Refresh your application page
2. Wait for "Loading system data..." message
3. App will automatically seed sample data
4. ✅ You're ready to go!

### Step 4: Verify Everything Works (1 min)
1. Check **Configuration** tab - should see vendors and items
2. Check **Procurement Dashboard** - should see sample PRs
3. Try creating a new PR - should work!

## 🎉 You're Done!

Your procurement system is now fully operational with:
- ✅ 9 database tables created
- ✅ Sample vendors configured
- ✅ Sample items in catalog
- ✅ Sample PRs with various statuses
- ✅ Payment methods configured
- ✅ Storage bucket for file uploads

## 🧪 Try These Features

### Create a New Procurement Request
1. Go to **Procurement Dashboard**
2. Click **+ Create New PR**
3. Fill in property and requestor details
4. Add items with quantities
5. Save - your PR is created!

### Configure Vendors
1. Go to **Configuration** tab
2. Click **Vendor Management**
3. Add/Edit vendors
4. Assign items they can supply
5. Set pricing and payment terms

### Generate a Purchase Order
1. In **Procurement Dashboard**, find a PR
2. Assign vendors to items
3. Click **Generate PO**
4. Review and confirm
5. PO is created and linked to items!

### Track Deliveries
1. Go to **List PO** tab
2. Find an approved PO
3. Click **Link Proof** to upload delivery proof
4. Mark items as delivered
5. PO auto-closes when all items delivered!

## 📊 What You Get Out of the Box

### Sample Data Included
- **5+ Sample PRs** in various workflow stages
- **10+ Sample Vendors** with item catalogs
- **20+ Sample Items** across categories
- **6 Payment Methods** pre-configured
- **Activity Logs** tracking all actions

### All Features Working
✅ Multi-item PRs with grouping  
✅ Item-level vendor assignment  
✅ PO generation and approval  
✅ Delivery tracking with proofs  
✅ Item rejection workflow  
✅ Status badges and filtering  
✅ Search and sort capabilities  
✅ Responsive desktop layout  

## 🆘 Something Not Working?

### Error: "Database Setup Required"
**Solution:** You need to run the SQL migration first (Step 1 above)

### Error: Tables don't appear
**Solution:** 
1. Make sure you ran the ENTIRE SQL script
2. Check for error messages in SQL Editor
3. Verify all 9 tables exist in Table Editor

### Error: Storage upload fails
**Solution:**
1. Make sure bucket "Delivery Proof" exists
2. Check bucket is set to Public
3. Verify bucket name is exactly correct (case-sensitive)

### Error: Configuration data won't load
**Solution:**
1. Check browser console for specific errors
2. Verify Supabase credentials are correct
3. Make sure RLS policies were created (part of SQL script)
4. Try refreshing the page

### Still Having Issues?
1. Open browser console (F12)
2. Look for specific error messages
3. Check `/FIX_SUMMARY.md` for detailed troubleshooting
4. Review `/DATABASE_SETUP.md` for complete setup guide

## 📚 Documentation Files

- **QUICK_START.md** (this file) - Get started in 5 minutes
- **DATABASE_SETUP.md** - Detailed setup instructions
- **FIX_SUMMARY.md** - Technical details of the fix
- **README** files in `/guidelines/` - Feature documentation

## 🎯 Next Steps

Once everything is working:

1. **Customize Your Data**
   - Add your real vendors
   - Configure your items catalog
   - Set up your payment methods

2. **Create Real PRs**
   - Start creating actual procurement requests
   - Assign to real vendors
   - Generate real POs

3. **Configure Workflows**
   - Adjust status flows to match your process
   - Set up vendor approval requirements
   - Configure delivery tracking

4. **Prepare for Production**
   - Implement user authentication
   - Restrict RLS policies
   - Add role-based access control
   - Set up email notifications (if needed)

## 💡 Pro Tips

- **Auto-seeding**: First run automatically populates sample data
- **Data persistence**: All changes are saved to Supabase database
- **Real-time**: Data updates immediately across all views
- **File storage**: Delivery proofs and documents stored in Supabase Storage
- **Audit trail**: All actions logged in activity_logs table

## 🎊 Enjoy Your Procurement System!

You now have a fully functional procurement management system. Happy procuring! 🎉
