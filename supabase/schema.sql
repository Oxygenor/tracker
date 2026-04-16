-- ============================================================
-- Habit Tracker — Supabase Schema
-- Виконати в: Supabase Dashboard → SQL Editor
-- ============================================================

-- Таблиця звичок
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('binary', 'counter', 'streak_free')),
  icon text not null default '⭐',
  color text not null default '#8b5cf6',
  unit text,
  target_value numeric,
  reminder_time time,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Таблиця логів (щоденних відміток)
create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  value numeric not null default 1,
  note text,
  created_at timestamptz not null default now(),
  unique(habit_id, date)
);

-- Міграція: нові колонки (виконати якщо таблиці вже існують)
alter table habits add column if not exists category text default 'general';
alter table habits add column if not exists sort_order integer default 0;
alter table habits add column if not exists freeze_count integer default 3;

-- Нові колонки v2
alter table habits add column if not exists motivation text;
alter table habits add column if not exists stakes_xp integer default 0;
alter table habits add column if not exists frequency text default 'daily'; -- 'daily' | 'weekly'
alter table habits add column if not exists frequency_days integer[] default '{0,1,2,3,4,5,6}'; -- дні тижня 0=нд..6=сб

-- Настрій після виконання
alter table habit_logs add column if not exists mood integer; -- 1-5
alter table habit_logs add column if not exists is_partial boolean default false; -- 2-хвилинне правило

-- Таблиця поганих днів
create table if not exists bad_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

alter table bad_days enable row level security;

create policy "Users can view own bad days"
  on bad_days for select using (auth.uid() = user_id);
create policy "Users can insert own bad days"
  on bad_days for insert with check (auth.uid() = user_id);
create policy "Users can delete own bad days"
  on bad_days for delete using (auth.uid() = user_id);

-- Індекси для швидкого пошуку
create index if not exists habits_user_id_idx on habits(user_id);
create index if not exists habit_logs_habit_id_idx on habit_logs(habit_id);
create index if not exists habit_logs_user_date_idx on habit_logs(user_id, date);
create index if not exists bad_days_user_date_idx on bad_days(user_id, date);

-- Row Level Security (RLS) — кожен бачить лише свої дані
alter table habits enable row level security;
alter table habit_logs enable row level security;

-- Policies для habits
create policy "Users can view own habits"
  on habits for select using (auth.uid() = user_id);

create policy "Users can insert own habits"
  on habits for insert with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on habits for update using (auth.uid() = user_id);

create policy "Users can delete own habits"
  on habits for delete using (auth.uid() = user_id);

-- Policies для habit_logs
create policy "Users can view own logs"
  on habit_logs for select using (auth.uid() = user_id);

create policy "Users can insert own logs"
  on habit_logs for insert with check (auth.uid() = user_id);

create policy "Users can update own logs"
  on habit_logs for update using (auth.uid() = user_id);

create policy "Users can delete own logs"
  on habit_logs for delete using (auth.uid() = user_id);
