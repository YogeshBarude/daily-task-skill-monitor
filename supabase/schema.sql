create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1), 'User')
  )
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.work_tasks (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  project_name text,
  product_owner text,
  platform text,
  poc text,
  category text,
  description text,
  received_date date,
  assigned_date date not null,
  due_date date,
  day_of_week text,
  estimated_minutes integer not null default 0,
  actual_minutes integer not null default 0,
  completion_percentage integer not null default 0,
  status text not null default 'In Progress',
  priority text not null default 'Medium',
  work_type text not null default 'Other',
  notes text,
  deliverable text,
  blockers text,
  learnings text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  skill_name text not null,
  category text not null default 'Other',
  current_level text not null default 'Beginner',
  target_level text not null default 'Advanced',
  weekly_target_minutes integer not null default 0,
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_tasks (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  skill_id text references public.skills(id) on delete set null,
  title text not null,
  learning_type text not null default 'Practice',
  planned_date date not null,
  planned_minutes integer not null default 0,
  actual_minutes integer not null default 0,
  status text not null default 'Planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_reviews (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  week_start_date date not null,
  week_end_date date not null,
  completed_summary text,
  incomplete_summary text,
  blockers text,
  key_learnings text,
  skills_improved text,
  work_highlights text,
  improvement_areas text,
  next_week_plan text,
  auto_summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_work_tasks_updated_at on public.work_tasks;
create trigger set_work_tasks_updated_at before update on public.work_tasks for each row execute function public.set_updated_at();

drop trigger if exists set_skills_updated_at on public.skills;
create trigger set_skills_updated_at before update on public.skills for each row execute function public.set_updated_at();

drop trigger if exists set_learning_tasks_updated_at on public.learning_tasks;
create trigger set_learning_tasks_updated_at before update on public.learning_tasks for each row execute function public.set_updated_at();

drop trigger if exists set_weekly_reviews_updated_at on public.weekly_reviews;
create trigger set_weekly_reviews_updated_at before update on public.weekly_reviews for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.work_tasks enable row level security;
alter table public.skills enable row level security;
alter table public.learning_tasks enable row level security;
alter table public.weekly_reviews enable row level security;

create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Own work tasks read" on public.work_tasks for select using (auth.uid() = user_id);
create policy "Own work tasks insert" on public.work_tasks for insert with check (auth.uid() = user_id);
create policy "Own work tasks update" on public.work_tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own work tasks delete" on public.work_tasks for delete using (auth.uid() = user_id);

create policy "Own skills read" on public.skills for select using (auth.uid() = user_id);
create policy "Own skills insert" on public.skills for insert with check (auth.uid() = user_id);
create policy "Own skills update" on public.skills for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own skills delete" on public.skills for delete using (auth.uid() = user_id);

create policy "Own learning tasks read" on public.learning_tasks for select using (auth.uid() = user_id);
create policy "Own learning tasks insert" on public.learning_tasks for insert with check (auth.uid() = user_id);
create policy "Own learning tasks update" on public.learning_tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own learning tasks delete" on public.learning_tasks for delete using (auth.uid() = user_id);

create policy "Own weekly reviews read" on public.weekly_reviews for select using (auth.uid() = user_id);
create policy "Own weekly reviews insert" on public.weekly_reviews for insert with check (auth.uid() = user_id);
create policy "Own weekly reviews update" on public.weekly_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own weekly reviews delete" on public.weekly_reviews for delete using (auth.uid() = user_id);
