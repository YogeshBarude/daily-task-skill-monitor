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
  status text not null default 'Planned',
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

create table if not exists public.time_logs (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  linked_type text not null default 'none',
  linked_id text,
  log_type text not null default 'Work',
  date date not null,
  start_time time,
  end_time time,
  duration_minutes integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
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
alter table public.time_logs enable row level security;
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

create policy "Own time logs read" on public.time_logs for select using (auth.uid() = user_id);
create policy "Own time logs insert" on public.time_logs for insert with check (auth.uid() = user_id);
create policy "Own time logs update" on public.time_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own time logs delete" on public.time_logs for delete using (auth.uid() = user_id);

create policy "Own weekly reviews read" on public.weekly_reviews for select using (auth.uid() = user_id);
create policy "Own weekly reviews insert" on public.weekly_reviews for insert with check (auth.uid() = user_id);
create policy "Own weekly reviews update" on public.weekly_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own weekly reviews delete" on public.weekly_reviews for delete using (auth.uid() = user_id);

create table if not exists public.income_entries (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  source_name text not null,
  income_type text not null,
  amount numeric not null default 0,
  received_date date not null,
  month text not null,
  is_recurring boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  amount numeric not null default 0,
  expense_date date not null,
  expense_time time,
  category text not null,
  sub_category text,
  payment_mode text,
  expense_nature text,
  notes text,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emis (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  emi_name text not null,
  emi_type text not null,
  emi_amount numeric not null default 0,
  due_day integer not null,
  start_date date not null,
  end_date date,
  total_loan_amount numeric,
  interest_rate numeric,
  lender_name text,
  is_recurring boolean not null default true,
  status text not null default 'Upcoming',
  reminder_days_before integer not null default 3,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emi_payments (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  emi_id text references public.emis(id) on delete cascade,
  payment_month text not null,
  payment_date date not null,
  amount_paid numeric not null default 0,
  status text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_goals (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  goal_name text not null,
  target_amount numeric not null default 0,
  current_saved_amount numeric not null default 0,
  target_date date not null,
  priority text not null default 'Medium',
  linked_investment_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investments (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  investment_name text not null,
  investment_type text not null,
  platform text,
  amount_invested numeric not null default 0,
  current_value numeric not null default 0,
  investment_date date not null,
  ticker_symbol text,
  isin text,
  market_exchange text,
  units numeric not null default 0,
  average_buy_price numeric not null default 0,
  current_price numeric not null default 0,
  linked_goal_id text references public.financial_goals(id) on delete set null,
  risk_level text not null default 'Medium',
  notes text,
  gain_loss numeric not null default 0,
  return_percentage numeric not null default 0,
  price_source text,
  price_update_status text,
  last_price_updated_at timestamptz,
  is_price_tracking_enabled boolean not null default false,
  manual_current_value numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_value_history (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  investment_id text references public.investments(id) on delete cascade,
  value_date date not null,
  current_price numeric not null default 0,
  current_value numeric not null default 0,
  amount_invested numeric not null default 0,
  gain_loss numeric not null default 0,
  return_percentage numeric not null default 0,
  price_source text,
  update_type text not null default 'manual',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_finance_reviews (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  month text not null,
  went_well text,
  overspent_areas text,
  avoidable_expenses text,
  emis_paid_summary text,
  investments_made_summary text,
  savings_summary text,
  next_month_plan text,
  notes text,
  auto_summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create table if not exists public.finance_settings (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  default_currency text not null default 'INR',
  default_monthly_income numeric not null default 0,
  month_start_date integer not null default 1,
  emi_reminder_days integer not null default 3,
  investment_update_reminder_frequency text not null default 'Weekly',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_income_entries_updated_at on public.income_entries;
create trigger set_income_entries_updated_at before update on public.income_entries for each row execute function public.set_updated_at();
drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();
drop trigger if exists set_emis_updated_at on public.emis;
create trigger set_emis_updated_at before update on public.emis for each row execute function public.set_updated_at();
drop trigger if exists set_emi_payments_updated_at on public.emi_payments;
create trigger set_emi_payments_updated_at before update on public.emi_payments for each row execute function public.set_updated_at();
drop trigger if exists set_investments_updated_at on public.investments;
create trigger set_investments_updated_at before update on public.investments for each row execute function public.set_updated_at();
drop trigger if exists set_financial_goals_updated_at on public.financial_goals;
create trigger set_financial_goals_updated_at before update on public.financial_goals for each row execute function public.set_updated_at();
drop trigger if exists set_monthly_finance_reviews_updated_at on public.monthly_finance_reviews;
create trigger set_monthly_finance_reviews_updated_at before update on public.monthly_finance_reviews for each row execute function public.set_updated_at();
drop trigger if exists set_finance_settings_updated_at on public.finance_settings;
create trigger set_finance_settings_updated_at before update on public.finance_settings for each row execute function public.set_updated_at();

alter table public.income_entries enable row level security;
alter table public.expenses enable row level security;
alter table public.emis enable row level security;
alter table public.emi_payments enable row level security;
alter table public.investments enable row level security;
alter table public.investment_value_history enable row level security;
alter table public.financial_goals enable row level security;
alter table public.monthly_finance_reviews enable row level security;
alter table public.finance_settings enable row level security;

create policy "Own income entries read" on public.income_entries for select using (auth.uid() = user_id);
create policy "Own income entries insert" on public.income_entries for insert with check (auth.uid() = user_id);
create policy "Own income entries update" on public.income_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own income entries delete" on public.income_entries for delete using (auth.uid() = user_id);

create policy "Own expenses read" on public.expenses for select using (auth.uid() = user_id);
create policy "Own expenses insert" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Own expenses update" on public.expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own expenses delete" on public.expenses for delete using (auth.uid() = user_id);

create policy "Own emis read" on public.emis for select using (auth.uid() = user_id);
create policy "Own emis insert" on public.emis for insert with check (auth.uid() = user_id);
create policy "Own emis update" on public.emis for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own emis delete" on public.emis for delete using (auth.uid() = user_id);

create policy "Own emi payments read" on public.emi_payments for select using (auth.uid() = user_id);
create policy "Own emi payments insert" on public.emi_payments for insert with check (auth.uid() = user_id);
create policy "Own emi payments update" on public.emi_payments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own emi payments delete" on public.emi_payments for delete using (auth.uid() = user_id);

create policy "Own investments read" on public.investments for select using (auth.uid() = user_id);
create policy "Own investments insert" on public.investments for insert with check (auth.uid() = user_id);
create policy "Own investments update" on public.investments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own investments delete" on public.investments for delete using (auth.uid() = user_id);

create policy "Own investment history read" on public.investment_value_history for select using (auth.uid() = user_id);
create policy "Own investment history insert" on public.investment_value_history for insert with check (auth.uid() = user_id);
create policy "Own investment history update" on public.investment_value_history for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own investment history delete" on public.investment_value_history for delete using (auth.uid() = user_id);

create policy "Own financial goals read" on public.financial_goals for select using (auth.uid() = user_id);
create policy "Own financial goals insert" on public.financial_goals for insert with check (auth.uid() = user_id);
create policy "Own financial goals update" on public.financial_goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own financial goals delete" on public.financial_goals for delete using (auth.uid() = user_id);

create policy "Own monthly finance reviews read" on public.monthly_finance_reviews for select using (auth.uid() = user_id);
create policy "Own monthly finance reviews insert" on public.monthly_finance_reviews for insert with check (auth.uid() = user_id);
create policy "Own monthly finance reviews update" on public.monthly_finance_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own monthly finance reviews delete" on public.monthly_finance_reviews for delete using (auth.uid() = user_id);

create policy "Own finance settings read" on public.finance_settings for select using (auth.uid() = user_id);
create policy "Own finance settings insert" on public.finance_settings for insert with check (auth.uid() = user_id);
create policy "Own finance settings update" on public.finance_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own finance settings delete" on public.finance_settings for delete using (auth.uid() = user_id);
