alter table public.work_tasks
  add column if not exists product_owner text,
  add column if not exists received_date date,
  add column if not exists due_date date,
  add column if not exists completion_percentage integer not null default 0;

update public.work_tasks
set
  product_owner = coalesce(nullif(product_owner, ''), nullif(poc, ''), 'Personal'),
  received_date = coalesce(received_date, assigned_date),
  due_date = coalesce(due_date, assigned_date),
  completion_percentage = case
    when status = 'Completed' then 100
    else completion_percentage
  end
where
  product_owner is null
  or received_date is null
  or due_date is null
  or (status = 'Completed' and completion_percentage < 100);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_tasks_completion_percentage_range'
      and conrelid = 'public.work_tasks'::regclass
  ) then
    alter table public.work_tasks
      add constraint work_tasks_completion_percentage_range
      check (completion_percentage between 0 and 100) not valid;
  end if;
end
$$;

alter table public.work_tasks
  validate constraint work_tasks_completion_percentage_range;
