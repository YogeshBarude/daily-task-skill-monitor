alter table public.work_tasks
  drop column if exists completion_percentage,
  drop column if exists deliverable,
  drop column if exists learnings;

update public.work_tasks
set status = 'In Progress'
where status <> 'Completed';

alter table public.learning_tasks
  drop column if exists actual_minutes;
