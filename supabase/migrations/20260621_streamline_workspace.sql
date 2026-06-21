alter table public.work_tasks
  drop column if exists received_date,
  drop column if exists day_of_week;

alter table public.weekly_reviews
  drop column if exists incomplete_summary,
  drop column if exists skills_improved,
  drop column if exists work_highlights,
  drop column if exists improvement_areas;
