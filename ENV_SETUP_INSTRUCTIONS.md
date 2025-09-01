# 🔧 Environment Variables Setup

## ❌ Current Issue
Your `.env.local` file is empty! That's why you're getting the "supabaseUrl is required" error.

## 🛠️ How to Fix

### Step 1: Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (long string starting with `eyJ`)

### Step 2: Fill Your .env.local File

Open your `.env.local` file and add these lines:

```bash
# Supabase Configuration - REPLACE WITH YOUR ACTUAL VALUES
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_anon_key_here

# OpenAI Configuration (for future AI agents)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Development settings
NODE_ENV=development
```

### Step 3: Restart Your Dev Server

After saving the file:
```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
```

## 🔍 How to Verify It's Working

1. Visit: `http://localhost:3000/api/test-connection`
2. You should see: `{"success": true, "message": "All connections successful"}`

## ⚠️ Important Notes

- **Never commit your .env.local file** to git (it's already in .gitignore)
- **Double-check your credentials** - copy them exactly from Supabase
- **Make sure to use NEXT_PUBLIC_** prefix for the Supabase variables
- **Restart your dev server** after making changes

## 🆘 Still Having Issues?

Run this command to see what environment variables are actually loaded:
```bash
curl http://localhost:3000/api/test-connection
```

The error messages will now be much more helpful and tell you exactly what's missing!
