# Supabase Setup Guide

This guide explains how to set up Supabase for persistent task storage and user authentication.

## Overview

The application currently works with in-memory task storage. To add a persistent database with user-specific task isolation, follow this guide to set up Supabase (free tier).

## Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" (or sign in if you have an account)
3. Create a free account using email or GitHub
4. Confirm your email address

## Step 2: Create a New Project

1. Click "New project" in the Supabase dashboard
2. Enter:
   - **Project name**: `vyorius-drones-kanban` (or your preferred name)
   - **Database password**: Create a strong password (you won't need it for frontend)
   - **Region**: Select closest to your location
3. Click "Create new project"
4. Wait 2-3 minutes for the database to initialize

## Step 3: Get Your Credentials

Once the project is created:

1. Go to **Settings** → **API** (in the left sidebar)
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon Key** (under "Project API keys")

3. Create `.env.local` file in the `frontend/` directory:
   ```bash
   cp .env.example frontend/.env.local
   ```

4. Edit `frontend/.env.local` and paste your credentials:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 4: Create Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy and paste this SQL code:

```sql
-- Create tasks table with user relationship
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  column TEXT NOT NULL DEFAULT 'To Do',
  priority TEXT NOT NULL DEFAULT 'Medium',
  category TEXT NOT NULL DEFAULT 'Feature',
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CONSTRAINT valid_column CHECK (column IN ('To Do', 'In Progress', 'Done')),
  CONSTRAINT valid_priority CHECK (priority IN ('Low', 'Medium', 'High')),
  CONSTRAINT valid_category CHECK (category IN ('Feature', 'Bug', 'Enhancement'))
);

-- Create index for faster queries by user
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- Enable Row Level Security (users can only see their own tasks)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own tasks
CREATE POLICY "Users can only view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own tasks
CREATE POLICY "Users can only create their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own tasks
CREATE POLICY "Users can only update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own tasks
CREATE POLICY "Users can only delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);
```

4. Click "Run" to execute the SQL
5. Verify the table was created: Go to **Table Editor** and you should see "tasks" table

## Step 5: Update Backend (Optional - for Supabase Integration)

The current backend uses in-memory storage. To use Supabase:

1. Install Supabase package:
   ```bash
   cd backend
   npm install @supabase/supabase-js
   ```

2. Update `backend/server.js` to connect to Supabase:

```javascript
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
```

3. Create `.env` in backend folder:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   PORT=5000
   ```

4. Update Socket.IO handlers to use Supabase functions instead of in-memory array

## Step 6: Test the Application

1. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open http://localhost:5173 in your browser

3. **Sign up** with an email and password

4. **Create a task** - it should now be saved to Supabase

5. **Log out** and sign back in - your tasks should persist

6. **Sign in with another account** - you should only see your own tasks

## Troubleshooting

### "VITE_SUPABASE_URL is not defined"
- Make sure `.env.local` file exists in the `frontend/` directory
- Check that variable names exactly match: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart the dev server after creating `.env.local`

### Auth forms show but can't sign up
- Confirm you're using the correct Project URL and Anon Key
- Check that Supabase project is initialized and active
- In Supabase dashboard, go to **Authentication** → **Providers** and ensure "Email" is enabled

### Tasks not persisting
- Verify Row Level Security (RLS) policies are enabled
- Check that tasks table exists in Table Editor
- Check browser console for errors with `console.log(error)`

### "User does not have permission"
- This is normal with RLS enabled - policies are working correctly
- Ensure user is authenticated before creating tasks

## Next Steps

Once Supabase is configured:

1. The Auth component will work with real authentication
2. Tasks will persist in the PostgreSQL database
3. Each user sees only their own tasks
4. Data is backed up automatically by Supabase

## Free Tier Limits

Supabase free tier includes:
- ✅ 500 MB database storage
- ✅ Up to 2 GB bandwidth/month
- ✅ Up to 50,000 monthly active users
- ✅ Real-time subscriptions
- Perfect for development and small projects!

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
