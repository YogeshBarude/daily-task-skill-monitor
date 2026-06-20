"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Goal,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Printer,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCircle,
  UserRound,
  X
} from "lucide-react";
import { addDays, addMinutes, format } from "date-fns";
import { autoWeeklySummary, dailySeries, dashboardMetrics, priorityDistribution, productivityLabel, productivityScore, projectDistribution, scopedWeekData, skillCategoryDistribution, statusDistribution } from "@/lib/analytics";
import { minutesToHours, toDateInput, weekBounds, weekDays } from "@/lib/date";
import { newId, useStore } from "@/lib/storage";
import { sprintCsv, sprintShareText, tasksForSprint } from "@/lib/sprint";
import { LearningTask, Skill, WeeklyReview, WorkTask } from "@/lib/types";
import { Badge, Button, Card, EmptyState, Field, ProgressBar, inputClass } from "./ui";

type Tab = "Dashboard" | "Weekly Planner" | "Work Tasks" | "Sprint Plan" | "Skills" | "Work Analytics" | "Learning Analytics" | "Weekly Review" | "Settings";
const navGroups: { label: string; items: { tab: Tab; label: string; icon: React.ElementType }[] }[] = [
  { label: "", items: [{ tab: "Dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Work",
    items: [
      { tab: "Work Tasks", label: "Tasks", icon: ListChecks },
      { tab: "Sprint Plan", label: "Sprint plan", icon: BriefcaseBusiness },
      { tab: "Weekly Planner", label: "Weekly planner", icon: CalendarDays },
      { tab: "Work Analytics", label: "Work analytics", icon: BarChart3 },
      { tab: "Weekly Review", label: "Weekly review", icon: CheckCircle2 }
    ]
  },
  {
    label: "Learning",
    items: [
      { tab: "Skills", label: "Skills & learning", icon: BookOpen },
      { tab: "Learning Analytics", label: "Learning analytics", icon: Sparkles }
    ]
  }
];

const colors = ["#2563EB", "#0F9F6E", "#D97706", "#DC2626", "#7C3AED", "#0891B2"];
const projectOptions = ["AI Governance", "Synthetic Testing", "Coca-Cola Creative Analysis", "DU Telecom Concept Testing", "Personal", "Other"];
const platformOptions = ["AI Governance Portal", "PowerPoint", "Docs", "Analytics workbook", "Excel", "Power BI", "Supabase", "Vercel", "Other"];
const pocOptions = ["Vaibhav", "Internal", "Research team", "Product team", "Personal", "Other"];
const workCategoryOptions = ["Validation", "Analysis", "Benchmarking", "Documentation", "Testing", "Development", "Review", "Meeting", "General", "Other"];

export function MonitorApp() {
  const store = useStore();
  const [active, setActive] = useState<Tab>("Dashboard");
  const [weekStart, setWeekStart] = useState(weekBounds().startInput);
  const [selectedDate, setSelectedDate] = useState(toDateInput(new Date()));
  const [showLogTask, setShowLogTask] = useState(false);

  function selectDate(dateInput: string) {
    setSelectedDate(dateInput);
    setWeekStart(weekBounds(new Date(`${dateInput}T00:00:00`)).startInput);
  }

  function moveWeek(direction: -1 | 1) {
    const nextDate = toDateInput(addDays(new Date(`${selectedDate}T00:00:00`), direction * 7));
    selectDate(nextDate);
  }

  if (store.loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading your workspace...</div>;
  }

  if (!store.user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-[#0D0F12] text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[238px] border-r border-[#2B3240] bg-[#12161D] lg:flex lg:flex-col">
        <div className="flex h-[70px] items-center gap-3 border-b border-[#252A35] px-5">
          <div className="grid h-8 w-8 place-items-center rounded-full border border-slate-500 text-slate-100"><CheckCircle2 size={19} /></div>
          <div><p className="text-[15px] font-bold leading-tight text-slate-100">Daily Task &</p><p className="text-[15px] font-bold leading-tight text-slate-100">Skill Monitor</p></div>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label || "overview"} className="mb-5">
              {group.label && <p className="mb-2 px-3 text-[10px] font-bold uppercase text-slate-500">{group.label}</p>}
              <div className="grid gap-1">
                {group.items.map(({ tab, label, icon: Icon }) => (
                  <button key={tab} onClick={() => setActive(tab)} className={`flex h-9 w-full items-center gap-3 rounded-md border px-3 text-left text-[13px] transition ${active === tab ? "border-[#5B8DEF]/70 bg-[#5B8DEF]/20 font-medium text-blue-100 shadow-[inset_3px_0_0_#5B8DEF]" : "border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"}`}>
                    <Icon size={17} strokeWidth={1.8} />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[#252A35] p-3">
          <button onClick={() => setActive("Settings")} className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-[13px] text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"><Settings size={17} /> Settings</button>
          <button onClick={() => store.signOut()} className="mt-1 flex h-9 w-full items-center gap-3 rounded-md px-3 text-[13px] text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"><LogOut size={17} /> Sign out</button>
          <div className="mt-3 flex items-center gap-3 rounded-md border border-[#252A35] bg-[#1E2330] p-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600/30 text-sm font-semibold text-blue-100">{store.user.name.slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-200">{store.user.name}</p><p className="truncate text-[10px] text-slate-500">{store.mode === "supabase" ? "Cloud workspace" : "Personal workspace"}</p></div>
          </div>
        </div>

      </aside>

      <main className="lg:pl-[238px]">
        <header className="sticky top-0 z-10 border-b border-[#2B3240] bg-[#12161D]/95 backdrop-blur">
          <div className="flex min-h-[70px] flex-wrap items-center gap-3 px-3 py-3 sm:px-4 lg:px-6">
            <WeekNavigator weekStart={weekStart} selectedDate={selectedDate} onSelectDate={selectDate} onMoveWeek={moveWeek} />
            <div className="ml-auto flex items-center gap-2">
              <Button className="h-10 px-4" onClick={() => setShowLogTask(true)}><Plus size={17} /><span>Log Task</span></Button>
              <button className="grid h-10 w-10 place-items-center rounded-md border border-[#2b3745] text-slate-400 hover:bg-white/[0.05] hover:text-white lg:hidden" onClick={() => setActive("Settings")} title="Profile"><UserCircle size={19} /></button>
            </div>
          </div>
          <div className="scrollbar-thin flex gap-1 overflow-x-auto border-t border-[#252A35] px-3 py-2 lg:hidden">
            {navGroups.flatMap((group) => group.items).map(({ tab, label }) => <button key={tab} onClick={() => setActive(tab)} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${active === tab ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/[0.05]"}`}>{label}</button>)}
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-3 sm:p-4 lg:p-5">
          {active !== "Dashboard" && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xl font-bold text-slate-100">{active}</p><p className="mt-1 text-xs text-slate-500">Week of {format(new Date(`${weekStart}T00:00:00`), "MMM d, yyyy")}</p></div>
            </div>
          )}
          {active === "Dashboard" && <Dashboard weekStart={weekStart} selectedDate={selectedDate} onSelectDate={selectDate} setActive={setActive} />}
          {active === "Weekly Planner" && <WeeklyPlanner weekStart={weekStart} />}
          {active === "Work Tasks" && <WorkTasks />}
          {active === "Sprint Plan" && <SprintPlanPage weekStart={weekStart} />}
          {active === "Skills" && <Skills selectedDate={selectedDate} onSelectDate={selectDate} />}
          {active === "Work Analytics" && <WorkAnalytics weekStart={weekStart} />}
          {active === "Learning Analytics" && <LearningAnalytics weekStart={weekStart} />}
          {active === "Weekly Review" && <WeeklyReviewPage weekStart={weekStart} />}
          {active === "Settings" && <SettingsPage />}
        </div>
      </main>
      {showLogTask && <QuickLearningTaskModal onClose={() => setShowLogTask(false)} />}
    </div>
  );
}

function AuthScreen() {
  const { signIn, signUp, mode } = useStore();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      if (isSignup) {
        await signUp(email, password, name);
        setMessage("Account created. Check your email to confirm your account, then log in.");
        setIsSignup(false);
        setPassword("");
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#080d14] px-4 py-10 text-slate-100">
      <div className="w-full max-w-[430px]">
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-blue-400/40 bg-blue-500/10 text-blue-300"><CheckCircle2 size={24} /></div>
          <div><p className="text-lg font-semibold leading-tight">Daily Task & Skill Monitor</p><p className="mt-1 text-xs text-slate-500">Your private productivity workspace</p></div>
        </div>

        <Card className="p-5 sm:p-6">
          <div className="grid grid-cols-2 rounded-md border border-[#2b3947] bg-[#091019] p-1">
            <button type="button" onClick={() => { setIsSignup(false); setError(""); setMessage(""); }} className={`h-9 rounded text-sm font-medium ${!isSignup ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>Log in</button>
            <button type="button" onClick={() => { setIsSignup(true); setError(""); setMessage(""); }} className={`h-9 rounded text-sm font-medium ${isSignup ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>Sign up</button>
          </div>

          <div className="mt-6">
            <h1 className="text-xl font-semibold">{isSignup ? "Create your workspace" : "Welcome back"}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{isSignup ? "Create an account to securely sync your data." : "Log in to continue to your workspace."}</p>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={submit}>
            {isSignup && <Field label="Name"><div className="relative"><UserRound className="pointer-events-none absolute left-3 top-3 text-slate-600" size={16} /><input className={`${inputClass} pl-10`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" required /></div></Field>}
            <Field label="Email"><div className="relative"><Mail className="pointer-events-none absolute left-3 top-3 text-slate-600" size={16} /><input className={`${inputClass} pl-10`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required /></div></Field>
            <Field label="Password"><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-3 text-slate-600" size={16} /><input className={`${inputClass} pl-10`} type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isSignup ? "new-password" : "current-password"} placeholder="At least 8 characters" required /></div></Field>
            {mode === "local" && <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">Secure cloud authentication is not configured. Add the Supabase environment variables in Vercel before using this website.</p>}
            {error && <p className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
            {message && <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}
            <Button className="mt-1 w-full" type="submit" disabled={submitting || mode === "local"}>{submitting ? "Please wait..." : isSignup ? "Create account" : "Log in"}</Button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-2 border-t border-[#263340] pt-4 text-xs text-slate-500">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>{mode === "supabase" ? "Protected by secure cloud authentication" : "Cloud connection required"}</span>
          </div>
        </Card>
      </div>
    </main>
  );
}

function QuickLearningTaskModal({ onClose }: { onClose: () => void }) {
  const { data, user, upsert } = useStore();
  const stamp = new Date().toISOString();
  const [task, setTask] = useState<LearningTask>({
    id: newId("lt"),
    userId: user?.id || "",
    skillId: data.skills[0]?.id || "",
    title: "",
    learningType: "Practice",
    plannedDate: toDateInput(new Date()),
    plannedMinutes: 30,
    actualMinutes: 30,
    status: "Done",
    createdAt: stamp,
    updatedAt: stamp
  });

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !task.skillId || !task.title.trim()) return;
    await upsert("learningTasks", { ...task, userId: user.id, updatedAt: new Date().toISOString() });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="log-task-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <Card className="w-full max-w-md p-5">
        <div className="flex items-center justify-between">
          <h2 id="log-task-title" className="text-xl font-semibold">Log learning task</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md text-[#7A8499] hover:bg-white/5 hover:text-white" aria-label="Close"><X size={18} /></button>
        </div>
        <form className="mt-5 grid gap-4" onSubmit={save}>
          <SelectField label="Linked skill" value={task.skillId} options={data.skills.map((skill) => skill.id)} labels={Object.fromEntries(data.skills.map((skill) => [skill.id, skill.skillName]))} onChange={(value) => setTask({ ...task, skillId: value })} />
          <TextField label="Task title" value={task.title} onChange={(value) => setTask({ ...task, title: value })} required />
          <TextField label="Planned date" type="date" value={task.plannedDate} onChange={(value) => setTask({ ...task, plannedDate: value })} />
          <NumberField label="Planned minutes" value={task.plannedMinutes} onChange={(value) => setTask({ ...task, plannedMinutes: value })} />
          <NumberField label="Actual minutes" value={task.actualMinutes} onChange={(value) => setTask({ ...task, actualMinutes: value })} />
          <SelectField label="Status" value={task.status} options={["Planned", "In Progress", "Done", "Skipped"]} onChange={(value) => setTask({ ...task, status: value as LearningTask["status"] })} />
          <Button type="submit" disabled={!data.skills.length}>Save</Button>
          {!data.skills.length && <p className="text-xs text-[#7A8499]">Add a skill before logging a learning task.</p>}
        </form>
      </Card>
    </div>
  );
}

function WeekNavigator({ weekStart, selectedDate, onSelectDate, onMoveWeek }: { weekStart: string; selectedDate: string; onSelectDate: (date: string) => void; onMoveWeek: (direction: -1 | 1) => void }) {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = addDays(start, 6);
  const currentWeek = weekStart === weekBounds().startInput;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <button type="button" onClick={() => onMoveWeek(-1)} className="grid h-10 w-10 place-items-center rounded-lg border border-[#252A35] bg-[#1E2330] text-[#7A8499] hover:text-[#F0F2F5]" aria-label="Previous week" title="Previous week"><ChevronLeft size={18} /></button>
      <label className="relative flex h-10 min-w-[190px] cursor-pointer items-center rounded-lg border border-[#252A35] bg-[#1E2330] px-3">
        <CalendarDays size={16} className="mr-2 text-[#5B8DEF]" />
        <span className="whitespace-nowrap text-sm font-medium text-[#F0F2F5]">{format(start, "MMM d")} - {format(end, "MMM d, yyyy")}</span>
        <input type="date" value={selectedDate} onChange={(event) => onSelectDate(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Select a date" />
      </label>
      <button type="button" onClick={() => onMoveWeek(1)} className="grid h-10 w-10 place-items-center rounded-lg border border-[#252A35] bg-[#1E2330] text-[#7A8499] hover:text-[#F0F2F5]" aria-label="Next week" title="Next week"><ChevronRight size={18} /></button>
      {!currentWeek && <button type="button" onClick={() => onSelectDate(toDateInput(new Date()))} className="h-10 rounded-lg border border-[#252A35] px-3 text-xs font-medium text-[#7A8499] hover:text-[#F0F2F5]">Today</button>}
    </div>
  );
}

function Dashboard({ weekStart, selectedDate, onSelectDate, setActive }: { weekStart: string; selectedDate: string; onSelectDate: (date: string) => void; setActive: (tab: Tab) => void }) {
  const { data, upsert } = useStore();
  const week = scopedWeekData(data, weekStart);
  const metrics = dashboardMetrics(data, weekStart);
  const days = weekDays(new Date(`${weekStart}T00:00:00`));
  const todayInput = toDateInput(new Date());
  const selectedDay = days.find((day) => day.input === selectedDate) || days[0];
  const selectedWork = data.workTasks.filter((task) => task.assignedDate === selectedDay.input);
  const selectedLearning = data.learningTasks.filter((task) => task.plannedDate === selectedDay.input);
  const totalTasks = week.workTasks.length + week.learningTasks.length;
  const completedTasks = week.workTasks.filter((task) => task.status === "Completed").length + week.learningTasks.filter((task) => task.status === "Done").length;
  const completion = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const agenda: AgendaEntry[] = [
    ...selectedWork.map((task, index) => ({ id: task.id, time: ["07:30", "09:30", "14:00", "17:00"][index % 4], type: "Work Task", title: task.title, meta: task.projectName || "Personal", accent: "blue", done: task.status === "Completed", icon: BriefcaseBusiness, onToggle: () => void upsert("workTasks", { ...task, status: task.status === "Completed" ? "In Progress" : "Completed", completionPercentage: task.status === "Completed" ? Math.min(task.completionPercentage, 99) : 100, updatedAt: new Date().toISOString() }) })),
    ...selectedLearning.map((task, index) => ({ id: task.id, time: ["11:30", "16:00", "19:00"][index % 3], type: "Learning Session", title: task.title, meta: `${task.plannedMinutes} min`, accent: "amber", done: task.status === "Done", icon: BookOpen, onToggle: () => void upsert("learningTasks", { ...task, status: task.status === "Done" ? "In Progress" : "Done", updatedAt: new Date().toISOString() }) }))
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="overflow-hidden rounded-lg border border-[#2B3240] bg-[#12161D] shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="scrollbar-thin grid min-w-[760px] grid-cols-7 border-b border-[#2B3240]">
        {days.map((day) => {
          const count = data.workTasks.filter((task) => task.assignedDate === day.input).length + data.learningTasks.filter((task) => task.plannedDate === day.input).length;
          const active = day.input === selectedDay.input;
          const isToday = day.input === todayInput;
          return (
            <button key={day.input} type="button" aria-pressed={active} onClick={() => onSelectDate(day.input)} className={`min-h-[122px] border-r border-[#2B3240] px-3 py-4 text-center last:border-r-0 ${active ? "bg-[#5B8DEF]/25 shadow-[inset_0_-3px_0_#5B8DEF]" : "hover:bg-white/[0.035]"}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${active ? "text-blue-200" : "text-slate-400"}`}>{day.dayName.slice(0, 3)}</p>
              <p className={`mt-1 text-3xl font-semibold ${active ? "text-blue-100" : "text-slate-300"}`}>{format(day.date, "d")}</p>
              <p className={`mt-1 text-[11px] ${active ? "text-blue-300" : "text-slate-500"}`}>{isToday ? "Today" : `${count} tasks`}</p>
              <span className={`mx-auto mt-2 block h-1.5 w-1.5 rounded-full ${active ? "bg-blue-400" : count ? "bg-slate-500" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_418px]">
        <section className="border-b border-[#2B3240] xl:border-b-0 xl:border-r">
          <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-[#2B3240] px-5">
            <div>
              <h1 className="text-lg font-semibold text-slate-100">{format(selectedDay.date, "EEEE, MMMM d")}</h1>
              <p className="mt-1 text-xs text-slate-500">{agenda.length} items planned across work and learning</p>
            </div>
            <Button variant="secondary" onClick={() => setActive("Weekly Planner")}><CalendarDays size={16} /> Open planner</Button>
          </div>

          <div className="relative px-5 py-2">
            {agenda.length ? agenda.map((item) => <AgendaItem key={item.id} {...item} />) : <div className="py-16"><EmptyState title="A clear day" text="Add a work task or learning session to build today's flow." /></div>}
          </div>

          <details className="border-t border-[#24303d]">
            <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-slate-300">
              <span>Completed this week ({completedTasks})</span>
              <CheckCircle2 size={18} className="text-emerald-400" />
            </summary>
            <div className="grid gap-2 border-t border-[#1b2631] px-5 py-4 sm:grid-cols-2">
              {week.workTasks.filter((task) => task.status === "Completed").slice(0, 6).map((task) => <div key={task.id} className="flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 size={15} className="shrink-0 text-emerald-400" /><span className="truncate">{task.title}</span></div>)}
            </div>
          </details>
        </section>

        <aside className="bg-[#171B23] p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-100">My progress</h2><Badge tone="blue">This week</Badge></div>
          <div className="grid gap-3">
            <ProgressStat title="Weekly completion" value={`${completion}%`} detail={`${completedTasks} of ${totalTasks} tasks done`} progress={completion} tone="green" icon={Goal} />
            <ProgressStat title="Focus hours" value={`${metrics.totalWorkHours}h`} detail={`${selectedWork.reduce((total, task) => total + task.actualMinutes, 0)} minutes on selected day`} progress={Math.min(100, metrics.totalWorkHours * 5)} tone="blue" icon={Clock3} />
            <ProgressStat title="Skill practice" value={`${metrics.totalLearningHours}h`} detail={`${selectedLearning.length} learning items on selected day`} progress={Math.min(100, metrics.totalLearningHours * 10)} tone="amber" icon={BookOpen} />
          </div>
        </aside>
      </div>
    </div>
  );
}

type AgendaEntry = {
  id: string;
  time: string;
  type: string;
  title: string;
  meta: string;
  accent: string;
  done: boolean;
  icon: React.ElementType;
  onToggle?: () => void;
};

function AgendaItem({ time, type, title, meta, accent, done, icon: Icon, onToggle }: AgendaEntry) {
  const tone = accent === "blue" ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : accent === "amber" ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-rose-500/40 bg-rose-500/10 text-rose-300";
  return (
    <div className="grid min-h-[68px] grid-cols-[64px_1fr_auto] items-center gap-3 border-b border-[#1e2935] last:border-b-0">
      <p className="text-xs tabular-nums text-slate-500">{time}</p>
      <div className="flex min-w-0 items-center gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border ${tone}`}><Icon size={17} /></div>
        <div className="min-w-0"><p className={`text-[11px] font-medium ${tone.split(" ").at(-1)}`}>{type}</p><p className={`truncate text-sm ${done ? "text-slate-500 line-through" : "text-slate-200"}`}>{title}</p></div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden max-w-[150px] truncate text-xs text-slate-500 sm:block">{meta}</span>
        {onToggle && <button onClick={onToggle} className={`grid h-5 w-5 place-items-center rounded border ${done ? "border-emerald-400 bg-emerald-400 text-[#07110c]" : "border-slate-500 text-transparent hover:border-blue-400"}`} title={done ? "Mark active" : "Mark complete"}><CheckCircle2 size={13} /></button>}
      </div>
    </div>
  );
}

function ProgressStat({ title, value, detail, progress, tone, icon: Icon }: { title: string; value: string; detail: string; progress: number; tone: "green" | "blue" | "amber"; icon: React.ElementType }) {
  const bar = tone === "green" ? "bg-emerald-400" : tone === "amber" ? "bg-amber-300" : "bg-blue-400";
  const icon = tone === "green" ? "text-emerald-300" : tone === "amber" ? "text-amber-300" : "text-blue-300";
  return (
    <div className="rounded-lg border border-[#2a3744] bg-[#0d151f] p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-300"><Icon size={16} className={icon} /> {title}</div>
      <div className="mt-3 flex items-end justify-between"><div><p className="text-xl font-semibold text-slate-100">{value}</p><p className="mt-0.5 text-[11px] text-slate-500">{detail}</p></div><span className="text-xs text-slate-400">{Math.round(progress)}%</span></div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#202b37]"><div className={`h-full ${bar}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>
    </div>
  );
}

function CompletedWorkPanel({ completedWork, pendingWork, setActive }: { completedWork: WorkTask[]; pendingWork: WorkTask[]; setActive: (tab: Tab) => void }) {
  const [filter, setFilter] = useState<"Completed" | "Pending">("Completed");
  const items = filter === "Completed" ? completedWork : pendingWork;
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Work status this week</h2>
          <p className="text-sm text-slate-500">Use this to quickly see what is done and what still needs attention.</p>
        </div>
        <div className="flex gap-2">
          <select className={inputClass} value={filter} onChange={(event) => setFilter(event.target.value as "Completed" | "Pending")}>
            <option value="Completed">Completed work</option>
            <option value="Pending">Pending work</option>
          </select>
          <Button variant="secondary" onClick={() => setActive("Work Tasks")}>Open tasks</Button>
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.length ? items.slice(0, 6).map((task) => (
          <div key={task.id} className="rounded-md border border-line p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{task.title}</p>
              <Badge tone={filter === "Completed" ? "green" : badgeTone(task.status)}>{task.status}</Badge>
            </div>
            <p className="mt-1 text-slate-500">{task.projectName || "No project"} - {task.dayOfWeek}</p>
          </div>
        )) : <EmptyState title={`No ${filter.toLowerCase()} work`} text={filter === "Completed" ? "Mark tasks completed to see them here." : "Nice, nothing pending for this week."} />}
      </div>
    </Card>
  );
}

function Metric({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  const tone = /done|completion/i.test(title) ? "border-emerald-500/35 bg-emerald-500/[0.055]" : /pending|blocked/i.test(title) ? "border-amber-500/35 bg-amber-500/[0.055]" : /skill|learning/i.test(title) ? "border-fuchsia-500/35 bg-fuchsia-500/[0.055]" : "border-blue-500/35 bg-blue-500/[0.055]";
  const dot = /done|completion/i.test(title) ? "bg-[#3ECF8E]" : /pending|blocked/i.test(title) ? "bg-[#F5B84B]" : /skill|learning/i.test(title) ? "bg-[#C879FF]" : "bg-[#5B8DEF]";
  return (
    <Card className={`min-h-[112px] ${tone}`}>
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase text-[#8D98AE]"><span className={`h-2 w-2 rounded-full ${dot}`} />{title}</p>
      <p className="mt-2 text-[32px] font-bold leading-none text-[#F0F2F5]">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

function TaskMiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-2 grid gap-2">
        {items.length ? items.slice(0, 4).map((item) => <div key={item} className="rounded-md border border-line px-3 py-2 text-sm">{item}</div>) : <p className="text-sm text-slate-500">Nothing planned yet.</p>}
      </div>
    </div>
  );
}

function WeeklyPlanner({ weekStart }: { weekStart: string }) {
  const { data } = useStore();
  const days = weekDays(new Date(`${weekStart}T00:00:00`));

  return (
    <div className="grid gap-4">
      {days.map((day) => {
        const work = data.workTasks.filter((task) => task.assignedDate === day.input);
        const learning = data.learningTasks.filter((task) => task.plannedDate === day.input);
        const planned = work.reduce((t, task) => t + task.estimatedMinutes, 0) + learning.reduce((t, task) => t + task.plannedMinutes, 0);
        const actual = work.reduce((t, task) => t + task.actualMinutes, 0) + learning.reduce((t, task) => t + task.actualMinutes, 0);
        const completed = work.filter((task) => task.status === "Completed").length + learning.filter((task) => task.status === "Done").length;
        const total = work.length + learning.length;
        const percent = total ? Math.round((completed / total) * 100) : 0;
        return (
          <Card key={day.input}>
            <div className="grid gap-4 xl:grid-cols-[180px_1fr_1fr]">
              <div>
                <p className="text-lg font-bold">{day.dayName}</p>
                <p className="text-sm text-slate-500">{day.label}</p>
                <div className="mt-4 grid gap-2 text-sm">
                  <span>Planned: {minutesToHours(planned)}h</span>
                  <span>Actual: {minutesToHours(actual)}h</span>
                  <ProgressBar value={percent} />
                  <Badge tone={percent === 100 ? "green" : percent > 0 ? "blue" : "slate"}>{percent === 100 ? "Completed" : percent > 0 ? "In Progress" : "Not Started"}</Badge>
                </div>
              </div>
              <PlannerColumn title="Work Tasks" items={work.map((task) => ({ id: task.id, text: task.title, meta: `${task.priority} - ${task.status}` }))} />
              <PlannerColumn title="Skill Development" items={learning.map((task) => ({ id: task.id, text: task.title, meta: `${task.learningType} - ${task.status}` }))} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function PlannerColumn({ title, items }: { title: string; items: { id: string; text: string; meta: string }[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <div className="grid gap-2">
        {items.length ? items.map((item) => <div key={item.id} className="rounded-md border border-line p-2 text-sm"><p className="font-medium">{item.text}</p><p className="text-xs text-slate-500">{item.meta}</p></div>) : <p className="rounded-md bg-soft p-3 text-sm text-slate-500">No entries.</p>}
      </div>
    </div>
  );
}

function WorkTasks() {
  const { data, user, upsert, remove } = useStore();
  const [editing, setEditing] = useState<WorkTask | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Active");
  const filtered = data.workTasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.projectName} ${task.priority}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "All" || (status === "Active" ? task.status !== "Completed" : task.status === status);
    return matchesSearch && matchesStatus;
  });

  return (
    <CrudLayout
      title="Work task management"
      filters={<><input className={inputClass} placeholder="Search tasks" value={query} onChange={(e) => setQuery(e.target.value)} /><select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}><option>Active</option><option>Completed</option><option>All</option><option>Backlog</option><option>Planned</option><option>In Progress</option><option>Blocked</option></select></>}
      form={<WorkTaskForm item={editing} onCancel={() => setEditing(null)} onSave={(item) => { if (user) void upsert("workTasks", { ...item, userId: user.id }); setEditing(null); }} />}
    >
      {filtered.length ? <FastTaskTable tasks={filtered} onChange={(task) => void upsert("workTasks", task)} onEdit={setEditing} onDelete={(id) => confirmDelete(() => remove("workTasks", id))} /> : <EmptyState title="No work tasks found" text="Add a task or adjust your filters." />}
    </CrudLayout>
  );
}

function FastTaskTable({ tasks, onChange, onEdit, onDelete }: { tasks: WorkTask[]; onChange: (task: WorkTask) => void; onEdit?: (task: WorkTask) => void; onDelete?: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1040px] w-full text-left text-xs">
        <thead className="border-b border-[#2a3744] text-[10px] uppercase tracking-[0.1em] text-slate-500">
          <tr><th className="px-2 py-3">Project / task</th><th className="px-2">Owner</th><th className="px-2">Hours</th><th className="px-2">Complete</th><th className="px-2">Assigned</th><th className="px-2">Due</th><th className="px-2">Status</th><th /></tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-[#202b36] last:border-0 hover:bg-white/[0.025]">
              <td className="max-w-[290px] px-2 py-3"><p className="truncate font-medium text-slate-200">{task.title}</p><p className="mt-1 truncate text-slate-500">{task.projectName}</p></td>
              <td className="px-2"><input className="w-28 rounded border border-transparent bg-transparent px-2 py-1.5 text-slate-300 hover:border-[#344251] focus:border-blue-500" defaultValue={task.productOwner} onBlur={(e) => { if (e.target.value !== task.productOwner) onChange({ ...task, productOwner: e.target.value, poc: e.target.value, updatedAt: new Date().toISOString() }); }} /></td>
              <td className="px-2"><input className="w-16 rounded border border-transparent bg-transparent px-2 py-1.5 text-slate-300 hover:border-[#344251] focus:border-blue-500" type="number" min="0" step="0.25" defaultValue={Math.round((task.actualMinutes / 60) * 100) / 100} onBlur={(e) => { const minutes = Math.max(0, Math.round((Number(e.target.value) || 0) * 60)); if (minutes !== task.actualMinutes) onChange({ ...task, actualMinutes: minutes, updatedAt: new Date().toISOString() }); }} /></td>
              <td className="px-2"><div className="flex items-center gap-2"><input className="w-16 rounded border border-transparent bg-transparent px-2 py-1.5 text-slate-300 hover:border-[#344251] focus:border-blue-500" type="number" min="0" max="100" defaultValue={task.completionPercentage} onBlur={(e) => { const value = Math.max(0, Math.min(100, Number(e.target.value) || 0)); if (value !== task.completionPercentage) onChange({ ...task, completionPercentage: value, status: value >= 100 ? "Completed" : value > 0 ? "In Progress" : "Planned", updatedAt: new Date().toISOString() }); }} /><span className="text-slate-600">%</span></div></td>
              <td className="px-2"><input className="w-32 rounded border border-transparent bg-transparent px-2 py-1.5 text-slate-400 hover:border-[#344251] focus:border-blue-500" type="date" value={task.assignedDate} onChange={(e) => onChange({ ...task, assignedDate: e.target.value, dayOfWeek: format(new Date(`${e.target.value}T00:00:00`), "EEEE"), updatedAt: new Date().toISOString() })} /></td>
              <td className="px-2"><input className="w-32 rounded border border-transparent bg-transparent px-2 py-1.5 text-slate-400 hover:border-[#344251] focus:border-blue-500" type="date" value={task.dueDate} onChange={(e) => onChange({ ...task, dueDate: e.target.value, updatedAt: new Date().toISOString() })} /></td>
              <td className="px-2"><select className="w-28 rounded border border-[#344251] bg-[#0a111a] px-2 py-1.5 text-slate-300" value={task.status} onChange={(e) => onChange({ ...task, status: e.target.value as WorkTask["status"], completionPercentage: e.target.value === "Completed" ? 100 : task.completionPercentage, updatedAt: new Date().toISOString() })}><option>Backlog</option><option>Planned</option><option>In Progress</option><option>Blocked</option><option>Completed</option></select></td>
              <td className="px-2">{(onEdit || onDelete) && <div className="flex gap-1">{onEdit && <Button variant="ghost" onClick={() => onEdit(task)}>Edit</Button>}{onDelete && <button className="p-2 text-slate-600 hover:text-rose-300" onClick={() => onDelete(task.id)} title="Delete"><Trash2 size={15} /></button>}</div>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SprintPlanPage({ weekStart }: { weekStart: string }) {
  const { data, upsert, user } = useStore();
  const [carryMessage, setCarryMessage] = useState("");
  const tasks = tasksForSprint(data.workTasks, weekStart);
  const pending = tasks.filter((task) => task.completionPercentage < 100);
  const nextWeek = format(addMinutes(new Date(`${weekStart}T00:00:00`), 7 * 24 * 60), "yyyy-MM-dd");

  async function carryForward() {
    if (!user) return;
    const normalizedKey = (task: WorkTask) => `${task.title}|${task.projectName}|${task.productOwner}`.trim().toLowerCase();
    const existingKeys = new Set(data.workTasks.filter((task) => task.assignedDate === nextWeek).map(normalizedKey));
    const toCreate = pending.filter((task) => {
      const key = normalizedKey(task);
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
    const now = new Date().toISOString();
    await Promise.all(toCreate.map((task) => upsert("workTasks", { ...task, id: newId("wt"), userId: user.id, assignedDate: nextWeek, dayOfWeek: "Monday", status: task.status === "Blocked" ? "Blocked" : "Planned", createdAt: now, updatedAt: now })));
    const skipped = pending.length - toCreate.length;
    setCarryMessage(`${toCreate.length} task${toCreate.length === 1 ? "" : "s"} carried to ${format(new Date(`${nextWeek}T00:00:00`), "MMM d")}${skipped ? `; ${skipped} already there` : ""}.`);
  }

  return (
    <Card className="sprint-print">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#263340] pb-4">
        <div><h2 className="text-base font-semibold text-slate-100">Sprint plan</h2><p className="mt-1 text-xs text-slate-500">Automatically compiled from this week&apos;s task updates.</p></div>
        <div className="sprint-actions flex flex-wrap gap-2"><Button variant="secondary" onClick={() => window.print()}><Printer size={16} /> Print</Button><Button variant="secondary" onClick={() => downloadCsv(`sprint-${weekStart}.csv`, sprintCsv(tasks))}>Export CSV</Button><Button variant="secondary" onClick={() => navigator.clipboard.writeText(sprintShareText(tasks, weekStart))}>Copy share text</Button><Button onClick={() => void carryForward()}>Carry pending to next week</Button></div>
      </div>
      {carryMessage && <p className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{carryMessage}</p>}
      <div className="mt-2"><FastTaskTable tasks={tasks} onChange={(task) => void upsert("workTasks", task)} /></div>
    </Card>
  );
}

function Skills({ selectedDate, onSelectDate }: { selectedDate: string; onSelectDate: (date: string) => void }) {
  const { data, user, upsert, remove } = useStore();
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingLearning, setEditingLearning] = useState<LearningTask | null>(null);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const days = weekDays(new Date(`${selectedDate}T00:00:00`));
  const selectedTasks = data.learningTasks.filter((task) => task.plannedDate === selectedDate);
  const completed = selectedTasks.filter((task) => task.status === "Done").length;
  const totalMinutes = selectedTasks.reduce((total, task) => total + task.actualMinutes, 0);
  const plannedMinutes = selectedTasks.reduce((total, task) => total + task.plannedMinutes, 0);
  const completion = selectedTasks.length ? Math.round((completed / selectedTasks.length) * 100) : 0;
  const skillGroups = data.skills.map((skill) => {
    const tasks = selectedTasks.filter((task) => task.skillId === skill.id);
    return { skill, tasks, done: tasks.filter((task) => task.status === "Done").length };
  });

  function openNewTask(skillId?: string) {
    setEditingLearning({
      id: newId("lt"), userId: user?.id || "", skillId: skillId || data.skills[0]?.id || "", title: "", learningType: "Practice", plannedDate: selectedDate,
      plannedMinutes: 30, actualMinutes: 0, status: "Planned", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    setShowTaskForm(true);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[190px_minmax(0,1fr)_300px]">
      <Card className="h-fit">
        <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Dates</h2><CalendarDays size={17} className="text-[#5B8DEF]" /></div>
        <div className="mt-4 grid gap-2">
          {days.map((day) => {
            const active = day.input === selectedDate;
            const count = data.learningTasks.filter((task) => task.plannedDate === day.input).length;
            return <button key={day.input} onClick={() => onSelectDate(day.input)} className={`rounded-lg border px-3 py-3 text-left transition ${active ? "border-[#5B8DEF] bg-[#5B8DEF] text-white" : "border-transparent bg-[#1E2330] text-[#F0F2F5] hover:border-[#3B4250]"}`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{day.input === toDateInput(new Date()) ? "Today" : day.dayName}</span><span className="text-xs">{count}</span></div><p className={`mt-1 text-xs ${active ? "text-blue-100" : "text-[#7A8499]"}`}>{format(day.date, "MMM d")}</p></button>;
          })}
        </div>
      </Card>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-xl font-semibold">{format(new Date(`${selectedDate}T00:00:00`), "EEEE, MMMM d, yyyy")}</h1><p className="mt-1 text-sm text-[#7A8499]">Track learning by skill and finish tasks directly from each tile.</p></div>
          <div className="flex gap-2"><Button variant="secondary" onClick={() => { setEditingSkill(null); setShowSkillForm(true); }}><Plus size={16} /> Skill</Button><Button onClick={() => openNewTask()}><Plus size={16} /> Task</Button></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {skillGroups.map(({ skill, tasks, done }, index) => <SkillTile key={skill.id} skill={skill} tasks={tasks} done={done} tone={index % 4} onAddTask={() => openNewTask(skill.id)} onEditSkill={() => { setEditingSkill(skill); setShowSkillForm(true); }} onDeleteSkill={() => confirmDelete(() => remove("skills", skill.id))} onEditTask={(task) => { setEditingLearning(task); setShowTaskForm(true); }} onDeleteTask={(id) => confirmDelete(() => remove("learningTasks", id))} onToggleTask={(task) => void upsert("learningTasks", { ...task, status: task.status === "Done" ? "In Progress" : "Done", actualMinutes: task.status === "Done" ? task.actualMinutes : Math.max(task.actualMinutes, task.plannedMinutes), updatedAt: new Date().toISOString() })} />)}
          {!data.skills.length && <div className="md:col-span-2"><EmptyState title="No skills yet" text="Add your first skill to create a learning tile." /></div>}
        </div>
      </section>

      <Card className="h-fit xl:sticky xl:top-[90px]">
        <h2 className="text-base font-semibold">Day&apos;s progress</h2>
        <div className="mt-4 rounded-lg bg-[#5B8DEF] p-5 text-white"><p className="text-[11px] font-bold uppercase text-blue-100">Completed</p><p className="mt-2 text-4xl font-extrabold tabular-nums">{completed}/{selectedTasks.length}</p><p className="mt-1 text-xs text-blue-100">tasks completed today</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full bg-[#3ECF8E]" style={{ width: `${completion}%` }} /></div></div>
        <div className="mt-5 grid grid-cols-2 gap-3"><ProgressMiniStat value={`${minutesToHours(totalMinutes)}h`} label="Actual" /><ProgressMiniStat value={`${minutesToHours(plannedMinutes)}h`} label="Planned" /></div>
        <h3 className="mt-6 text-sm font-semibold">Skill breakdown</h3>
        <div className="mt-3 grid gap-3">{skillGroups.filter((item) => item.tasks.length).map(({ skill, tasks, done }) => <div key={skill.id} className="rounded-lg border border-[#252A35] bg-[#1E2330] p-3"><div className="flex justify-between text-xs"><span className="font-medium">{skill.skillName}</span><span className="text-[#3ECF8E]">{done}/{tasks.length}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#343A48]"><div className="h-full bg-[#5B8DEF]" style={{ width: `${(done / tasks.length) * 100}%` }} /></div></div>)}</div>
        {!selectedTasks.length && <p className="mt-5 text-center text-xs text-[#7A8499]">No tasks planned for this date.</p>}
      </Card>

      {showSkillForm && <ModalShell title={editingSkill ? "Edit skill" : "Add skill"} onClose={() => { setShowSkillForm(false); setEditingSkill(null); }}><SkillForm item={editingSkill} onCancel={() => { setShowSkillForm(false); setEditingSkill(null); }} onSave={(item) => { if (user) void upsert("skills", { ...item, userId: user.id }); setShowSkillForm(false); setEditingSkill(null); }} /></ModalShell>}
      {showTaskForm && <ModalShell title={editingLearning?.title ? "Edit learning task" : "Add learning task"} onClose={() => { setShowTaskForm(false); setEditingLearning(null); }}><LearningTaskForm item={editingLearning} skills={data.skills} onCancel={() => { setShowTaskForm(false); setEditingLearning(null); }} onSave={(item) => { if (user) void upsert("learningTasks", { ...item, userId: user.id }); setShowTaskForm(false); setEditingLearning(null); }} /></ModalShell>}
    </div>
  );
}

function SkillTile({ skill, tasks, done, tone, onAddTask, onEditSkill, onDeleteSkill, onEditTask, onDeleteTask, onToggleTask }: { skill: Skill; tasks: LearningTask[]; done: number; tone: number; onAddTask: () => void; onEditSkill: () => void; onDeleteSkill: () => void; onEditTask: (task: LearningTask) => void; onDeleteTask: (id: string) => void; onToggleTask: (task: LearningTask) => void }) {
  const tones = [
    "border-blue-400/80 bg-blue-500/[0.14] shadow-[0_14px_36px_rgba(59,130,246,0.10)]",
    "border-emerald-400/80 bg-emerald-500/[0.14] shadow-[0_14px_36px_rgba(16,185,129,0.10)]",
    "border-fuchsia-400/80 bg-fuchsia-500/[0.14] shadow-[0_14px_36px_rgba(217,70,239,0.10)]",
    "border-amber-400/80 bg-amber-500/[0.14] shadow-[0_14px_36px_rgba(245,158,11,0.10)]"
  ];
  const accents = ["text-blue-300", "text-emerald-300", "text-fuchsia-300", "text-amber-300"];
  return (
    <article className={`min-h-[250px] rounded-lg border p-4 transition hover:-translate-y-0.5 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-base font-semibold">{skill.skillName}</p><p className="mt-1 text-xs text-[#7A8499]">{skill.category} · {skill.weeklyTargetMinutes} min/week</p></div>
        <div className="flex items-center gap-1"><span className={`mr-2 text-xs font-medium ${accents[tone]}`}>{done}/{tasks.length} done</span><button onClick={onEditSkill} className="p-1.5 text-[#7A8499] hover:text-white" title="Edit skill"><Pencil size={14} /></button><button onClick={onDeleteSkill} className="p-1.5 text-[#7A8499] hover:text-rose-300" title="Delete skill"><Trash2 size={14} /></button></div>
      </div>
      <div className="mt-4 grid gap-2">
        {tasks.map((task) => <div key={task.id} className={`group flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 ${task.status === "Done" ? "border-emerald-500/20 bg-emerald-500/10" : "border-[#252A35] bg-[#161920]"}`}><button onClick={() => onToggleTask(task)} className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${task.status === "Done" ? "border-[#3ECF8E] bg-[#3ECF8E] text-[#0D0F12]" : "border-[#596274] text-transparent hover:border-[#5B8DEF]"}`} title={task.status === "Done" ? "Mark in progress" : "Mark done"}><CheckCircle2 size={13} /></button><button onClick={() => onEditTask(task)} className="min-w-0 flex-1 text-left"><p className={`truncate text-sm ${task.status === "Done" ? "text-[#7A8499] line-through" : "text-[#F0F2F5]"}`}>{task.title}</p><p className="mt-0.5 text-[10px] text-[#7A8499]">{task.learningType} · {task.actualMinutes}/{task.plannedMinutes} min</p></button><button onClick={() => onDeleteTask(task.id)} className="p-1 text-[#596274] opacity-0 hover:text-rose-300 group-hover:opacity-100" title="Delete task"><Trash2 size={13} /></button></div>)}
        {!tasks.length && <p className="rounded-lg border border-dashed border-[#3B4250] px-3 py-7 text-center text-xs text-[#7A8499]">No tasks for this date</p>}
      </div>
      <button onClick={onAddTask} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-current text-xs font-medium text-[#AAB3C5] hover:bg-white/[0.04]"><Plus size={14} /> Add task</button>
    </article>
  );
}

function ProgressMiniStat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-lg bg-[#1E2330] p-3 text-center"><p className="text-lg font-extrabold tabular-nums text-[#F0F2F5]">{value}</p><p className="mt-1 text-[10px] font-bold uppercase text-[#7A8499]">{label}</p></div>;
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-4" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><Card className="my-6 w-full max-w-md p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-[#7A8499] hover:bg-white/5 hover:text-white" aria-label="Close"><X size={18} /></button></div><div className="mt-5">{children}</div></Card></div>;
}

function WorkAnalytics({ weekStart }: { weekStart: string }) {
  const { data } = useStore();
  const week = scopedWeekData(data, weekStart);
  const score = productivityScore(week.workTasks, week.learningTasks);
  return (
    <AnalyticsGrid>
      <Metric title="Total work hours" value={`${minutesToHours(week.workTasks.reduce((total, task) => total + task.actualMinutes, 0))}h`} />
      <Metric title="Blocked tasks" value={week.workTasks.filter((task) => task.status === "Blocked").length} />
      <Metric title="High priority pending" value={week.workTasks.filter((task) => task.priority === "High" && task.status !== "Completed").length} />
      <Metric title="Weekly productivity" value={`${score}/100`} hint={productivityLabel(score)} />
      <ChartCard title="Daily work hours"><BarChartBox data={dailySeries(data, weekStart)} bars={[["workHours", "#2563EB"]]} /></ChartCard>
      <ChartCard title="Time by project"><PieChartBox data={projectDistribution(week.workTasks)} /></ChartCard>
      <ChartCard title="Status distribution"><PieChartBox data={statusDistribution(week.workTasks)} /></ChartCard>
      <ChartCard title="Priority distribution"><PieChartBox data={priorityDistribution(week.workTasks)} /></ChartCard>
    </AnalyticsGrid>
  );
}

function LearningAnalytics({ weekStart }: { weekStart: string }) {
  const { data } = useStore();
  const week = scopedWeekData(data, weekStart);
  const completed = week.learningTasks.filter((task) => task.status === "Done").length;
  const pending = week.learningTasks.filter((task) => task.status === "Planned" || task.status === "In Progress").length;
  const learningHours = minutesToHours(week.learningTasks.reduce((total, task) => total + task.actualMinutes, 0));
  const dailyData = dailySeries(data, weekStart);
  const categoryData = skillCategoryDistribution(week.skills, week.learningTasks);
  const hasDailyData = dailyData.some((item) => item.learningHours > 0);
  const completion = week.learningTasks.length ? Math.round((completed / week.learningTasks.length) * 100) : 0;
  const totalActualMinutes = week.learningTasks.reduce((total, task) => total + task.actualMinutes, 0);
  const totalPlannedMinutes = week.learningTasks.reduce((total, task) => total + task.plannedMinutes, 0);
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="grid gap-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><Metric title="Learning hours" value={`${learningHours}h`} /><Metric title="Tasks done" value={completed} /><Metric title="Pending tasks" value={pending} /><Metric title="Sessions logged" value={week.learningTasks.filter((task) => task.actualMinutes > 0).length} /></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Daily learning hours">{hasDailyData ? <BarChartBox data={dailyData} bars={[["learningHours", "#5B8DEF"]]} /> : <ChartEmptyState />}</ChartCard>
          <ChartCard title="Time by skill category">{categoryData.some((item) => item.value > 0) ? <PieChartBox data={categoryData} /> : <ChartEmptyState />}</ChartCard>
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold">Skill performance</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.skills.map((skill, index) => {
              const tasks = week.learningTasks.filter((task) => task.skillId === skill.id);
              const done = tasks.filter((task) => task.status === "Done").length;
              const actual = tasks.reduce((total, task) => total + task.actualMinutes, 0);
              return <div key={skill.id} className={`rounded-lg border p-4 ${["border-blue-500/50 bg-blue-500/[0.07]", "border-emerald-500/50 bg-emerald-500/[0.07]", "border-fuchsia-500/50 bg-fuchsia-500/[0.07]", "border-amber-500/50 bg-amber-500/[0.07]"][index % 4]}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{skill.skillName}</p><p className="mt-1 text-xs text-[#7A8499]">{skill.category} · {minutesToHours(actual)}h logged</p></div><span className="text-xs font-medium text-[#3ECF8E]">{done}/{tasks.length} done</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#252A35]"><div className="h-full bg-[#5B8DEF]" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} /></div></div>;
            })}
          </div>
        </div>
      </section>
      <Card className="h-fit xl:sticky xl:top-[90px]">
        <h2 className="text-base font-semibold">Weekly progress</h2>
        <div className="mt-4 rounded-lg bg-[#5B8DEF] p-5 text-white"><p className="text-[11px] font-bold uppercase text-blue-100">Completion</p><p className="mt-2 text-4xl font-extrabold tabular-nums">{completion}%</p><p className="mt-1 text-xs text-blue-100">{completed} of {week.learningTasks.length} tasks done</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full bg-[#3ECF8E]" style={{ width: `${completion}%` }} /></div></div>
        <div className="mt-5 grid grid-cols-2 gap-3"><ProgressMiniStat value={`${minutesToHours(totalActualMinutes)}h`} label="Actual" /><ProgressMiniStat value={`${minutesToHours(totalPlannedMinutes)}h`} label="Planned" /></div>
        <h3 className="mt-6 text-sm font-semibold">Category breakdown</h3>
        <div className="mt-3 grid gap-3">{categoryData.map((category, index) => <div key={category.name} className="rounded-lg border border-[#252A35] bg-[#1E2330] p-3"><div className="flex items-center justify-between text-xs"><span>{category.name}</span><span className="font-medium text-[#3ECF8E]">{category.value}h</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#343A48]"><div className="h-full" style={{ width: `${totalActualMinutes ? Math.min(100, (category.value * 60 / totalActualMinutes) * 100) : 0}%`, backgroundColor: colors[index % colors.length] }} /></div></div>)}</div>
      </Card>
    </div>
  );
}

function WeeklyReviewPage({ weekStart }: { weekStart: string }) {
  const { data, user, upsert } = useStore();
  const bounds = weekBounds(new Date(`${weekStart}T00:00:00`));
  const existing = data.weeklyReviews.find((review) => review.weekStartDate === weekStart);
  const [review, setReview] = useState<WeeklyReview>(() => existing || {
    id: newId("wr"),
    userId: user?.id || "",
    weekStartDate: bounds.startInput,
    weekEndDate: bounds.endInput,
    completedSummary: "",
    incompleteSummary: "",
    blockers: "",
    keyLearnings: "",
    skillsImproved: "",
    workHighlights: "",
    improvementAreas: "",
    nextWeekPlan: "",
    autoSummaryJson: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const summary = autoWeeklySummary(data, weekStart);

  function setField(field: keyof WeeklyReview, value: string) {
    setReview((current) => ({ ...current, [field]: value, updatedAt: new Date().toISOString() }));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <Card>
        <h2 className="font-semibold">Auto summary</h2>
        <div className="mt-4 grid gap-2 text-sm">
          {Object.entries(summary).map(([key, value]) => <div key={key} className="rounded-md bg-soft p-2"><span className="font-medium">{labelize(key)}: </span>{Array.isArray(value) ? value.join(", ") || "None" : String(value)}</div>)}
        </div>
        <Button className="mt-4 w-full" onClick={() => setReview((current) => ({ ...current, autoSummaryJson: summary }))}>Attach summary</Button>
      </Card>
      <Card>
        <h2 className="font-semibold">Weekly review notes</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(["completedSummary", "incompleteSummary", "blockers", "keyLearnings", "skillsImproved", "workHighlights", "improvementAreas", "nextWeekPlan"] as const).map((field) => (
            <Field key={field} label={labelize(field)}>
              <textarea className={inputClass} rows={4} value={String(review[field])} onChange={(e) => setField(field, e.target.value)} />
            </Field>
          ))}
        </div>
        <Button className="mt-4" onClick={() => user && upsert("weeklyReviews", { ...review, userId: user.id, autoSummaryJson: Object.keys(review.autoSummaryJson).length ? review.autoSummaryJson : summary })}><Save size={16} /> Save review</Button>
      </Card>
    </div>
  );
}

function SettingsPage() {
  const { mode, user, resetDemo, data, changePassword } = useStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (newPassword.length < 8) {
      setPasswordError("New password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("Choose a password different from your current password.");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <h2 className="font-semibold">Workspace</h2>
        <div className="mt-4 grid gap-2 text-sm">
          <p><span className="font-medium">User:</span> {user?.email}</p>
          <p><span className="font-medium">Storage mode:</span> {mode}</p>
          <p><span className="font-medium">Records:</span> {data.workTasks.length} work tasks, {data.skills.length} skills, {data.learningTasks.length} learning tasks</p>
        </div>
        <Button className="mt-4" variant="secondary" onClick={resetDemo}>Reload sample data</Button>
      </Card>
      <Card>
        <div className="flex items-center gap-2"><LockKeyhole size={18} className="text-blue-300" /><h2 className="font-semibold">Change password</h2></div>
        <p className="mt-2 text-sm text-slate-500">Verify your current password before setting a new one.</p>
        <form className="mt-4 grid gap-3" onSubmit={submitPassword}>
          <Field label="Current password"><input className={inputClass} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></Field>
          <Field label="New password"><input className={inputClass} type="password" minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></Field>
          <Field label="Confirm new password"><input className={inputClass} type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></Field>
          {passwordError && <p className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{passwordError}</p>}
          {passwordMessage && <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{passwordMessage}</p>}
          <Button className="w-fit" type="submit" disabled={changingPassword || mode !== "supabase"}>{changingPassword ? "Changing password..." : "Change password"}</Button>
        </form>
      </Card>
    </div>
  );
}

function CrudLayout({ title, filters, form, children }: { title: string; filters?: React.ReactNode; form: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="h-fit xl:sticky xl:top-[90px]">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        <div className="mt-4">{form}</div>
      </Card>
      <Card>
        {filters && <div className="mb-4 grid gap-3 md:grid-cols-2">{filters}</div>}
        <div className="grid gap-3">{children}</div>
      </Card>
    </div>
  );
}

function WorkTaskForm({ item, onSave, onCancel }: { item: WorkTask | null; onSave: (item: WorkTask) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [task, setTask] = useState<WorkTask>(item || {
    id: newId("wt"), userId: "", title: "", projectName: "Personal", productOwner: "Personal", platform: "", poc: "", category: "General", description: "", receivedDate: toDateInput(new Date()), assignedDate: toDateInput(new Date()), dueDate: toDateInput(new Date()), dayOfWeek: format(new Date(), "EEEE"), estimatedMinutes: 60, actualMinutes: 0, completionPercentage: 0, status: "Planned", priority: "Medium", workType: "Other", notes: "", deliverable: "", blockers: "", learnings: "", createdAt: stamp, updatedAt: stamp
  });
  return <FormGrid onSubmit={() => task.title.trim() && onSave({ ...task, dayOfWeek: format(new Date(`${task.assignedDate}T00:00:00`), "EEEE"), updatedAt: new Date().toISOString() })} onCancel={onCancel}>
    <TextField label="Task title" value={task.title} onChange={(v) => setTask({ ...task, title: v })} required />
    <SelectField label="Project" value={task.projectName || "Personal"} options={projectOptions} onChange={(v) => setTask({ ...task, projectName: v })} />
    <SelectField label="Product owner" value={task.productOwner || "Personal"} options={pocOptions} onChange={(v) => setTask({ ...task, productOwner: v, poc: v })} />
    <TextField label="Assigned date" type="date" value={task.assignedDate} onChange={(v) => setTask({ ...task, assignedDate: v })} />
    <TextField label="Due date" type="date" value={task.dueDate} onChange={(v) => setTask({ ...task, dueDate: v })} />
    <SelectField label="Status" value={task.status} options={["Backlog", "Planned", "In Progress", "Blocked", "Completed"]} onChange={(v) => setTask({ ...task, status: v as WorkTask["status"] })} />
    <SelectField label="Priority" value={task.priority} options={["Low", "Medium", "High"]} onChange={(v) => setTask({ ...task, priority: v as WorkTask["priority"] })} />
    <SelectField label="Category" value={task.category || "General"} options={workCategoryOptions} onChange={(v) => setTask({ ...task, category: v })} />
    <SelectField label="Work type" value={task.workType} options={["Research", "Analysis", "Testing", "Documentation", "Meeting", "Development", "Review", "Other"]} onChange={(v) => setTask({ ...task, workType: v as WorkTask["workType"] })} />
    <NumberField label="Estimated minutes" value={task.estimatedMinutes} onChange={(v) => setTask({ ...task, estimatedMinutes: v })} />
    <NumberField label="Actual minutes" value={task.actualMinutes} onChange={(v) => setTask({ ...task, actualMinutes: v })} />
    <NumberField label="Completion percentage" value={task.completionPercentage} onChange={(v) => setTask({ ...task, completionPercentage: Math.min(100, v), status: v >= 100 ? "Completed" : v > 0 ? "In Progress" : task.status })} />
    <details className="rounded-md border border-line p-3">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700">More details</summary>
      <div className="mt-3 grid gap-3">
        <SelectField label="Platform/tool" value={task.platform || "Other"} options={platformOptions} onChange={(v) => setTask({ ...task, platform: v })} />
        <SelectField label="POC/stakeholder" value={task.poc || "Personal"} options={pocOptions} onChange={(v) => setTask({ ...task, poc: v })} />
        <TextField label="Description" value={task.description} onChange={(v) => setTask({ ...task, description: v })} textarea />
        <TextField label="Notes" value={task.notes} onChange={(v) => setTask({ ...task, notes: v })} textarea />
        <TextField label="Deliverable" value={task.deliverable} onChange={(v) => setTask({ ...task, deliverable: v })} />
        <TextField label="Blockers" value={task.blockers} onChange={(v) => setTask({ ...task, blockers: v })} />
        <TextField label="Learnings" value={task.learnings} onChange={(v) => setTask({ ...task, learnings: v })} />
      </div>
    </details>
  </FormGrid>;
}

function SkillForm({ item, onSave, onCancel }: { item: Skill | null; onSave: (item: Skill) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [skill, setSkill] = useState<Skill>(item || { id: newId("sk"), userId: "", skillName: "", category: "Coding", currentLevel: "Beginner", targetLevel: "Advanced", weeklyTargetMinutes: 180, deadline: toDateInput(addMinutes(new Date(), 60 * 24 * 30)), createdAt: stamp, updatedAt: stamp });
  return <FormGrid onSubmit={() => skill.skillName.trim() && onSave({ ...skill, updatedAt: new Date().toISOString() })} onCancel={onCancel}>
    <TextField label="Skill name" value={skill.skillName} onChange={(v) => setSkill({ ...skill, skillName: v })} required />
    <SelectField label="Category" value={skill.category} options={["Coding", "Design", "Language", "Other"]} onChange={(v) => setSkill({ ...skill, category: v as Skill["category"] })} />
    <SelectField label="Current level" value={skill.currentLevel} options={["Beginner", "Intermediate", "Advanced"]} onChange={(v) => setSkill({ ...skill, currentLevel: v as Skill["currentLevel"] })} />
    <SelectField label="Target level" value={skill.targetLevel} options={["Beginner", "Intermediate", "Advanced"]} onChange={(v) => setSkill({ ...skill, targetLevel: v as Skill["targetLevel"] })} />
    <NumberField label="Weekly target minutes" value={skill.weeklyTargetMinutes} onChange={(v) => setSkill({ ...skill, weeklyTargetMinutes: v })} />
    <TextField label="Deadline" type="date" value={skill.deadline} onChange={(v) => setSkill({ ...skill, deadline: v })} />
  </FormGrid>;
}

function LearningTaskForm({ item, skills, onSave, onCancel }: { item: LearningTask | null; skills: Skill[]; onSave: (item: LearningTask) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [task, setTask] = useState<LearningTask>(item || { id: newId("lt"), userId: "", skillId: skills[0]?.id || "", title: "", learningType: "Practice", plannedDate: toDateInput(new Date()), plannedMinutes: 60, actualMinutes: 0, status: "Planned", createdAt: stamp, updatedAt: stamp });
  return <FormGrid onSubmit={() => task.title.trim() && onSave({ ...task, updatedAt: new Date().toISOString() })} onCancel={onCancel}>
    <SelectField label="Linked skill" value={task.skillId} options={skills.map((skill) => skill.id)} labels={Object.fromEntries(skills.map((skill) => [skill.id, skill.skillName]))} onChange={(v) => setTask({ ...task, skillId: v })} />
    <TextField label="Learning task title" value={task.title} onChange={(v) => setTask({ ...task, title: v })} required />
    <SelectField label="Type" value={task.learningType} options={["Read", "Watch", "Practice", "Build", "Review"]} onChange={(v) => setTask({ ...task, learningType: v as LearningTask["learningType"] })} />
    <TextField label="Planned date" type="date" value={task.plannedDate} onChange={(v) => setTask({ ...task, plannedDate: v })} />
    <NumberField label="Planned minutes" value={task.plannedMinutes} onChange={(v) => setTask({ ...task, plannedMinutes: v })} />
    <NumberField label="Actual minutes" value={task.actualMinutes} onChange={(v) => setTask({ ...task, actualMinutes: v })} />
    <SelectField label="Status" value={task.status} options={["Planned", "In Progress", "Done", "Skipped"]} onChange={(v) => setTask({ ...task, status: v as LearningTask["status"] })} />
  </FormGrid>;
}

function FormGrid({ children, onSubmit, onCancel }: { children: React.ReactNode; onSubmit: () => void; onCancel: () => void }) {
  return (
    <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {children}
      <div className="flex gap-2">
        <Button type="submit"><Save size={16} /> Save</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Clear</Button>
      </div>
    </form>
  );
}

function TextField({ label, value, onChange, type = "text", textarea, required }: { label: string; value: string; onChange: (value: string) => void; type?: string; textarea?: boolean; required?: boolean }) {
  return <Field label={label}>{textarea ? <textarea className={inputClass} rows={3} value={value} required={required} onChange={(e) => onChange(e.target.value)} /> : <input className={inputClass} type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} />}</Field>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <Field label={label}><input className={inputClass} type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value))} /></Field>;
}

function SelectField({ label, value, options, labels, onChange }: { label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return <Field label={label}><select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{labels?.[option] || option}</option>)}</select></Field>;
}

function TaskRow({ title, meta, badges, onEdit, onDelete }: { title: string; meta: string; badges: string[]; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-[#25313d] px-1 py-3 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{meta}</p>
        <div className="mt-2 flex flex-wrap gap-2">{badges.map((badge) => <Badge key={badge} tone={badgeTone(badge)}>{badge}</Badge>)}</div>
      </div>
      <RowActions onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex gap-2"><Button variant="secondary" onClick={onEdit}>Edit</Button><Button variant="danger" onClick={onDelete}><Trash2 size={15} /></Button></div>;
}

function AnalyticsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{children}</div>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card className="min-h-80 md:col-span-2"><h2 className="font-semibold">{title}</h2><div className="mt-4 h-64">{children}</div></Card>;
}

function ChartEmptyState() {
  return <div className="grid h-full place-items-center rounded-lg border border-dashed border-[#252A35] px-6 text-center text-sm text-[#7A8499]">No sessions logged yet — add your first task above</div>;
}

function BarChartBox({ data, bars }: { data: any[]; bars: [string, string][] }) {
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" /><YAxis /><Tooltip />{bars.map(([key, color]) => <Bar key={key} dataKey={key} fill={color} radius={[4, 4, 0, 0]} />)}</BarChart></ResponsiveContainer>;
}

function PieChartBox({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return <EmptyState title="No chart data" text="Add records to populate this chart." />;
  return <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>{data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>;
}

function badgeTone(label: string): "slate" | "blue" | "green" | "amber" | "red" {
  if (["Completed", "Done", "Low", "work"].includes(label)) return "green";
  if (["High", "Blocked", "Hard"].includes(label)) return "red";
  if (["Medium", "In Progress", "learning"].includes(label)) return "amber";
  if (["Planned", "Backlog"].includes(label)) return "blue";
  return "slate";
}

function confirmDelete(action: () => void) {
  if (window.confirm("Delete this record?")) action();
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
