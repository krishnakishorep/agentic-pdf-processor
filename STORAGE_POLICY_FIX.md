# 🔧 Fix Storage Upload Error

## ❌ Current Issue
Upload failing with: "new row violates row-level security policy"

This means your `pdf-documents` bucket exists but doesn't have the correct policies for uploads.

## 🛠️ How to Fix

### Step 1: Go to Storage Policies
1. **Supabase Dashboard** → **Storage**
2. **Click on your `pdf-documents` bucket**
3. **Go to "Policies" tab**

### Step 2: Add Upload Policy
Click **"New Policy"** and add this policy:

**Policy Name**: `Allow public uploads`  
**Policy Type**: `INSERT`  
**Target Role**: `public`  
**SQL Policy**:
```sql
(bucket_id = 'pdf-documents'::text)
```

### Step 3: Add Read Policy
Click **"New Policy"** again and add:

**Policy Name**: `Allow public reads`  
**Policy Type**: `SELECT`  
**Target Role**: `public`  
**SQL Policy**:
```sql
(bucket_id = 'pdf-documents'::text)
```

### Step 4: Add Delete Policy (Optional)
For cleanup functionality, add:

**Policy Name**: `Allow public deletes`  
**Policy Type**: `DELETE`  
**Target Role**: `public`  
**SQL Policy**:
```sql
(bucket_id = 'pdf-documents'::text)
```

## 🚀 Alternative: Quick SQL Method

You can also run this SQL in the **SQL Editor**:

```sql
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public uploads to pdf-documents bucket
CREATE POLICY "Allow public uploads to pdf-documents" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'pdf-documents');

-- Allow public reads from pdf-documents bucket
CREATE POLICY "Allow public reads from pdf-documents" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'pdf-documents');

-- Allow public deletes from pdf-documents bucket (optional)
CREATE POLICY "Allow public deletes from pdf-documents" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'pdf-documents');
```

## ✅ After Fix

Your upload should work immediately after adding these policies!
