# Ever Work - Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Enter details:
   - **Name:** `ever-work`
   - **Database Password:** (Generate strong password)
   - **Region:** Choose closest to your users
5. Wait for project to be created (~2 minutes)

## 2. Database Schema

Run this SQL in the SQL Editor:

```sql
-- Enable Row Level Security
alter table auth.users enable row level security;

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  daily_goal_hours integer default 8,
  currency text default '$',
  timezone text default 'UTC',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Jobs table
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text not null,
  hourly_rate decimal(10,2),
  icon text default 'briefcase',
  is_archived boolean default false,
  total_hours_accumulated decimal(10,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on jobs
alter table public.jobs enable row level security;

-- Policies for jobs
create policy "Users can CRUD own jobs" on public.jobs
  for all using (auth.uid() = user_id);

-- Sessions table
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  job_id uuid references public.jobs on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration_seconds integer,
  date date not null,
  note text,
  earnings decimal(10,2),
  is_manually_edited boolean default false,
  edited_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on sessions
alter table public.sessions enable row level security;

-- Policies for sessions
create policy "Users can CRUD own sessions" on public.sessions
  for all using (auth.uid() = user_id);

-- Active timers table (for real-time tracking)
create table public.active_timers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  job_id uuid references public.jobs on delete cascade not null,
  session_id uuid references public.sessions on delete cascade,
  server_start_time timestamp with time zone default timezone('utc'::text, now()) not null,
  client_start_time timestamp with time zone not null,
  note text,
  is_running boolean default true,
  last_sync_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on active_timers
alter table public.active_timers enable row level security;

-- Policies for active_timers
create policy "Users can CRUD own active timers" on public.active_timers
  for all using (auth.uid() = user_id);

-- Achievements table
create table public.achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on achievements
alter table public.achievements enable row level security;

-- Policies for achievements
create policy "Users can view own achievements" on public.achievements
  for select using (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate achievements
create unique index idx_user_achievement_type on public.achievements(user_id, type);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Triggers for updated_at
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_job_updated
  before update on public.jobs
  for each row execute procedure public.handle_updated_at();

-- Function to get server timestamp (for accurate time tracking)
create or replace function public.get_server_time()
returns timestamp with time zone as $$
begin
  return timezone('utc'::text, now());
end;
$$ language plpgsql security definer;

-- Indexes for performance
create index idx_jobs_user_id on public.jobs(user_id);
create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_job_id on public.sessions(job_id);
create index idx_sessions_date on public.sessions(date);
create index idx_active_timers_user_id on public.active_timers(user_id);

-- Function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile after signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 3. Get API Keys

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** API key

## 4. Enable Auth Providers

1. Go to Authentication → Providers
2. Enable **Email** provider
3. (Optional) Enable Google, GitHub, etc.

## 5. Environment Variables

Add to your deployment platform:

```
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

For local development, the app will use these values from `config.js`.

## 6. Real-time Subscriptions

Enable real-time for these tables in Database → Replication:
- jobs
- sessions
- active_timers

This allows instant sync across devices.

---

## Security Notes

- Row Level Security (RLS) ensures users can only access their own data
- All timestamps are stored in UTC, converted to user's timezone on client
- Active timers use server time to prevent time manipulation
- Sessions can be edited but are marked with `is_manually_edited` flag
