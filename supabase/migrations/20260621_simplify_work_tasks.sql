update public.work_tasks
set priority = 'Low'
where priority not in ('Low', 'High');

alter table public.work_tasks
  alter column priority set default 'Low',
  drop column if exists actual_minutes,
  drop column if exists work_type;
