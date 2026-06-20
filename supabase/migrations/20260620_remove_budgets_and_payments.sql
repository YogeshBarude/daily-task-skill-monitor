drop table if exists public.category_budgets cascade;
drop table if exists public.budgets cascade;
drop table if exists public.upcoming_payments cascade;

alter table public.finance_settings
  drop column if exists budget_alert_threshold;
