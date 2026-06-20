# Daily Task & Skill Monitor

A personal full-stack web prototype for tracking weekly work tasks, skill-development time, learning progress, analytics, and weekly review notes.

## Architecture

- Next.js App Router with TypeScript
- Tailwind CSS for responsive UI
- Supabase Auth and PostgreSQL when environment keys are configured
- localStorage fallback when Supabase keys are missing
- Recharts for work and learning analytics
- date-fns for Monday-to-Sunday weekly filtering

## Features

- Email/password signup and login
- Dashboard with weekly work hours, learning hours, task counts, skill progress, productivity score, today plan, and weekly summary
- Monday-to-Sunday weekly planner
- CRUD for work tasks
- CRUD for skills
- CRUD for learning tasks
- Work analytics charts
- Learning analytics charts
- Weekly review with generated summary from stored data
- Settings page with storage mode and demo data reset
- Supabase SQL schema with RLS policies
- Fast office-work workflow:
  - Inline updates for work hours, completion percentage, owner, received date, due date, and status
  - Automatic weekly sprint-plan compilation
  - CSV sprint export
  - Copy-ready sprint text for email, Teams, or chat
  - One-click carry-forward of pending tasks to next week

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Without Supabase keys, the app runs in localStorage mode so you can test everything immediately.

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Enable email/password authentication.
5. Copy the project URL and anon key into `.env.local`.
6. Restart the dev server.
7. Sign up in the app.

The schema enables Row Level Security. Each authenticated user can only read, create, update, and delete their own records.

If you already created the database using an earlier version of this project, run:

```text
supabase/migrations/20260620_add_sprint_fields.sql
supabase/migrations/20260620_secure_user_profile_trigger.sql
supabase/migrations/20260620_simplify_learning_module.sql
supabase/migrations/20260620_remove_finance_module.sql
supabase/migrations/20260620_remove_time_tracker.sql
supabase/migrations/20260620_default_work_tasks_in_progress.sql
supabase/migrations/20260621_simplify_work_tasks.sql
```

These migrations add the current task and learning fields, secure the profile trigger, and remove retired finance and time-tracker tables.

## Daily Work And Sprint Workflow

1. Open **Tasks** and add a task using the short form.
2. During the day, update hours, completion percentage, owner, dates, and status directly in the task table.
3. Open **Sprint Plan** at the end of the week.
4. Export CSV or copy the formatted sprint text.
5. Use **Carry pending to next week** to clone unfinished items into Monday of the next week.

Sprint columns:

- Project
- Task
- Product owner
- Work hours
- Completion percentage
- Assigned date
- Due date
- Status

## Vercel Deployment

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Add these environment variables in Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. Deploy.
5. Test the live URL:
   - Sign up or log in
   - Add a work task
   - Add a skill
   - Add a learning task
   - Check work analytics
   - Check learning analytics
   - Save a weekly review

## Productivity Score

The weekly productivity score is calculated out of 100:

- 40% work task completion rate
- 25% planned vs actual work hour accuracy
- 20% learning consistency
- 15% high-priority task completion

Interpretation:

- 80 to 100: Excellent week
- 60 to 79: Good week
- 40 to 59: Needs improvement
- Below 40: Poor tracking or low completion

## Personal Use Notes

This app is designed as a personal operating dashboard. It supports Supabase Auth because that keeps your deployed data private, but the navigation, sample data, and analytics are intentionally optimized for one person tracking weekly work and skill growth.
