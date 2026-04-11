-- ============================================================
-- Міграція v3 — виконати в Supabase Dashboard → SQL Editor
-- ============================================================

-- Нові колонки в таблиці habits
alter table habits add column if not exists identity text;      -- "Я роблю це, бо я — ..."
alter table habits add column if not exists consequence text;   -- "Якщо я не роблю це..."

-- Таблиця листів собі в майбутньому
create table if not exists future_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  habit_id uuid references habits(id) on delete set null,
  target_pct integer not null default 80,
  unlock_date date not null,
  is_burned boolean not null default false,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);

alter table future_letters enable row level security;

create policy "Users can manage own letters"
  on future_letters for all using (auth.uid() = user_id);

create index if not exists future_letters_user_idx on future_letters(user_id);
