update public.learning_tasks
set
  status = case when status = 'Completed' then 'Done' else status end,
  learning_type = case
    when learning_type in ('Video', 'Course') then 'Watch'
    when learning_type in ('Article', 'Documentation') then 'Read'
    when learning_type = 'Project' then 'Build'
    when learning_type = 'Revision' then 'Review'
    else 'Practice'
  end;

update public.skills
set category = case
  when category in ('Coding', 'Technical', 'AI', 'Analytics', 'Cloud') then 'Coding'
  when category = 'Communication' then 'Language'
  else 'Other'
end;

alter table public.skills
  drop column if exists progress_percentage,
  drop column if exists confidence_score,
  drop column if exists reason,
  drop column if exists notes;

alter table public.learning_tasks
  drop column if exists difficulty,
  drop column if exists understanding_score,
  drop column if exists resource_link,
  drop column if exists description,
  drop column if exists output_created,
  drop column if exists notes;
