"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
  Clock3,
  CreditCard,
  Goal,
  IndianRupee,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  LogOut,
  Mail,
  Plus,
  Printer,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCircle,
  UserRound,
  WalletCards
} from "lucide-react";
import { addMinutes, differenceInMinutes, format } from "date-fns";
import { autoWeeklySummary, dailySeries, dashboardMetrics, priorityDistribution, productivityLabel, productivityScore, projectDistribution, scopedWeekData, skillCategoryDistribution, statusDistribution } from "@/lib/analytics";
import { minutesToHours, toDateInput, weekBounds, weekDays } from "@/lib/date";
import { budgetStatuses, categoryTotals, currency, dailyExpenseSeries, dueThisWeek, financeMetrics, financeMonthData, goalProgress, inMonth, investmentAllocation, monthlyFinanceSummary, monthlyTrend, monthKey, natureTotals, paymentModeTotals, portfolioMetrics, weeklyFinanceSummary } from "@/lib/finance";
import { newId, useStore } from "@/lib/storage";
import { sprintCsv, sprintShareText, tasksForSprint } from "@/lib/sprint";
import { Budget, CategoryBudget, Emi, Expense, FinancialGoal, FinanceSettings, IncomeEntry, Investment, InvestmentValueHistory, LearningTask, MonthlyFinanceReview, Skill, TimeLog, UpcomingPayment, WeeklyReview, WorkTask } from "@/lib/types";
import { Badge, Button, Card, EmptyState, Field, ProgressBar, inputClass } from "./ui";

type Tab = "Dashboard" | "Weekly Planner" | "Work Tasks" | "Sprint Plan" | "Skills" | "Time Tracker" | "Work Analytics" | "Learning Analytics" | "Weekly Review" | "Finance Dashboard" | "Expenses" | "Budget" | "EMI Tracker" | "Upcoming Payments" | "Investments" | "Financial Goals" | "Finance Analytics" | "Monthly Finance Review" | "Settings";
const navGroups: { label: string; items: { tab: Tab; label: string; icon: React.ElementType }[] }[] = [
  { label: "", items: [{ tab: "Dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Work",
    items: [
      { tab: "Work Tasks", label: "Tasks", icon: ListChecks },
      { tab: "Sprint Plan", label: "Sprint plan", icon: BriefcaseBusiness },
      { tab: "Weekly Planner", label: "Weekly planner", icon: CalendarDays },
      { tab: "Time Tracker", label: "Time tracker", icon: Clock3 },
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
  },
  {
    label: "Finance",
    items: [
      { tab: "Finance Dashboard", label: "Overview", icon: IndianRupee },
      { tab: "Expenses", label: "Income & expenses", icon: CreditCard },
      { tab: "Budget", label: "Budgets", icon: BarChart3 },
      { tab: "EMI Tracker", label: "EMIs & loans", icon: WalletCards },
      { tab: "Upcoming Payments", label: "Payments", icon: CalendarDays },
      { tab: "Investments", label: "Investments", icon: TrendingUp },
      { tab: "Financial Goals", label: "Financial goals", icon: Goal },
      { tab: "Finance Analytics", label: "Finance analytics", icon: BarChart3 },
      { tab: "Monthly Finance Review", label: "Monthly review", icon: CheckCircle2 }
    ]
  }
];

const colors = ["#2563EB", "#0F9F6E", "#D97706", "#DC2626", "#7C3AED", "#0891B2"];
const expenseCategories: Expense["category"][] = ["Food", "Travel", "Shopping", "Rent", "EMI", "Groceries", "Health", "Subscriptions", "Entertainment", "Family", "Education", "Work-related", "Utilities", "Investment", "Other"];
const paymentModes: Expense["paymentMode"][] = ["UPI", "Cash", "Credit Card", "Debit Card", "Net Banking", "Wallet", "Other"];
const projectOptions = ["AI Governance", "Synthetic Testing", "Coca-Cola Creative Analysis", "DU Telecom Concept Testing", "Personal", "Other"];
const platformOptions = ["AI Governance Portal", "PowerPoint", "Docs", "Analytics workbook", "Excel", "Power BI", "Supabase", "Vercel", "Other"];
const pocOptions = ["Vaibhav", "Internal", "Research team", "Product team", "Personal", "Other"];
const workCategoryOptions = ["Validation", "Analysis", "Benchmarking", "Documentation", "Testing", "Development", "Review", "Meeting", "General", "Other"];

export function MonitorApp() {
  const store = useStore();
  const [active, setActive] = useState<Tab>("Dashboard");
  const [weekStart, setWeekStart] = useState(weekBounds().startInput);
  const [financeMonth, setFinanceMonth] = useState(monthKey());

  if (store.loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading your workspace...</div>;
  }

  if (!store.user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-[#080d14] text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[238px] border-r border-[#24303d] bg-[#091019] lg:flex lg:flex-col">
        <div className="flex h-[70px] items-center gap-3 border-b border-[#24303d] px-5">
          <div className="grid h-8 w-8 place-items-center rounded-full border border-slate-500 text-slate-100"><CheckCircle2 size={19} /></div>
          <div><p className="text-[15px] font-semibold leading-tight text-slate-100">Daily Task &</p><p className="text-[15px] font-semibold leading-tight text-slate-100">Skill Monitor</p></div>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label || "overview"} className="mb-5">
              {group.label && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{group.label}</p>}
              <div className="grid gap-1">
                {group.items.map(({ tab, label, icon: Icon }) => (
                  <button key={tab} onClick={() => setActive(tab)} className={`flex h-9 w-full items-center gap-3 rounded-md border px-3 text-left text-[13px] transition ${active === tab ? "border-blue-500/60 bg-blue-500/20 font-medium text-blue-100" : "border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"}`}>
                    <Icon size={17} strokeWidth={1.8} />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[#24303d] p-3">
          <button onClick={() => setActive("Settings")} className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-[13px] text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"><Settings size={17} /> Settings</button>
          <button onClick={() => store.signOut()} className="mt-1 flex h-9 w-full items-center gap-3 rounded-md px-3 text-[13px] text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"><LogOut size={17} /> Sign out</button>
          <div className="mt-3 flex items-center gap-3 rounded-md border border-[#24303d] bg-[#0d151f] p-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600/30 text-sm font-semibold text-blue-100">{store.user.name.slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-200">{store.user.name}</p><p className="truncate text-[10px] text-slate-500">{store.mode === "supabase" ? "Cloud workspace" : "Personal workspace"}</p></div>
          </div>
        </div>

      </aside>

      <main className="lg:pl-[238px]">
        <header className="sticky top-0 z-10 border-b border-[#24303d] bg-[#091019]/95 backdrop-blur">
          <div className="flex h-[70px] items-center gap-3 px-4 lg:px-6">
            <div className="hidden text-sm text-slate-400 md:block">{format(new Date(`${weekStart}T00:00:00`), "MMM d")} - {format(addMinutes(new Date(`${weekStart}T00:00:00`), 6 * 24 * 60), "MMM d, yyyy")}</div>
            <div className="ml-auto flex items-center gap-2">
              <Button className="h-10 px-4" onClick={() => setActive("Work Tasks")}><Plus size={17} /><span className="hidden sm:inline">Quick add task</span></Button>
              <button className="grid h-10 w-10 place-items-center rounded-md border border-[#2b3745] text-slate-400 hover:bg-white/[0.05] hover:text-white lg:hidden" onClick={() => setActive("Settings")} title="Profile"><UserCircle size={19} /></button>
            </div>
          </div>
          <div className="scrollbar-thin flex gap-1 overflow-x-auto border-t border-[#18222d] px-3 py-2 lg:hidden">
            {navGroups.flatMap((group) => group.items).map(({ tab, label }) => <button key={tab} onClick={() => setActive(tab)} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${active === tab ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/[0.05]"}`}>{label}</button>)}
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-3 sm:p-4 lg:p-5">
          {active !== "Dashboard" && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xl font-semibold text-slate-100">{active}</p><p className="mt-1 text-xs text-slate-500">{active.includes("Finance") || ["Expenses", "Budget", "EMI Tracker", "Upcoming Payments", "Investments", "Financial Goals"].includes(active) ? `Month ${financeMonth}` : `Week of ${format(new Date(`${weekStart}T00:00:00`), "MMM d, yyyy")}`}</p></div>
              {active.includes("Finance") || ["Expenses", "Budget", "EMI Tracker", "Upcoming Payments", "Investments", "Financial Goals"].includes(active) ? <input className={inputClass} type="month" value={financeMonth} onChange={(event) => setFinanceMonth(event.target.value)} /> : <input className={inputClass} type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} />}
            </div>
          )}
          {active === "Dashboard" && <Dashboard key={weekStart} weekStart={weekStart} setActive={setActive} />}
          {active === "Weekly Planner" && <WeeklyPlanner weekStart={weekStart} />}
          {active === "Work Tasks" && <WorkTasks />}
          {active === "Sprint Plan" && <SprintPlanPage weekStart={weekStart} />}
          {active === "Skills" && <Skills />}
          {active === "Time Tracker" && <TimeTracker />}
          {active === "Work Analytics" && <WorkAnalytics weekStart={weekStart} />}
          {active === "Learning Analytics" && <LearningAnalytics weekStart={weekStart} />}
          {active === "Weekly Review" && <WeeklyReviewPage weekStart={weekStart} />}
          {active === "Finance Dashboard" && <FinanceDashboard month={financeMonth} weekStart={weekStart} setActive={setActive} />}
          {active === "Expenses" && <ExpensesPage month={financeMonth} />}
          {active === "Budget" && <BudgetPage month={financeMonth} />}
          {active === "EMI Tracker" && <EmiPage month={financeMonth} />}
          {active === "Upcoming Payments" && <UpcomingPaymentsPage month={financeMonth} />}
          {active === "Investments" && <InvestmentsPage month={financeMonth} />}
          {active === "Financial Goals" && <FinancialGoalsPage />}
          {active === "Finance Analytics" && <FinanceAnalytics month={financeMonth} weekStart={weekStart} />}
          {active === "Monthly Finance Review" && <MonthlyFinanceReviewPage month={financeMonth} />}
          {active === "Settings" && <SettingsPage />}
        </div>
      </main>
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

function Dashboard({ weekStart, setActive }: { weekStart: string; setActive: (tab: Tab) => void }) {
  const { data, upsert } = useStore();
  const week = scopedWeekData(data, weekStart);
  const metrics = dashboardMetrics(data, weekStart);
  const days = weekDays(new Date(`${weekStart}T00:00:00`));
  const todayInput = toDateInput(new Date());
  const [selectedDate, setSelectedDate] = useState(() => days.some((day) => day.input === todayInput) ? todayInput : days[0].input);
  const selectedDay = days.find((day) => day.input === selectedDate) || days[0];
  const selectedWork = data.workTasks.filter((task) => task.assignedDate === selectedDay.input);
  const selectedLearning = data.learningTasks.filter((task) => task.plannedDate === selectedDay.input);
  const selectedExpenses = data.expenses.filter((expense) => expense.expenseDate === selectedDay.input);
  const selectedLogs = data.timeLogs.filter((log) => log.date === selectedDay.input);
  const finance = financeMetrics(data, monthKey());
  const totalTasks = week.workTasks.length + week.learningTasks.length;
  const completedTasks = week.workTasks.filter((task) => task.status === "Completed").length + week.learningTasks.filter((task) => task.status === "Completed").length;
  const completion = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const agenda: AgendaEntry[] = [
    ...selectedWork.map((task, index) => ({ id: task.id, time: ["07:30", "09:30", "14:00", "17:00"][index % 4], type: "Work Task", title: task.title, meta: task.projectName || "Personal", accent: "blue", done: task.status === "Completed", icon: BriefcaseBusiness, onToggle: () => void upsert("workTasks", { ...task, status: task.status === "Completed" ? "In Progress" : "Completed", completionPercentage: task.status === "Completed" ? Math.min(task.completionPercentage, 99) : 100, updatedAt: new Date().toISOString() }) })),
    ...selectedLearning.map((task, index) => ({ id: task.id, time: ["11:30", "16:00", "19:00"][index % 3], type: "Learning Session", title: task.title, meta: `${task.plannedMinutes} min`, accent: "amber", done: task.status === "Completed", icon: BookOpen, onToggle: () => void upsert("learningTasks", { ...task, status: task.status === "Completed" ? "In Progress" : "Completed", updatedAt: new Date().toISOString() }) })),
    ...selectedExpenses.slice(0, 2).map((expense, index) => ({ id: expense.id, time: expense.expenseTime || ["13:00", "18:15"][index], type: "Expense", title: expense.title, meta: currency.format(expense.amount), accent: "rose", done: false, icon: CreditCard }))
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="overflow-hidden rounded-lg border border-[#24303d] bg-[#091019]">
      <div className="scrollbar-thin grid min-w-[760px] grid-cols-7 border-b border-[#24303d]">
        {days.map((day) => {
          const count = data.workTasks.filter((task) => task.assignedDate === day.input).length + data.learningTasks.filter((task) => task.plannedDate === day.input).length;
          const active = day.input === selectedDay.input;
          const isToday = day.input === todayInput;
          return (
            <button key={day.input} type="button" aria-pressed={active} onClick={() => setSelectedDate(day.input)} className={`min-h-[122px] border-r border-[#24303d] px-3 py-4 text-center last:border-r-0 ${active ? "bg-blue-600/25" : "hover:bg-white/[0.025]"}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${active ? "text-blue-200" : "text-slate-400"}`}>{day.dayName.slice(0, 3)}</p>
              <p className={`mt-1 text-3xl font-semibold ${active ? "text-blue-100" : "text-slate-300"}`}>{format(day.date, "d")}</p>
              <p className={`mt-1 text-[11px] ${active ? "text-blue-300" : "text-slate-500"}`}>{isToday ? "Today" : `${count} tasks`}</p>
              <span className={`mx-auto mt-2 block h-1.5 w-1.5 rounded-full ${active ? "bg-blue-400" : count ? "bg-slate-500" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_418px]">
        <section className="border-b border-[#24303d] xl:border-b-0 xl:border-r">
          <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-[#24303d] px-5">
            <div>
              <h1 className="text-lg font-semibold text-slate-100">{format(selectedDay.date, "EEEE, MMMM d")}</h1>
              <p className="mt-1 text-xs text-slate-500">{agenda.length} items planned across work, learning, and money</p>
            </div>
            <Button variant="secondary" onClick={() => setActive("Weekly Planner")}><CalendarDays size={16} /> Open planner</Button>
          </div>

          <div className="relative px-5 py-2">
            {agenda.length ? agenda.map((item) => <AgendaItem key={item.id} {...item} />) : <div className="py-16"><EmptyState title="A clear day" text="Add a work task, learning session, or expense to build today's flow." /></div>}
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

        <aside className="bg-[#0b121b] p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-100">My progress</h2><Badge tone="blue">This week</Badge></div>
          <div className="grid gap-3">
            <ProgressStat title="Weekly completion" value={`${completion}%`} detail={`${completedTasks} of ${totalTasks} tasks done`} progress={completion} tone="green" icon={Goal} />
            <ProgressStat title="Focus hours" value={`${metrics.totalWorkHours}h`} detail={`${selectedLogs.filter((log) => log.logType === "Work").length} logs on selected day`} progress={Math.min(100, metrics.totalWorkHours * 5)} tone="blue" icon={Clock3} />
            <ProgressStat title="Skill practice" value={`${metrics.totalLearningHours}h`} detail={`${selectedLearning.length} learning items on selected day`} progress={Math.min(100, metrics.skillProgress)} tone="amber" icon={BookOpen} />
            <div className="rounded-lg border border-[#2a3744] bg-[#0d151f] p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300"><IndianRupee size={16} className="text-amber-300" /> Salary vs spending</div>
              <div className="mt-3 flex items-end justify-between gap-3"><div><p className="text-xl font-semibold text-emerald-300">{currency.format(finance.remainingBalance)}</p><p className="text-[11px] text-slate-500">Balance</p></div><div className="text-right"><p className="text-sm text-slate-200">{currency.format(finance.totalIncome)}</p><p className="text-[11px] text-slate-500">Income</p></div></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#202b37]"><div className="h-full bg-emerald-400" style={{ width: `${Math.max(0, Math.min(100, 100 - finance.expenseToIncome))}%` }} /></div>
              <div className="mt-3 flex justify-between text-xs"><span className="text-rose-300">{currency.format(finance.totalExpenses)} spent</span><span className="text-slate-500">{finance.expenseToIncome}%</span></div>
            </div>
            <div className="rounded-lg border border-[#2a3744] bg-[#0d151f] p-4">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-medium text-slate-300"><WalletCards size={16} className="text-amber-300" /> Upcoming EMI</div><button onClick={() => setActive("EMI Tracker")} className="text-[11px] text-blue-400 hover:text-blue-300">View all</button></div>
              <p className="mt-3 text-xl font-semibold text-slate-100">{currency.format(finance.totalEmi)}</p>
              <p className="mt-1 text-[11px] text-slate-500">{finance.emiToIncome}% of monthly income</p>
            </div>
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

function FinanceSummaryWidget() {
  const { data } = useStore();
  const metrics = financeMetrics(data, monthKey());
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Personal finance this month</h2>
          <p className="text-sm text-slate-500">Compact money snapshot without crowding your work dashboard.</p>
        </div>
        <Badge tone={metrics.financeScore >= 70 ? "green" : metrics.financeScore >= 40 ? "amber" : "red"}>{metrics.financeScore}/100</Badge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MiniMoney label="Spending" value={metrics.totalExpenses} />
        <MiniMoney label="Monthly EMI" value={metrics.totalEmi} />
        <MiniMoney label="Savings" value={metrics.savings} />
        <MiniMoney label="Investment" value={metrics.totalInvestment} />
        <MiniMoney label="Remaining" value={metrics.remainingBalance} />
        <div className="rounded-md bg-soft p-3">
          <p className="text-xs text-slate-500">Finance score</p>
          <p className="mt-1 text-sm font-semibold">{metrics.financeLabel}</p>
        </div>
      </div>
    </Card>
  );
}

function MiniMoney({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-soft p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold ${value < 0 ? "text-red-600" : "text-ink"}`}>{currency.format(value)}</p>
    </div>
  );
}

function Metric({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <Card className="min-h-[104px]">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-semibold text-slate-100">{value}</p>
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

function QuickAdd() {
  const { user, upsert } = useStore();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"work" | "learning">("work");
  const today = toDateInput(new Date());

  async function add() {
    if (!user || !title.trim()) return;
    const stamp = new Date().toISOString();
    if (type === "work") {
      await upsert("workTasks", {
        id: newId("wt"),
        userId: user.id,
        title,
        projectName: "Personal",
        productOwner: "Personal",
        platform: "",
        poc: "",
        category: "General",
        description: "",
        receivedDate: today,
        assignedDate: today,
        dueDate: today,
        dayOfWeek: format(new Date(), "EEEE"),
        estimatedMinutes: 60,
        actualMinutes: 0,
        completionPercentage: 0,
        status: "Planned",
        priority: "Medium",
        workType: "Other",
        notes: "",
        deliverable: "",
        blockers: "",
        learnings: "",
        createdAt: stamp,
        updatedAt: stamp
      } satisfies WorkTask);
    } else {
      await upsert("learningTasks", {
        id: newId("lt"),
        userId: user.id,
        skillId: "",
        title,
        description: "",
        resourceLink: "",
        learningType: "Practice",
        plannedDate: today,
        plannedMinutes: 60,
        actualMinutes: 0,
        status: "Planned",
        difficulty: "Medium",
        understandingScore: 3,
        outputCreated: "",
        notes: "",
        createdAt: stamp,
        updatedAt: stamp
      } satisfies LearningTask);
    }
    setTitle("");
  }

  return (
    <Card>
      <h2 className="font-semibold">Quick add</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr_auto]">
        <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as "work" | "learning")}>
          <option value="work">Work task</option>
          <option value="learning">Learning task</option>
        </select>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs attention today?" />
        <Button onClick={add}><Plus size={16} /> Add</Button>
      </div>
    </Card>
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
        const logs = data.timeLogs.filter((log) => log.date === day.input);
        const finance = data.expenses.filter((expense) => expense.expenseDate === day.input);
        const planned = work.reduce((t, task) => t + task.estimatedMinutes, 0) + learning.reduce((t, task) => t + task.plannedMinutes, 0);
        const actual = logs.reduce((t, log) => t + log.durationMinutes, 0);
        const completed = work.filter((task) => task.status === "Completed").length + learning.filter((task) => task.status === "Completed").length;
        const total = work.length + learning.length;
        const percent = total ? Math.round((completed / total) * 100) : 0;
        return (
          <Card key={day.input}>
            <div className="grid gap-4 xl:grid-cols-[180px_1fr_1fr_220px_220px]">
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
              <PlannerColumn title="Time Logged" items={logs.map((log) => ({ id: log.id, text: `${log.logType}: ${minutesToHours(log.durationMinutes)}h`, meta: log.notes || "Manual log" }))} />
              <PlannerColumn title="Finance" items={[
                { id: `${day.input}-expense`, text: `Spend ${currency.format(finance.reduce((t, item) => t + item.amount, 0))}`, meta: `Work ${currency.format(finance.filter((item) => item.category === "Work-related").reduce((t, item) => t + item.amount, 0))}` },
                { id: `${day.input}-learning`, text: `Education ${currency.format(finance.filter((item) => item.category === "Education").reduce((t, item) => t + item.amount, 0))}`, meta: `Investment ${currency.format(finance.filter((item) => item.expenseNature === "Investment").reduce((t, item) => t + item.amount, 0))}` },
                { id: `${day.input}-emi`, text: `EMI ${currency.format(finance.filter((item) => item.expenseNature === "EMI").reduce((t, item) => t + item.amount, 0))}`, meta: finance.find((item) => item.notes)?.notes || "Daily finance notes" }
              ]} />
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
          <tr><th className="px-2 py-3">Project / task</th><th className="px-2">Owner</th><th className="px-2">Hours</th><th className="px-2">Complete</th><th className="px-2">Given</th><th className="px-2">Due</th><th className="px-2">Status</th><th /></tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-[#202b36] last:border-0 hover:bg-white/[0.025]">
              <td className="max-w-[290px] px-2 py-3"><p className="truncate font-medium text-slate-200">{task.title}</p><p className="mt-1 truncate text-slate-500">{task.projectName}</p></td>
              <td className="px-2"><input className="w-28 rounded border border-transparent bg-transparent px-2 py-1.5 text-slate-300 hover:border-[#344251] focus:border-blue-500" defaultValue={task.productOwner} onBlur={(e) => { if (e.target.value !== task.productOwner) onChange({ ...task, productOwner: e.target.value, poc: e.target.value, updatedAt: new Date().toISOString() }); }} /></td>
              <td className="px-2"><input className="w-16 rounded border border-transparent bg-transparent px-2 py-1.5 text-slate-300 hover:border-[#344251] focus:border-blue-500" type="number" min="0" step="0.25" defaultValue={Math.round((task.actualMinutes / 60) * 100) / 100} onBlur={(e) => { const minutes = Math.max(0, Math.round((Number(e.target.value) || 0) * 60)); if (minutes !== task.actualMinutes) onChange({ ...task, actualMinutes: minutes, updatedAt: new Date().toISOString() }); }} /></td>
              <td className="px-2"><div className="flex items-center gap-2"><input className="w-16 rounded border border-transparent bg-transparent px-2 py-1.5 text-slate-300 hover:border-[#344251] focus:border-blue-500" type="number" min="0" max="100" defaultValue={task.completionPercentage} onBlur={(e) => { const value = Math.max(0, Math.min(100, Number(e.target.value) || 0)); if (value !== task.completionPercentage) onChange({ ...task, completionPercentage: value, status: value >= 100 ? "Completed" : value > 0 ? "In Progress" : "Planned", updatedAt: new Date().toISOString() }); }} /><span className="text-slate-600">%</span></div></td>
              <td className="px-2"><input className="w-32 rounded border border-transparent bg-transparent px-2 py-1.5 text-slate-400 hover:border-[#344251] focus:border-blue-500" type="date" value={task.receivedDate} onChange={(e) => onChange({ ...task, receivedDate: e.target.value, updatedAt: new Date().toISOString() })} /></td>
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

function Skills() {
  const { data, user, upsert, remove } = useStore();
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingLearning, setEditingLearning] = useState<LearningTask | null>(null);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <CrudLayout title="Skills" form={<SkillForm item={editingSkill} onCancel={() => setEditingSkill(null)} onSave={(item) => { if (user) void upsert("skills", { ...item, userId: user.id }); setEditingSkill(null); }} />}>
        {data.skills.map((skill) => (
          <div key={skill.id} className="rounded-lg border border-line p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{skill.skillName}</p>
                <p className="text-sm text-slate-500">{skill.category} - {skill.currentLevel} to {skill.targetLevel}</p>
              </div>
              <RowActions onEdit={() => setEditingSkill(skill)} onDelete={() => confirmDelete(() => remove("skills", skill.id))} />
            </div>
            <div className="mt-3"><ProgressBar value={skill.progressPercentage} /></div>
            <p className="mt-2 text-xs text-slate-500">{skill.progressPercentage}% progress - confidence {skill.confidenceScore}/5 - target {minutesToHours(skill.weeklyTargetMinutes)}h/week</p>
          </div>
        ))}
      </CrudLayout>
      <CrudLayout title="Learning tasks" form={<LearningTaskForm item={editingLearning} skills={data.skills} onCancel={() => setEditingLearning(null)} onSave={(item) => { if (user) void upsert("learningTasks", { ...item, userId: user.id }); setEditingLearning(null); }} />}>
        {data.learningTasks.map((task) => {
          const skill = data.skills.find((item) => item.id === task.skillId);
          return <TaskRow key={task.id} title={task.title} meta={`${skill?.skillName || "No skill linked"} - ${task.learningType} - ${minutesToHours(task.actualMinutes)}/${minutesToHours(task.plannedMinutes)}h`} badges={[task.status, task.difficulty]} onEdit={() => setEditingLearning(task)} onDelete={() => confirmDelete(() => remove("learningTasks", task.id))} />;
        })}
      </CrudLayout>
    </div>
  );
}

function TimeTracker() {
  const { data, user, upsert, remove } = useStore();
  const [running, setRunning] = useState<{ startedAt: Date; linkedType: TimeLog["linkedType"]; linkedId: string; logType: TimeLog["logType"] } | null>(null);
  const [editing, setEditing] = useState<TimeLog | null>(null);

  async function stopTimer() {
    if (!running || !user) return;
    const end = new Date();
    const duration = Math.max(1, differenceInMinutes(end, running.startedAt));
    const stamp = new Date().toISOString();
    await upsert("timeLogs", {
      id: newId("tl"),
      userId: user.id,
      linkedType: running.linkedType,
      linkedId: running.linkedId,
      logType: running.logType,
      date: toDateInput(running.startedAt),
      startTime: format(running.startedAt, "HH:mm"),
      endTime: format(end, "HH:mm"),
      durationMinutes: duration,
      notes: "Timer entry",
      createdAt: stamp
    });
    setRunning(null);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <Card>
        <h2 className="font-semibold">Timer</h2>
        <div className="mt-4 grid gap-3">
          <select className={inputClass} value={running?.logType || "Work"} disabled={Boolean(running)} onChange={() => undefined}>
            <option>Work</option><option>Learning</option><option>Personal</option>
          </select>
          {running ? (
            <>
              <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Started at {format(running.startedAt, "HH:mm")}</p>
              <Button onClick={stopTimer}>Stop timer</Button>
              <Button variant="secondary" onClick={() => setRunning(null)}>Pause / discard</Button>
            </>
          ) : (
            <Button onClick={() => setRunning({ startedAt: new Date(), linkedType: "none", linkedId: "", logType: "Work" })}>Start timer</Button>
          )}
        </div>
      </Card>
      <CrudLayout title="Time logs" form={<TimeLogForm item={editing} workTasks={data.workTasks} learningTasks={data.learningTasks} onCancel={() => setEditing(null)} onSave={(item) => { if (user) void upsert("timeLogs", { ...item, userId: user.id }); setEditing(null); }} />}>
        {data.timeLogs.map((log) => <TaskRow key={log.id} title={`${log.logType} - ${minutesToHours(log.durationMinutes)}h`} meta={`${log.date} ${log.startTime || ""}-${log.endTime || ""} - ${log.notes}`} badges={[log.linkedType]} onEdit={() => setEditing(log)} onDelete={() => confirmDelete(() => remove("timeLogs", log.id))} />)}
      </CrudLayout>
    </div>
  );
}

function WorkAnalytics({ weekStart }: { weekStart: string }) {
  const { data } = useStore();
  const week = scopedWeekData(data, weekStart);
  const score = productivityScore(week.workTasks, week.learningTasks, week.skills);
  return (
    <AnalyticsGrid>
      <Metric title="Total work hours" value={`${minutesToHours(week.timeLogs.filter((l) => l.logType === "Work").reduce((t, l) => t + l.durationMinutes, 0))}h`} />
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
  const completed = week.learningTasks.filter((task) => task.status === "Completed").length;
  return (
    <AnalyticsGrid>
      <Metric title="Learning hours" value={`${minutesToHours(week.timeLogs.filter((l) => l.logType === "Learning").reduce((t, l) => t + l.durationMinutes, 0))}h`} />
      <Metric title="Learning tasks done" value={completed} />
      <Metric title="Pending learning" value={week.learningTasks.length - completed} />
      <Metric title="Consistency score" value={`${Math.min(100, new Set(week.learningTasks.filter((task) => task.actualMinutes > 0).map((task) => task.plannedDate)).size * 20)}%`} />
      <ChartCard title="Daily learning hours"><BarChartBox data={dailySeries(data, weekStart)} bars={[["learningHours", "#0F9F6E"]]} /></ChartCard>
      <ChartCard title="Time by skill category"><PieChartBox data={skillCategoryDistribution(week.skills, week.learningTasks)} /></ChartCard>
      <ChartCard title="Skill progress"><SkillProgressChart skills={week.skills} /></ChartCard>
      <Card className="md:col-span-2">
        <h2 className="font-semibold">Skills needing attention</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {week.skills.filter((skill) => skill.progressPercentage < 60 || skill.confidenceScore < 4).map((skill) => <div key={skill.id} className="rounded-md border border-line p-3"><p className="font-medium">{skill.skillName}</p><p className="text-sm text-slate-500">{skill.progressPercentage}% progress, confidence {skill.confidenceScore}/5</p></div>)}
        </div>
      </Card>
    </AnalyticsGrid>
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

function FinanceDashboard({ month, weekStart, setActive }: { month: string; weekStart: string; setActive: (tab: Tab) => void }) {
  const { data } = useStore();
  const metrics = financeMetrics(data, month);
  const weekly = weeklyFinanceSummary(data, weekStart, month);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Monthly income" value={currency.format(metrics.totalIncome)} />
        <Metric title="Total expenses" value={currency.format(metrics.totalExpenses)} />
        <Metric title="EMI amount" value={currency.format(metrics.totalEmi)} hint={`${metrics.emiToIncome}% of income`} />
        <Metric title="Remaining balance" value={currency.format(metrics.remainingBalance)} />
        <Metric title="Invested this month" value={currency.format(metrics.totalInvestment)} />
        <Metric title="Portfolio value" value={currency.format(metrics.currentInvestmentValue)} />
        <Metric title="Savings rate" value={`${metrics.savingsRate}%`} />
        <Metric title="Discipline score" value={`${metrics.financeScore}/100`} hint={metrics.financeLabel} />
      </div>
      {metrics.emiToIncome > 35 && <Card className="border-amber-200 bg-amber-50"><p className="text-sm font-medium text-amber-800">Your EMI commitment is taking a high share of your monthly income. Keep enough buffer for savings and emergency expenses.</p></Card>}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title="Weekly expense trend"><BarChartBox data={dailyExpenseSeries(data, weekStart)} bars={[["expense", "#DC2626"], ["investment", "#0F9F6E"], ["emi", "#D97706"]]} /></ChartCard>
        <Card>
          <h2 className="font-semibold">Month summary</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <p>Highest category: <span className="font-semibold">{metrics.highestCategory}</span></p>
            <p>Average daily spend: <span className="font-semibold">{currency.format(metrics.averageDailySpend)}</span></p>
            <p>Budget usage: <span className="font-semibold">{metrics.budgetUsage}%</span></p>
            <p>Expense-to-income: <span className="font-semibold">{metrics.expenseToIncome}%</span></p>
            <p>Upcoming dues: <span className="font-semibold">{currency.format(metrics.upcomingDue)}</span></p>
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <p className="font-semibold">Weekly finance view</p>
            <p>Total weekly spend: {currency.format(weekly.totalWeeklySpend)}</p>
            <p>Highest spending day: {weekly.highestSpendingDay}</p>
            <p>Budget remaining: {currency.format(weekly.budgetRemaining)}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setActive("Expenses")}>Add expense</Button>
            <Button variant="secondary" onClick={() => setActive("Investments")}>Update portfolio</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ExpensesPage({ month }: { month: string }) {
  const { data, user, upsert, remove } = useStore();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [mode, setMode] = useState("All");
  const expenses = data.expenses.filter((expense) => inMonth(expense.expenseDate, month) && (category === "All" || expense.category === category) && (mode === "All" || expense.paymentMode === mode) && expense.title.toLowerCase().includes(query.toLowerCase()));
  const monthIncome = data.incomeEntries.filter((item) => item.month === month || inMonth(item.receivedDate, month));

  function exportExpenses() {
    downloadCsv("expenses.csv", ["date,title,amount,category,payment_mode,notes", ...expenses.map((item) => [item.expenseDate, item.title, item.amount, item.category, item.paymentMode, item.notes].join(","))].join("\n"));
  }

  async function importExpenses(file: File) {
    const text = await file.text();
    const rows = text.split(/\r?\n/).slice(1).filter(Boolean);
    const stamp = new Date().toISOString();
    for (const row of rows) {
      const [date, title, amount, importedCategory, paymentMode, notes = ""] = row.split(",");
      if (!date || !title || !amount || !user) continue;
      const duplicate = data.expenses.some((item) => item.expenseDate === date && item.title === title && item.amount === Number(amount));
      if (!duplicate) {
        await upsert("expenses", { id: newId("exp"), userId: user.id, title, amount: Number(amount), expenseDate: date, expenseTime: "09:00", category: (importedCategory || "Other") as Expense["category"], subCategory: "", paymentMode: (paymentMode || "Other") as Expense["paymentMode"], expenseNature: "Other", notes, isRecurring: false, createdAt: stamp, updatedAt: stamp } satisfies Expense);
      }
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <CrudLayout title="Income management" form={<IncomeForm item={editingIncome} month={month} onCancel={() => setEditingIncome(null)} onSave={(item) => { if (user) void upsert("incomeEntries", { ...item, userId: user.id }); setEditingIncome(null); }} />}>
          {monthIncome.map((item) => <TaskRow key={item.id} title={`${item.sourceName}: ${currency.format(item.amount)}`} meta={`${item.incomeType} - ${item.receivedDate} - ${item.isRecurring ? "Recurring" : "One-time"}`} badges={[item.incomeType]} onEdit={() => setEditingIncome(item)} onDelete={() => confirmDelete(() => remove("incomeEntries", item.id))} />)}
        </CrudLayout>
        <CrudLayout
          title="Daily expenses"
          filters={<><input className={inputClass} placeholder="Search expense" value={query} onChange={(e) => setQuery(e.target.value)} /><select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}><option>All</option>{expenseCategories.map((item) => <option key={item}>{item}</option>)}</select><select className={inputClass} value={mode} onChange={(e) => setMode(e.target.value)}><option>All</option>{paymentModes.map((item) => <option key={item}>{item}</option>)}</select><Button variant="secondary" onClick={exportExpenses}>Export CSV</Button><Field label="Import expenses CSV"><input className={inputClass} type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && void importExpenses(e.target.files[0])} /></Field></>}
          form={<ExpenseForm item={editingExpense} onCancel={() => setEditingExpense(null)} onSave={(item) => { if (user) void upsert("expenses", { ...item, userId: user.id }); setEditingExpense(null); }} />}
        >
          <div className="grid grid-cols-3 gap-2 text-sm">
            <MiniMoney label="Today" value={expenses.filter((item) => item.expenseDate === toDateInput(new Date())).reduce((t, i) => t + i.amount, 0)} />
            <MiniMoney label="Month" value={expenses.reduce((t, i) => t + i.amount, 0)} />
            <MiniMoney label="Categories" value={categoryTotals(expenses).length} />
          </div>
          {expenses.length ? expenses.map((expense) => <TaskRow key={expense.id} title={`${expense.title}: ${currency.format(expense.amount)}`} meta={`${expense.expenseDate} ${expense.expenseTime} - ${expense.category} - ${expense.paymentMode}`} badges={[expense.expenseNature, expense.isRecurring ? "Recurring" : "One-time"]} onEdit={() => setEditingExpense(expense)} onDelete={() => confirmDelete(() => remove("expenses", expense.id))} />) : <EmptyState title="No expenses found" text="Add an expense or import CSV rows." />}
        </CrudLayout>
      </div>
    </div>
  );
}

function BudgetPage({ month }: { month: string }) {
  const { data, user, upsert, remove } = useStore();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [catBudget, setCatBudget] = useState<CategoryBudget | null>(null);
  const statuses = budgetStatuses(data, month);
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <CrudLayout title="Monthly budget" form={<BudgetForm item={budget} month={month} onCancel={() => setBudget(null)} onSave={(item) => { if (user) void upsert("budgets", { ...item, userId: user.id }); setBudget(null); }} />}>
        {data.budgets.filter((item) => item.month === month).map((item) => <TaskRow key={item.id} title={`${item.month}: ${currency.format(item.totalBudget)}`} meta={`Savings target ${currency.format(item.savingsTarget)} - Investment target ${currency.format(item.investmentTarget)}`} badges={["Budget"]} onEdit={() => setBudget(item)} onDelete={() => confirmDelete(() => remove("budgets", item.id))} />)}
      </CrudLayout>
      <CrudLayout title="Category budgets" form={<CategoryBudgetForm item={catBudget} budgets={data.budgets.filter((item) => item.month === month)} onCancel={() => setCatBudget(null)} onSave={(item) => { if (user) void upsert("categoryBudgets", { ...item, userId: user.id }); setCatBudget(null); }} />}>
        {statuses.length ? statuses.map((item) => <div key={item.id} className="rounded-lg border border-line p-3"><div className="flex justify-between gap-2"><p className="font-semibold">{item.category}</p><Badge tone={item.status === "Safe" ? "green" : item.status === "Warning" ? "amber" : "red"}>{item.status}</Badge></div><p className="mt-1 text-sm text-slate-500">{currency.format(item.actual)} of {currency.format(item.budgetAmount)} used</p><div className="mt-2"><ProgressBar value={item.usage} /></div><div className="mt-3"><RowActions onEdit={() => setCatBudget(item)} onDelete={() => confirmDelete(() => remove("categoryBudgets", item.id))} /></div></div>) : <EmptyState title="No category budgets" text="Create a monthly budget and category budgets to track usage." />}
      </CrudLayout>
    </div>
  );
}

function EmiPage({ month }: { month: string }) {
  const { data, user, upsert, remove } = useStore();
  const [editing, setEditing] = useState<Emi | null>(null);
  const metrics = financeMetrics(data, month);
  async function markPaid(emi: Emi) {
    if (!user) return;
    const stamp = new Date().toISOString();
    await upsert("emis", { ...emi, status: "Paid", updatedAt: stamp });
    await upsert("emiPayments", { id: newId("emip"), userId: user.id, emiId: emi.id, paymentMonth: month, paymentDate: toDateInput(new Date()), amountPaid: emi.emiAmount, status: "Paid", notes: "Marked paid", createdAt: stamp, updatedAt: stamp });
  }
  return (
    <CrudLayout title="EMI tracker" form={<EmiForm item={editing} onCancel={() => setEditing(null)} onSave={(item) => { if (user) void upsert("emis", { ...item, userId: user.id }); setEditing(null); }} />}>
      <div className="grid gap-2 md:grid-cols-3"><MiniMoney label="Monthly burden" value={metrics.totalEmi} /><Metric title="EMI-to-income" value={`${metrics.emiToIncome}%`} /><Metric title="Payments logged" value={data.emiPayments.filter((p) => p.paymentMonth === month).length} /></div>
      {data.emis.map((emi) => <div key={emi.id} className="rounded-lg border border-line p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{emi.emiName}: {currency.format(emi.emiAmount)}</p><p className="text-sm text-slate-500">{emi.emiType} - due day {emi.dueDay} - {emi.lenderName}</p><div className="mt-2 flex gap-2"><Badge tone={badgeTone(emi.status)}>{emi.status}</Badge>{emi.status !== "Closed" && <Badge tone="amber">Reminder {emi.reminderDaysBefore} days</Badge>}</div></div><div className="flex gap-2"><Button variant="secondary" onClick={() => markPaid(emi)}>Mark paid</Button><RowActions onEdit={() => setEditing(emi)} onDelete={() => confirmDelete(() => remove("emis", emi.id))} /></div></div></div>)}
    </CrudLayout>
  );
}

function UpcomingPaymentsPage({ month }: { month: string }) {
  const { data, user, upsert, remove } = useStore();
  const [editing, setEditing] = useState<UpcomingPayment | null>(null);
  const payments = data.upcomingPayments.filter((item) => inMonth(item.dueDate, month));
  return (
    <CrudLayout title="Upcoming payments" form={<UpcomingPaymentForm item={editing} onCancel={() => setEditing(null)} onSave={(item) => { if (user) void upsert("upcomingPayments", { ...item, userId: user.id }); setEditing(null); }} />}>
      <div className="grid gap-2 md:grid-cols-3"><Metric title="Due this week" value={payments.filter((p) => dueThisWeek(p.dueDate)).length} /><Metric title="Due this month" value={payments.length} /><Metric title="Overdue" value={payments.filter((p) => p.status === "Missed").length} /></div>
      {payments.map((payment) => <TaskRow key={payment.id} title={`${payment.title}: ${currency.format(payment.amount)}`} meta={`${payment.paymentType} - due ${payment.dueDate} - reminder ${payment.reminderDate}`} badges={[payment.status, payment.isRecurring ? "Recurring" : "One-time"]} onEdit={() => setEditing(payment)} onDelete={() => confirmDelete(() => remove("upcomingPayments", payment.id))} />)}
    </CrudLayout>
  );
}

function InvestmentsPage({ month: _month }: { month: string }) {
  const { data, user, upsert, remove } = useStore();
  const [editing, setEditing] = useState<Investment | null>(null);
  const [message, setMessage] = useState("");
  const portfolio = portfolioMetrics(data.investments);

  async function saveInvestmentSnapshot(investment: Investment, updateType: InvestmentValueHistory["updateType"]) {
    if (!user) return;
    const stamp = new Date().toISOString();
    await upsert("investments", { ...investment, userId: user.id, updatedAt: stamp });
    await upsert("investmentValueHistory", { id: newId("ivh"), userId: user.id, investmentId: investment.id, valueDate: toDateInput(new Date()), currentPrice: investment.currentPrice, currentValue: investment.currentValue, amountInvested: investment.amountInvested, gainLoss: investment.gainLoss, returnPercentage: investment.returnPercentage, priceSource: investment.priceSource, updateType, createdAt: stamp });
  }

  async function refreshInvestment(investment: Investment) {
    if (!investment.isPriceTrackingEnabled) {
      await saveInvestmentSnapshot(calculateInvestment({ ...investment, currentValue: investment.manualCurrentValue, priceUpdateStatus: "Manual Update Required", priceSource: "Manual", lastPriceUpdatedAt: new Date().toISOString() }), "manual");
      return { ok: true };
    }
    const response = await fetch("/api/market-price", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(investment) });
    const result = await response.json();
    if (!result.ok || !result.price) {
      await upsert("investments", { ...investment, priceUpdateStatus: result.status || "Update Failed", priceSource: result.source || "Unavailable", updatedAt: new Date().toISOString() });
      return { ok: false };
    }
    await saveInvestmentSnapshot(calculateInvestment({ ...investment, currentPrice: Number(result.price), currentValue: investment.units * Number(result.price), priceSource: result.source, priceUpdateStatus: "Updated", lastPriceUpdatedAt: new Date().toISOString() }), "automatic");
    return { ok: true };
  }

  async function refreshAll() {
    let success = 0;
    let failed = 0;
    for (const investment of data.investments) {
      const result = await refreshInvestment(investment);
      if (result.ok) success += 1;
      else failed += 1;
    }
    setMessage(`Portfolio refresh complete: ${success} updated, ${failed} failed/manual.`);
  }

  return (
    <CrudLayout title="Investments" form={<InvestmentForm item={editing} goals={data.financialGoals} onCancel={() => setEditing(null)} onSave={(item) => { void saveInvestmentSnapshot(calculateInvestment(item), item.priceUpdateStatus === "Updated" ? "automatic" : "manual"); setEditing(null); }} />}>
      <div className="grid gap-2 md:grid-cols-4"><MiniMoney label="Invested" value={portfolio.totalInvested} /><MiniMoney label="Portfolio value" value={portfolio.currentValue} /><MiniMoney label="Gain/loss" value={portfolio.gainLoss} /><Metric title="Return" value={`${portfolio.returnPercentage}%`} /></div>
      <div className="flex flex-wrap gap-2"><Button onClick={refreshAll}>Refresh portfolio</Button><Button variant="secondary" onClick={() => downloadCsv("investments.csv", ["name,type,invested,current_value,gain_loss,return_percentage,status", ...data.investments.map((item) => [item.investmentName, item.investmentType, item.amountInvested, item.currentValue, item.gainLoss, item.returnPercentage, item.priceUpdateStatus].join(","))].join("\n"))}>Export CSV</Button>{message && <p className="self-center text-sm text-slate-600">{message}</p>}</div>
      {data.investments.map((investment) => <div key={investment.id} className="rounded-lg border border-line p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{investment.investmentName}</p><p className="text-sm text-slate-500">{investment.investmentType} - {investment.tickerSymbol || "manual"} - units {investment.units}</p><div className="mt-2 grid gap-1 text-sm md:grid-cols-4"><span>Invested {currency.format(investment.amountInvested)}</span><span>Current {currency.format(investment.currentValue)}</span><span className={investment.gainLoss >= 0 ? "text-green-700" : "text-red-700"}>{currency.format(investment.gainLoss)} ({investment.returnPercentage}%)</span><span>Price {currency.format(investment.currentPrice)}</span></div><div className="mt-2 flex flex-wrap gap-2"><Badge tone={investment.priceUpdateStatus === "Updated" ? "green" : investment.priceUpdateStatus === "Update Failed" ? "red" : "amber"}>{investment.priceUpdateStatus}</Badge><Badge tone="slate">{investment.priceSource || "Manual"}</Badge><Badge tone="slate">{investment.lastPriceUpdatedAt ? new Date(investment.lastPriceUpdatedAt).toLocaleString() : "Not updated"}</Badge></div></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => void refreshInvestment(investment)}>Update price</Button><RowActions onEdit={() => setEditing(investment)} onDelete={() => confirmDelete(() => remove("investments", investment.id))} /></div></div></div>)}
    </CrudLayout>
  );
}

function FinancialGoalsPage() {
  const { data, user, upsert, remove } = useStore();
  const [editing, setEditing] = useState<FinancialGoal | null>(null);
  return (
    <CrudLayout title="Financial goals" form={<FinancialGoalForm item={editing} investments={data.investments} onCancel={() => setEditing(null)} onSave={(item) => { if (user) void upsert("financialGoals", { ...item, userId: user.id }); setEditing(null); }} />}>
      {data.financialGoals.map((goal) => { const progress = goalProgress(goal); return <div key={goal.id} className="rounded-lg border border-line p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{goal.goalName}</p><p className="text-sm text-slate-500">Target {currency.format(goal.targetAmount)} by {goal.targetDate} - monthly required {currency.format(progress.monthlyRequired)}</p></div><RowActions onEdit={() => setEditing(goal)} onDelete={() => confirmDelete(() => remove("financialGoals", goal.id))} /></div><div className="mt-3"><ProgressBar value={progress.progress} /></div><p className="mt-2 text-sm text-slate-500">{progress.progress}% complete, {currency.format(progress.remaining)} remaining</p></div>; })}
    </CrudLayout>
  );
}

function FinanceAnalytics({ month, weekStart }: { month: string; weekStart: string }) {
  const { data } = useStore();
  const scoped = financeMonthData(data, month);
  const metrics = financeMetrics(data, month);
  const history = Object.entries(data.investmentValueHistory.reduce<Record<string, number>>((acc, item) => { acc[item.valueDate] = (acc[item.valueDate] || 0) + item.currentValue; return acc; }, {})).map(([date, value]) => ({ date, value }));
  return (
    <AnalyticsGrid>
      <Metric title="Savings rate" value={`${metrics.savingsRate}%`} />
      <Metric title="Remaining balance" value={currency.format(metrics.remainingBalance)} />
      <Metric title="EMI-to-income" value={`${metrics.emiToIncome}%`} />
      <Metric title="Finance score" value={`${metrics.financeScore}/100`} />
      <ChartCard title="Daily expenses"><BarChartBox data={dailyExpenseSeries(data, weekStart)} bars={[["expense", "#DC2626"]]} /></ChartCard>
      <ChartCard title="Category-wise spending"><PieChartBox data={categoryTotals(scoped.expenses)} /></ChartCard>
      <ChartCard title="Need vs Want vs EMI vs Investment"><BarChartBox data={natureTotals(scoped.expenses).map((item) => ({ day: item.name, expense: item.value }))} bars={[["expense", "#D97706"]]} /></ChartCard>
      <ChartCard title="Payment mode split"><PieChartBox data={paymentModeTotals(scoped.expenses)} /></ChartCard>
      <ChartCard title="Monthly spending trend"><LineChartBox data={monthlyTrend(data)} xKey="month" lineKey="expense" /></ChartCard>
      <ChartCard title="Investment allocation"><PieChartBox data={investmentAllocation(data.investments)} /></ChartCard>
      <ChartCard title="Portfolio value over time"><LineChartBox data={history} xKey="date" lineKey="value" /></ChartCard>
      <Card className="md:col-span-2"><h2 className="font-semibold">Goals</h2><div className="mt-4 grid gap-3">{data.financialGoals.map((goal) => { const progress = goalProgress(goal); return <div key={goal.id}><div className="mb-1 flex justify-between text-sm"><span>{goal.goalName}</span><span>{progress.progress}%</span></div><ProgressBar value={progress.progress} /></div>; })}</div></Card>
    </AnalyticsGrid>
  );
}

function MonthlyFinanceReviewPage({ month }: { month: string }) {
  const { data, user, upsert } = useStore();
  const existing = data.monthlyFinanceReviews.find((item) => item.month === month);
  const [review, setReview] = useState<MonthlyFinanceReview>(existing || { id: newId("mfr"), userId: user?.id || "", month, wentWell: "", overspentAreas: "", avoidableExpenses: "", emisPaidSummary: "", investmentsMadeSummary: "", savingsSummary: "", nextMonthPlan: "", notes: "", autoSummaryJson: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const summary = monthlyFinanceSummary(data, month);
  function setField(field: keyof MonthlyFinanceReview, value: string) {
    setReview((current) => ({ ...current, [field]: value, updatedAt: new Date().toISOString() }));
  }
  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <Card><h2 className="font-semibold">Auto monthly summary</h2><div className="mt-4 grid gap-2 text-sm">{Object.entries(summary).map(([key, value]) => <div key={key} className="rounded-md bg-soft p-2"><span className="font-medium">{labelize(key)}: </span>{Array.isArray(value) ? value.join(", ") || "None" : typeof value === "number" ? currency.format(value) : String(value)}</div>)}</div><Button className="mt-4 w-full" onClick={() => setReview((current) => ({ ...current, autoSummaryJson: summary }))}>Attach summary</Button></Card>
      <Card><h2 className="font-semibold">Monthly finance review</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{(["wentWell", "overspentAreas", "avoidableExpenses", "emisPaidSummary", "investmentsMadeSummary", "savingsSummary", "nextMonthPlan", "notes"] as const).map((field) => <Field key={field} label={labelize(field)}><textarea className={inputClass} rows={4} value={String(review[field])} onChange={(e) => setField(field, e.target.value)} /></Field>)}</div><Button className="mt-4" onClick={() => user && upsert("monthlyFinanceReviews", { ...review, userId: user.id, month, autoSummaryJson: Object.keys(review.autoSummaryJson).length ? review.autoSummaryJson : summary })}><Save size={16} /> Save review</Button></Card>
    </div>
  );
}

function SettingsPage() {
  const { mode, user, resetDemo, data, upsert, remove } = useStore();
  const stamp = new Date().toISOString();
  const [settings, setSettings] = useState<FinanceSettings>(data.financeSettings[0] || { id: newId("finset"), userId: user?.id || "", defaultCurrency: "INR", defaultMonthlyIncome: 0, monthStartDate: 1, budgetAlertThreshold: 80, emiReminderDays: 3, investmentUpdateReminderFrequency: "Weekly", createdAt: stamp, updatedAt: stamp });

  async function deleteFinanceData() {
    if (!window.confirm("Delete all finance data? This keeps your work/task/skill data.")) return;
    const collections: (keyof typeof data)[] = ["incomeEntries", "expenses", "budgets", "categoryBudgets", "emis", "emiPayments", "upcomingPayments", "investments", "investmentValueHistory", "financialGoals", "monthlyFinanceReviews"];
    for (const collection of collections) {
      for (const item of data[collection] as { id: string }[]) {
        await remove(collection, item.id);
      }
    }
  }

  function exportFinanceSummary() {
    const month = monthKey();
    const summary = monthlyFinanceSummary(data, month);
    downloadCsv("monthly-finance-summary.csv", Object.entries(summary).map(([key, value]) => `${key},${Array.isArray(value) ? value.join("|") : value}`).join("\n"));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <h2 className="font-semibold">Workspace</h2>
        <div className="mt-4 grid gap-2 text-sm">
          <p><span className="font-medium">User:</span> {user?.email}</p>
          <p><span className="font-medium">Storage mode:</span> {mode}</p>
          <p><span className="font-medium">Records:</span> {data.workTasks.length} work tasks, {data.skills.length} skills, {data.learningTasks.length} learning tasks, {data.timeLogs.length} logs</p>
        </div>
        <Button className="mt-4" variant="secondary" onClick={resetDemo}>Reload sample data</Button>
      </Card>
      <Card>
        <h2 className="font-semibold">Supabase setup</h2>
        <p className="mt-3 text-sm text-slate-600">Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, run the SQL in supabase/schema.sql, then restart the app. Until then, local mode keeps the app fully usable on this browser.</p>
      </Card>
      <Card>
        <h2 className="font-semibold">Finance settings</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Default currency"><input className={inputClass} value={settings.defaultCurrency} disabled /></Field>
          <NumberField label="Default monthly income" value={settings.defaultMonthlyIncome} onChange={(v) => setSettings({ ...settings, defaultMonthlyIncome: v })} />
          <NumberField label="Month start date" value={settings.monthStartDate} onChange={(v) => setSettings({ ...settings, monthStartDate: v })} />
          <NumberField label="Budget alert threshold" value={settings.budgetAlertThreshold} onChange={(v) => setSettings({ ...settings, budgetAlertThreshold: v })} />
          <NumberField label="EMI reminder days" value={settings.emiReminderDays} onChange={(v) => setSettings({ ...settings, emiReminderDays: v })} />
          <SelectField label="Investment update reminder" value={settings.investmentUpdateReminderFrequency} options={["Daily", "Weekly", "Monthly"]} onChange={(v) => setSettings({ ...settings, investmentUpdateReminderFrequency: v as FinanceSettings["investmentUpdateReminderFrequency"] })} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => user && upsert("financeSettings", { ...settings, userId: user.id, updatedAt: new Date().toISOString() })}>Save finance settings</Button>
          <Button variant="secondary" onClick={() => downloadCsv("expenses.csv", ["date,title,amount,category,payment_mode,notes", ...data.expenses.map((item) => [item.expenseDate, item.title, item.amount, item.category, item.paymentMode, item.notes].join(","))].join("\n"))}>Export expenses</Button>
          <Button variant="secondary" onClick={() => downloadCsv("emi-list.csv", ["name,amount,due_day,status", ...data.emis.map((item) => [item.emiName, item.emiAmount, item.dueDay, item.status].join(","))].join("\n"))}>Export EMI list</Button>
          <Button variant="secondary" onClick={exportFinanceSummary}>Export summary</Button>
          <Button variant="danger" onClick={deleteFinanceData}>Delete finance data</Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Security note: this app stores manual finance tracking data only. Do not store bank credentials, card numbers, UPI PINs, OTPs, or broker passwords.</p>
      </Card>
    </div>
  );
}

function CrudLayout({ title, filters, form, children }: { title: string; filters?: React.ReactNode; form: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="h-fit xl:sticky xl:top-[90px]">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">Add a new record or select an existing item to edit.</p>
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
    <TextField label="Task given date" type="date" value={task.receivedDate} onChange={(v) => setTask({ ...task, receivedDate: v })} />
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
  const [skill, setSkill] = useState<Skill>(item || { id: newId("sk"), userId: "", skillName: "", category: "Coding", currentLevel: "Beginner", targetLevel: "Advanced", reason: "", weeklyTargetMinutes: 180, deadline: toDateInput(addMinutes(new Date(), 60 * 24 * 30)), progressPercentage: 0, confidenceScore: 3, notes: "", createdAt: stamp, updatedAt: stamp });
  return <FormGrid onSubmit={() => skill.skillName.trim() && onSave({ ...skill, updatedAt: new Date().toISOString() })} onCancel={onCancel}>
    <TextField label="Skill name" value={skill.skillName} onChange={(v) => setSkill({ ...skill, skillName: v })} required />
    <SelectField label="Category" value={skill.category} options={["Technical", "AI", "Coding", "Analytics", "Cloud", "Communication", "Business", "Other"]} onChange={(v) => setSkill({ ...skill, category: v as Skill["category"] })} />
    <SelectField label="Current level" value={skill.currentLevel} options={["Beginner", "Intermediate", "Advanced"]} onChange={(v) => setSkill({ ...skill, currentLevel: v as Skill["currentLevel"] })} />
    <SelectField label="Target level" value={skill.targetLevel} options={["Beginner", "Intermediate", "Advanced"]} onChange={(v) => setSkill({ ...skill, targetLevel: v as Skill["targetLevel"] })} />
    <NumberField label="Weekly target minutes" value={skill.weeklyTargetMinutes} onChange={(v) => setSkill({ ...skill, weeklyTargetMinutes: v })} />
    <TextField label="Deadline" type="date" value={skill.deadline} onChange={(v) => setSkill({ ...skill, deadline: v })} />
    <NumberField label="Progress percentage" value={skill.progressPercentage} onChange={(v) => setSkill({ ...skill, progressPercentage: Math.min(100, v) })} />
    <NumberField label="Confidence score 1-5" value={skill.confidenceScore} onChange={(v) => setSkill({ ...skill, confidenceScore: Math.min(5, Math.max(1, v)) })} />
    <TextField label="Reason for learning" value={skill.reason} onChange={(v) => setSkill({ ...skill, reason: v })} textarea />
    <TextField label="Notes" value={skill.notes} onChange={(v) => setSkill({ ...skill, notes: v })} textarea />
  </FormGrid>;
}

function LearningTaskForm({ item, skills, onSave, onCancel }: { item: LearningTask | null; skills: Skill[]; onSave: (item: LearningTask) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [task, setTask] = useState<LearningTask>(item || { id: newId("lt"), userId: "", skillId: skills[0]?.id || "", title: "", description: "", resourceLink: "", learningType: "Practice", plannedDate: toDateInput(new Date()), plannedMinutes: 60, actualMinutes: 0, status: "Planned", difficulty: "Medium", understandingScore: 3, outputCreated: "", notes: "", createdAt: stamp, updatedAt: stamp });
  return <FormGrid onSubmit={() => task.title.trim() && onSave({ ...task, updatedAt: new Date().toISOString() })} onCancel={onCancel}>
    <SelectField label="Linked skill" value={task.skillId} options={skills.map((skill) => skill.id)} labels={Object.fromEntries(skills.map((skill) => [skill.id, skill.skillName]))} onChange={(v) => setTask({ ...task, skillId: v })} />
    <TextField label="Learning task title" value={task.title} onChange={(v) => setTask({ ...task, title: v })} required />
    <SelectField label="Type" value={task.learningType} options={["Video", "Course", "Article", "Practice", "Project", "Documentation", "Revision"]} onChange={(v) => setTask({ ...task, learningType: v as LearningTask["learningType"] })} />
    <TextField label="Planned date" type="date" value={task.plannedDate} onChange={(v) => setTask({ ...task, plannedDate: v })} />
    <NumberField label="Planned minutes" value={task.plannedMinutes} onChange={(v) => setTask({ ...task, plannedMinutes: v })} />
    <NumberField label="Actual minutes" value={task.actualMinutes} onChange={(v) => setTask({ ...task, actualMinutes: v })} />
    <SelectField label="Status" value={task.status} options={["Planned", "In Progress", "Completed"]} onChange={(v) => setTask({ ...task, status: v as LearningTask["status"] })} />
    <SelectField label="Difficulty" value={task.difficulty} options={["Easy", "Medium", "Hard"]} onChange={(v) => setTask({ ...task, difficulty: v as LearningTask["difficulty"] })} />
    <NumberField label="Understanding score 1-5" value={task.understandingScore} onChange={(v) => setTask({ ...task, understandingScore: Math.min(5, Math.max(1, v)) })} />
    <TextField label="Resource link" value={task.resourceLink} onChange={(v) => setTask({ ...task, resourceLink: v })} />
    <TextField label="Description" value={task.description} onChange={(v) => setTask({ ...task, description: v })} textarea />
    <TextField label="Output created" value={task.outputCreated} onChange={(v) => setTask({ ...task, outputCreated: v })} />
    <TextField label="Notes" value={task.notes} onChange={(v) => setTask({ ...task, notes: v })} textarea />
  </FormGrid>;
}

function TimeLogForm({ item, workTasks, learningTasks, onSave, onCancel }: { item: TimeLog | null; workTasks: WorkTask[]; learningTasks: LearningTask[]; onSave: (item: TimeLog) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [log, setLog] = useState<TimeLog>(item || { id: newId("tl"), userId: "", linkedType: "none", linkedId: "", logType: "Work", date: toDateInput(new Date()), startTime: "09:00", endTime: "10:00", durationMinutes: 60, notes: "", createdAt: stamp });
  const linkedOptions = log.linkedType === "work" ? workTasks.map((task) => [task.id, task.title]) : log.linkedType === "learning" ? learningTasks.map((task) => [task.id, task.title]) : [];
  return <FormGrid onSubmit={() => onSave(log)} onCancel={onCancel}>
    <SelectField label="Type" value={log.logType} options={["Work", "Learning", "Personal"]} onChange={(v) => setLog({ ...log, logType: v as TimeLog["logType"] })} />
    <SelectField label="Linked type" value={log.linkedType} options={["none", "work", "learning"]} onChange={(v) => setLog({ ...log, linkedType: v as TimeLog["linkedType"], linkedId: "" })} />
    {linkedOptions.length > 0 && <SelectField label="Linked task" value={log.linkedId} options={linkedOptions.map(([id]) => id)} labels={Object.fromEntries(linkedOptions)} onChange={(v) => setLog({ ...log, linkedId: v })} />}
    <TextField label="Date" type="date" value={log.date} onChange={(v) => setLog({ ...log, date: v })} />
    <TextField label="Start time" type="time" value={log.startTime} onChange={(v) => setLog({ ...log, startTime: v })} />
    <TextField label="End time" type="time" value={log.endTime} onChange={(v) => setLog({ ...log, endTime: v })} />
    <NumberField label="Duration minutes" value={log.durationMinutes} onChange={(v) => setLog({ ...log, durationMinutes: v })} />
    <TextField label="Notes" value={log.notes} onChange={(v) => setLog({ ...log, notes: v })} textarea />
  </FormGrid>;
}

function IncomeForm({ item, month, onSave, onCancel }: { item: IncomeEntry | null; month: string; onSave: (item: IncomeEntry) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [income, setIncome] = useState<IncomeEntry>(item || { id: newId("inc"), userId: "", sourceName: "", incomeType: "Salary", amount: 0, receivedDate: toDateInput(new Date()), month, isRecurring: true, notes: "", createdAt: stamp, updatedAt: stamp });
  return <FormGrid onSubmit={() => income.sourceName.trim() && onSave({ ...income, month: income.receivedDate.slice(0, 7), updatedAt: new Date().toISOString() })} onCancel={onCancel}>
    <TextField label="Income source" value={income.sourceName} onChange={(v) => setIncome({ ...income, sourceName: v })} required />
    <SelectField label="Income type" value={income.incomeType} options={["Salary", "Freelance", "Bonus", "Other"]} onChange={(v) => setIncome({ ...income, incomeType: v as IncomeEntry["incomeType"] })} />
    <NumberField label="Amount" value={income.amount} onChange={(v) => setIncome({ ...income, amount: v })} />
    <TextField label="Date received" type="date" value={income.receivedDate} onChange={(v) => setIncome({ ...income, receivedDate: v })} />
    <CheckboxField label="Recurring income" checked={income.isRecurring} onChange={(v) => setIncome({ ...income, isRecurring: v })} />
    <TextField label="Notes" value={income.notes} onChange={(v) => setIncome({ ...income, notes: v })} textarea />
  </FormGrid>;
}

function ExpenseForm({ item, onSave, onCancel }: { item: Expense | null; onSave: (item: Expense) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [expense, setExpense] = useState<Expense>(item || { id: newId("exp"), userId: "", title: "", amount: 0, expenseDate: toDateInput(new Date()), expenseTime: "09:00", category: "Food", subCategory: "", paymentMode: "UPI", expenseNature: "Need", notes: "", isRecurring: false, createdAt: stamp, updatedAt: stamp });
  return <FormGrid onSubmit={() => expense.title.trim() && onSave({ ...expense, updatedAt: new Date().toISOString() })} onCancel={onCancel}>
    <TextField label="Expense title" value={expense.title} onChange={(v) => setExpense({ ...expense, title: v })} required />
    <NumberField label="Amount" value={expense.amount} onChange={(v) => setExpense({ ...expense, amount: v })} />
    <TextField label="Date" type="date" value={expense.expenseDate} onChange={(v) => setExpense({ ...expense, expenseDate: v })} />
    <TextField label="Time" type="time" value={expense.expenseTime} onChange={(v) => setExpense({ ...expense, expenseTime: v })} />
    <SelectField label="Category" value={expense.category} options={expenseCategories} onChange={(v) => setExpense({ ...expense, category: v as Expense["category"] })} />
    <TextField label="Sub-category" value={expense.subCategory} onChange={(v) => setExpense({ ...expense, subCategory: v })} />
    <SelectField label="Payment mode" value={expense.paymentMode} options={paymentModes} onChange={(v) => setExpense({ ...expense, paymentMode: v as Expense["paymentMode"] })} />
    <SelectField label="Expense nature" value={expense.expenseNature} options={["Need", "Want", "EMI", "Investment", "Other"]} onChange={(v) => setExpense({ ...expense, expenseNature: v as Expense["expenseNature"] })} />
    <CheckboxField label="Recurring expense" checked={expense.isRecurring} onChange={(v) => setExpense({ ...expense, isRecurring: v })} />
    <TextField label="Notes" value={expense.notes} onChange={(v) => setExpense({ ...expense, notes: v })} textarea />
  </FormGrid>;
}

function BudgetForm({ item, month, onSave, onCancel }: { item: Budget | null; month: string; onSave: (item: Budget) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [budget, setBudget] = useState<Budget>(item || { id: newId("bud"), userId: "", month, totalBudget: 35000, savingsTarget: 20000, investmentTarget: 10000, discretionaryLimit: 9000, createdAt: stamp, updatedAt: stamp });
  return <FormGrid onSubmit={() => onSave({ ...budget, updatedAt: new Date().toISOString() })} onCancel={onCancel}>
    <TextField label="Month" type="month" value={budget.month} onChange={(v) => setBudget({ ...budget, month: v })} />
    <NumberField label="Monthly total budget" value={budget.totalBudget} onChange={(v) => setBudget({ ...budget, totalBudget: v })} />
    <NumberField label="Savings target" value={budget.savingsTarget} onChange={(v) => setBudget({ ...budget, savingsTarget: v })} />
    <NumberField label="Investment target" value={budget.investmentTarget} onChange={(v) => setBudget({ ...budget, investmentTarget: v })} />
    <NumberField label="Discretionary limit" value={budget.discretionaryLimit} onChange={(v) => setBudget({ ...budget, discretionaryLimit: v })} />
  </FormGrid>;
}

function CategoryBudgetForm({ item, budgets, onSave, onCancel }: { item: CategoryBudget | null; budgets: Budget[]; onSave: (item: CategoryBudget) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [budget, setBudget] = useState<CategoryBudget>(item || { id: newId("cb"), userId: "", budgetId: budgets[0]?.id || "", category: "Food", budgetAmount: 0, createdAt: stamp, updatedAt: stamp });
  return <FormGrid onSubmit={() => budget.budgetId && onSave({ ...budget, updatedAt: new Date().toISOString() })} onCancel={onCancel}>
    <SelectField label="Budget month" value={budget.budgetId} options={budgets.map((item) => item.id)} labels={Object.fromEntries(budgets.map((item) => [item.id, item.month]))} onChange={(v) => setBudget({ ...budget, budgetId: v })} />
    <SelectField label="Category" value={budget.category} options={expenseCategories} onChange={(v) => setBudget({ ...budget, category: v as Expense["category"] })} />
    <NumberField label="Budget amount" value={budget.budgetAmount} onChange={(v) => setBudget({ ...budget, budgetAmount: v })} />
  </FormGrid>;
}

function EmiForm({ item, onSave, onCancel }: { item: Emi | null; onSave: (item: Emi) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [emi, setEmi] = useState<Emi>(item || { id: newId("emi"), userId: "", emiName: "", emiType: "Education Loan", emiAmount: 0, dueDay: 5, startDate: toDateInput(new Date()), endDate: toDateInput(new Date()), totalLoanAmount: 0, interestRate: 0, lenderName: "", isRecurring: true, status: "Upcoming", reminderDaysBefore: 3, notes: "", createdAt: stamp, updatedAt: stamp });
  return <FormGrid onSubmit={() => emi.emiName.trim() && onSave({ ...emi, updatedAt: new Date().toISOString() })} onCancel={onCancel}>
    <TextField label="EMI name" value={emi.emiName} onChange={(v) => setEmi({ ...emi, emiName: v })} required />
    <SelectField label="EMI type" value={emi.emiType} options={["Education Loan", "Personal Loan", "Credit Card EMI", "Product EMI", "Other"]} onChange={(v) => setEmi({ ...emi, emiType: v as Emi["emiType"] })} />
    <NumberField label="EMI amount" value={emi.emiAmount} onChange={(v) => setEmi({ ...emi, emiAmount: v })} />
    <NumberField label="Due day" value={emi.dueDay} onChange={(v) => setEmi({ ...emi, dueDay: v })} />
    <TextField label="Start date" type="date" value={emi.startDate} onChange={(v) => setEmi({ ...emi, startDate: v })} />
    <TextField label="End date" type="date" value={emi.endDate} onChange={(v) => setEmi({ ...emi, endDate: v })} />
    <NumberField label="Total loan amount" value={emi.totalLoanAmount} onChange={(v) => setEmi({ ...emi, totalLoanAmount: v })} />
    <NumberField label="Interest rate" value={emi.interestRate} onChange={(v) => setEmi({ ...emi, interestRate: v })} />
    <TextField label="Lender name" value={emi.lenderName} onChange={(v) => setEmi({ ...emi, lenderName: v })} />
    <SelectField label="Status" value={emi.status} options={["Upcoming", "Paid", "Missed", "Closed"]} onChange={(v) => setEmi({ ...emi, status: v as Emi["status"] })} />
    <NumberField label="Reminder days" value={emi.reminderDaysBefore} onChange={(v) => setEmi({ ...emi, reminderDaysBefore: v })} />
    <CheckboxField label="Auto-repeat monthly" checked={emi.isRecurring} onChange={(v) => setEmi({ ...emi, isRecurring: v })} />
    <TextField label="Notes" value={emi.notes} onChange={(v) => setEmi({ ...emi, notes: v })} textarea />
  </FormGrid>;
}

function UpcomingPaymentForm({ item, onSave, onCancel }: { item: UpcomingPayment | null; onSave: (item: UpcomingPayment) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [payment, setPayment] = useState<UpcomingPayment>(item || { id: newId("pay"), userId: "", title: "", amount: 0, dueDate: toDateInput(new Date()), category: "Other", paymentType: "Other Planned Payment", isRecurring: false, reminderDate: toDateInput(new Date()), status: "Upcoming", notes: "", createdAt: stamp, updatedAt: stamp });
  return <FormGrid onSubmit={() => payment.title.trim() && onSave({ ...payment, updatedAt: new Date().toISOString() })} onCancel={onCancel}>
    <TextField label="Payment title" value={payment.title} onChange={(v) => setPayment({ ...payment, title: v })} required />
    <NumberField label="Amount" value={payment.amount} onChange={(v) => setPayment({ ...payment, amount: v })} />
    <TextField label="Due date" type="date" value={payment.dueDate} onChange={(v) => setPayment({ ...payment, dueDate: v })} />
    <TextField label="Category" value={payment.category} onChange={(v) => setPayment({ ...payment, category: v })} />
    <SelectField label="Payment type" value={payment.paymentType} options={["EMI", "Credit Card Bill", "Subscription", "Insurance", "Rent", "Education Fee", "Other Planned Payment"]} onChange={(v) => setPayment({ ...payment, paymentType: v as UpcomingPayment["paymentType"] })} />
    <TextField label="Reminder date" type="date" value={payment.reminderDate} onChange={(v) => setPayment({ ...payment, reminderDate: v })} />
    <SelectField label="Status" value={payment.status} options={["Upcoming", "Paid", "Missed"]} onChange={(v) => setPayment({ ...payment, status: v as UpcomingPayment["status"] })} />
    <CheckboxField label="Recurring" checked={payment.isRecurring} onChange={(v) => setPayment({ ...payment, isRecurring: v })} />
    <TextField label="Notes" value={payment.notes} onChange={(v) => setPayment({ ...payment, notes: v })} textarea />
  </FormGrid>;
}

function InvestmentForm({ item, goals, onSave, onCancel }: { item: Investment | null; goals: FinancialGoal[]; onSave: (item: Investment) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [investment, setInvestment] = useState<Investment>(item || { id: newId("inv"), userId: "", investmentName: "", investmentType: "Mutual Fund", platform: "", amountInvested: 0, currentValue: 0, investmentDate: toDateInput(new Date()), tickerSymbol: "", isin: "", marketExchange: "NSE", units: 0, averageBuyPrice: 0, currentPrice: 0, linkedGoalId: "", riskLevel: "Medium", notes: "", gainLoss: 0, returnPercentage: 0, priceSource: "Manual", priceUpdateStatus: "Manual Update Required", lastPriceUpdatedAt: "", isPriceTrackingEnabled: false, manualCurrentValue: 0, createdAt: stamp, updatedAt: stamp });
  return <FormGrid onSubmit={() => investment.investmentName.trim() && onSave(calculateInvestment({ ...investment, updatedAt: new Date().toISOString() }))} onCancel={onCancel}>
    <TextField label="Investment name" value={investment.investmentName} onChange={(v) => setInvestment({ ...investment, investmentName: v })} required />
    <SelectField label="Type" value={investment.investmentType} options={["Mutual Fund", "Stocks", "ETF", "Gold", "Gold ETF", "Digital Gold", "Fixed Deposit", "Recurring Deposit", "PPF", "NPS", "Crypto", "Other"]} onChange={(v) => setInvestment({ ...investment, investmentType: v as Investment["investmentType"] })} />
    <TextField label="Platform / broker" value={investment.platform} onChange={(v) => setInvestment({ ...investment, platform: v })} />
    <NumberField label="Amount invested" value={investment.amountInvested} onChange={(v) => setInvestment({ ...investment, amountInvested: v })} />
    <NumberField label="Units / quantity" value={investment.units} onChange={(v) => setInvestment({ ...investment, units: v })} />
    <NumberField label="Average buy price" value={investment.averageBuyPrice} onChange={(v) => setInvestment({ ...investment, averageBuyPrice: v })} />
    <NumberField label="Current price" value={investment.currentPrice} onChange={(v) => setInvestment({ ...investment, currentPrice: v })} />
    <NumberField label="Manual current value" value={investment.manualCurrentValue} onChange={(v) => setInvestment({ ...investment, manualCurrentValue: v, currentValue: v })} />
    <TextField label="Investment date" type="date" value={investment.investmentDate} onChange={(v) => setInvestment({ ...investment, investmentDate: v })} />
    <TextField label="Ticker / fund code / asset code" value={investment.tickerSymbol} onChange={(v) => setInvestment({ ...investment, tickerSymbol: v })} />
    <TextField label="Exchange / market" value={investment.marketExchange} onChange={(v) => setInvestment({ ...investment, marketExchange: v })} />
    <TextField label="ISIN optional" value={investment.isin} onChange={(v) => setInvestment({ ...investment, isin: v })} />
    <SelectField label="Risk level" value={investment.riskLevel} options={["Low", "Medium", "High"]} onChange={(v) => setInvestment({ ...investment, riskLevel: v as Investment["riskLevel"] })} />
    <SelectField label="Linked goal" value={investment.linkedGoalId} options={["", ...goals.map((goal) => goal.id)]} labels={Object.fromEntries([["", "None"], ...goals.map((goal) => [goal.id, goal.goalName])])} onChange={(v) => setInvestment({ ...investment, linkedGoalId: v })} />
    <CheckboxField label="Enable automatic price tracking" checked={investment.isPriceTrackingEnabled} onChange={(v) => setInvestment({ ...investment, isPriceTrackingEnabled: v })} />
    <TextField label="Notes" value={investment.notes} onChange={(v) => setInvestment({ ...investment, notes: v })} textarea />
  </FormGrid>;
}

function FinancialGoalForm({ item, investments, onSave, onCancel }: { item: FinancialGoal | null; investments: Investment[]; onSave: (item: FinancialGoal) => void; onCancel: () => void }) {
  const stamp = new Date().toISOString();
  const [goal, setGoal] = useState<FinancialGoal>(item || { id: newId("goal"), userId: "", goalName: "", targetAmount: 0, currentSavedAmount: 0, targetDate: toDateInput(new Date()), priority: "Medium", linkedInvestmentId: "", notes: "", createdAt: stamp, updatedAt: stamp });
  return <FormGrid onSubmit={() => goal.goalName.trim() && onSave({ ...goal, updatedAt: new Date().toISOString() })} onCancel={onCancel}>
    <TextField label="Goal name" value={goal.goalName} onChange={(v) => setGoal({ ...goal, goalName: v })} required />
    <NumberField label="Target amount" value={goal.targetAmount} onChange={(v) => setGoal({ ...goal, targetAmount: v })} />
    <NumberField label="Current saved amount" value={goal.currentSavedAmount} onChange={(v) => setGoal({ ...goal, currentSavedAmount: v })} />
    <TextField label="Target date" type="date" value={goal.targetDate} onChange={(v) => setGoal({ ...goal, targetDate: v })} />
    <SelectField label="Priority" value={goal.priority} options={["Low", "Medium", "High"]} onChange={(v) => setGoal({ ...goal, priority: v as FinancialGoal["priority"] })} />
    <SelectField label="Linked investment" value={goal.linkedInvestmentId} options={["", ...investments.map((item) => item.id)]} labels={Object.fromEntries([["", "None"], ...investments.map((item) => [item.id, item.investmentName])])} onChange={(v) => setGoal({ ...goal, linkedInvestmentId: v })} />
    <TextField label="Notes" value={goal.notes} onChange={(v) => setGoal({ ...goal, notes: v })} textarea />
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

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
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
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card className="min-h-80 md:col-span-2"><h2 className="font-semibold">{title}</h2><div className="mt-4 h-64">{children}</div></Card>;
}

function BarChartBox({ data, bars }: { data: any[]; bars: [string, string][] }) {
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" /><YAxis /><Tooltip />{bars.map(([key, color]) => <Bar key={key} dataKey={key} fill={color} radius={[4, 4, 0, 0]} />)}</BarChart></ResponsiveContainer>;
}

function PieChartBox({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return <EmptyState title="No chart data" text="Add records to populate this chart." />;
  return <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>{data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>;
}

function LineChartBox({ data, xKey, lineKey }: { data: any[]; xKey: string; lineKey: string }) {
  if (!data.length) return <EmptyState title="No chart data" text="Add records to populate this chart." />;
  return <ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey={xKey} /><YAxis /><Tooltip /><Line type="monotone" dataKey={lineKey} stroke="#2563EB" strokeWidth={2} /></LineChart></ResponsiveContainer>;
}

function SkillProgressChart({ skills }: { skills: Skill[] }) {
  return <ResponsiveContainer width="100%" height="100%"><LineChart data={skills.map((skill) => ({ name: skill.skillName, progress: skill.progressPercentage, confidence: skill.confidenceScore * 20 }))}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="progress" stroke="#2563EB" strokeWidth={2} /><Line type="monotone" dataKey="confidence" stroke="#0F9F6E" strokeWidth={2} /></LineChart></ResponsiveContainer>;
}

function badgeTone(label: string): "slate" | "blue" | "green" | "amber" | "red" {
  if (["Completed", "Low", "Easy", "work"].includes(label)) return "green";
  if (["High", "Blocked", "Hard"].includes(label)) return "red";
  if (["Medium", "In Progress", "learning"].includes(label)) return "amber";
  if (["Planned", "Backlog"].includes(label)) return "blue";
  return "slate";
}

function confirmDelete(action: () => void) {
  if (window.confirm("Delete this record?")) action();
}

function calculateInvestment(investment: Investment): Investment {
  const currentValue = investment.currentValue || investment.manualCurrentValue || investment.units * investment.currentPrice || 0;
  const gainLoss = currentValue - investment.amountInvested;
  return {
    ...investment,
    currentValue,
    manualCurrentValue: investment.manualCurrentValue || currentValue,
    gainLoss,
    returnPercentage: investment.amountInvested ? Math.round((gainLoss / investment.amountInvested) * 10000) / 100 : 0
  };
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
