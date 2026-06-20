alter table public.upcoming_payments
  add column if not exists billing_day integer,
  add column if not exists due_day integer,
  add column if not exists reminder_days_before integer not null default 3;

update public.upcoming_payments
set
  due_day = coalesce(due_day, extract(day from due_date)::integer),
  reminder_days_before = greatest(
    0,
    coalesce(due_date - reminder_date, reminder_days_before, 3)
  )
where due_day is null
   or reminder_days_before is null;

alter table public.upcoming_payments
  drop constraint if exists upcoming_payments_billing_day_check,
  add constraint upcoming_payments_billing_day_check check (billing_day is null or billing_day between 1 and 31),
  drop constraint if exists upcoming_payments_due_day_check,
  add constraint upcoming_payments_due_day_check check (due_day is null or due_day between 1 and 31),
  drop constraint if exists upcoming_payments_reminder_days_check,
  add constraint upcoming_payments_reminder_days_check check (reminder_days_before between 0 and 30);
