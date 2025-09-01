# 🚀 Supabase Setup Guide

Follow these steps to configure Supabase for your Agentic PDF Processor.

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Create a new organization or select existing one
4. Create a new project:
   - **Project Name**: `agentic-pdf-processor` (or your preferred name)
   - **Database Password**: Choose a secure password
   - **Region**: Select closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

## 2. Get Your Project Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public key** (starts with `eyJ...`)

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI Configuration (for agents)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Optional: Rate limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=3600000

# Development settings
NODE_ENV=development
```

## 4. Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql` 
3. Paste into the SQL Editor and click **Run**
4. Wait for all tables and indexes to be created

## 5. Configure Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Create bucket with these settings:
   - **Name**: `pdf-documents`
   - **Public bucket**: ✅ **Yes** (for open platform access)
   - **File size limit**: `50 MB` (adjust as needed)
   - **Allowed MIME types**: `application/pdf`

## 6. Set Storage Policies

In the **Storage** section, click on your `pdf-documents` bucket, then **Policies**:

### Upload Policy
```sql
CREATE POLICY "Anyone can upload PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pdf-documents' 
    AND (storage.extension(name) = 'pdf')
  );
```

### Read Policy
```sql
CREATE POLICY "Anyone can view PDFs" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdf-documents');
```

### Delete Policy (Optional - for cleanup)
```sql
CREATE POLICY "Anyone can delete PDFs" ON storage.objects
  FOR DELETE USING (bucket_id = 'pdf-documents');
```

## 7. Verify Setup

Run this test query in **SQL Editor** to verify your setup:

```sql
-- Test document insert
INSERT INTO documents (filename, file_path, file_size) 
VALUES ('test.pdf', 'documents/test.pdf', 1024);

-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('documents', 'document_analysis', 'extracted_data', 'agent_tasks', 'generated_content');

-- Clean up test data
DELETE FROM documents WHERE filename = 'test.pdf';
```

## 8. Optional: Enable Realtime (for live updates)

If you want real-time updates in your UI:

1. Go to **Database** → **Replication**
2. Enable replication for these tables:
   - `documents`
   - `document_analysis` 
   - `agent_tasks`

## 9. Development Database Access

For local development, you might want to enable direct database access:

1. Go to **Settings** → **Database**
2. Note the **Connection string** for direct database access
3. Enable **Use connection pooling** if you expect high traffic

## 🔒 Security Notes

Since this is an open platform (no authentication):

- ✅ **Public read/write access** is enabled for all tables
- ✅ **File storage** is public for easy sharing
- ⚠️ **Rate limiting** should be implemented at the application level
- ⚠️ **Consider adding cleanup policies** for old documents
- ⚠️ **Monitor usage** to prevent abuse

## 🧹 Maintenance

Add these to your project for ongoing maintenance:

### Cleanup Script (run weekly)
```sql
-- Delete documents older than 7 days
DELETE FROM documents 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Delete failed processing tasks older than 1 day  
DELETE FROM agent_tasks 
WHERE status = 'failed' AND created_at < NOW() - INTERVAL '1 day';
```

### Storage Cleanup
```sql
-- List large files
SELECT name, metadata->'size' as size_bytes
FROM storage.objects 
WHERE bucket_id = 'pdf-documents'
ORDER BY (metadata->'size')::int DESC
LIMIT 10;
```

## ✅ Setup Complete!

Your Supabase backend is now ready for the Agentic PDF Processor. You can start uploading PDFs and processing them with AI agents!

## Next Steps

1. Test the upload functionality in your app
2. Verify documents appear in the `documents` table
3. Check that files are stored in the `pdf-documents` bucket
4. Start implementing your first agent (Document Analysis Agent)

## Troubleshooting

### Common Issues

**Connection Error**: 
- Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check that your project is not paused (free tier pauses after inactivity)

**Upload Errors**:
- Ensure storage bucket policies are set correctly
- Check file size limits (default 50MB)
- Verify MIME type restrictions

**Database Errors**:
- Check that all tables were created successfully
- Verify RLS policies are enabled and configured
- Look at the Supabase logs in the dashboard
