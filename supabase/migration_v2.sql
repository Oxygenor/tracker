-- ============================================================
-- Міграція v2 — виконати в Supabase Dashboard → SQL Editor
-- Тільки нові зміни (не перестворює існуючі таблиці та policies)
-- ============================================================

-- Нові колонки в таблиці habits
alter table habits add column if not exists motivation text;
alter table habits add column if not exists stakes_xp integer default 0;
alter table habits add column if not exists frequency text default 'daily';
alter table habits add column if not exists frequency_days integer[] default '{0,1,2,3,4,5,6}';

-- Настрій в таблиці habit_logs
alter table habit_logs add column if not exists mood integer;

-- Нова таблиця поганих днів
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

-- Індекс для bad_days
create index if not exists bad_days_user_date_idx on bad_days(user_id, date);
