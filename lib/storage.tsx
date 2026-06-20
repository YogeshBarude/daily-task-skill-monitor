"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { createSampleData, demoUser } from "./sample-data";
import { hasSupabaseConfig, supabase } from "./supabase";
import { AppData, LearningTask, Skill, TimeLog, UpcomingPayment, UserProfile, WeeklyReview, WorkTask } from "./types";

type Collection = keyof AppData;
type Entity = AppData[keyof AppData][number];

type AppStore = {
  user: UserProfile | null;
  session: Session | null;
  data: AppData;
  loading: boolean;
  mode: "local" | "supabase";
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  upsert: <T extends Entity>(collection: Collection, item: T) => Promise<void>;
  remove: (collection: Collection, id: string) => Promise<void>;
  resetDemo: () => void;
};

const StoreContext = createContext<AppStore | null>(null);
const STORAGE_KEY = "daily-task-skill-monitor-data";
const USER_KEY = "daily-task-skill-monitor-user";

const tableMap: Record<Collection, string> = {
  workTasks: "work_tasks",
  skills: "skills",
  learningTasks: "learning_tasks",
  timeLogs: "time_logs",
  weeklyReviews: "weekly_reviews",
  incomeEntries: "income_entries",
  expenses: "expenses",
  budgets: "budgets",
  categoryBudgets: "category_budgets",
  emis: "emis",
  emiPayments: "emi_payments",
  upcomingPayments: "upcoming_payments",
  investments: "investments",
  investmentValueHistory: "investment_value_history",
  financialGoals: "financial_goals",
  monthlyFinanceReviews: "monthly_finance_reviews",
  financeSettings: "finance_settings"
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<AppData>(createSampleData());
  const [loading, setLoading] = useState(true);
  const mode = hasSupabaseConfig ? "supabase" : "local";

  useEffect(() => {
    if (hasSupabaseConfig && supabase) {
      supabase.auth.getSession().then(({ data: result }) => {
        setSession(result.session);
        if (result.session?.user) {
          setUser({
            id: result.session.user.id,
            email: result.session.user.email || "",
            name: (result.session.user.user_metadata?.name as string) || "Personal workspace"
          });
        }
        setLoading(false);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        if (nextSession?.user) {
          setUser({
            id: nextSession.user.id,
            email: nextSession.user.email || "",
            name: (nextSession.user.user_metadata?.name as string) || "Personal workspace"
          });
        } else {
          setUser(null);
        }
      });
      return () => listener.subscription.unsubscribe();
    }

    const savedData = localStorage.getItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setData(savedData ? normalizeAppData(JSON.parse(savedData)) : createSampleData(demoUser.id));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && mode === "local") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }, [data, loading, mode, user]);

  useEffect(() => {
    if (mode === "supabase" && user) {
      void loadSupabaseData(user.id);
    }
  }, [mode, user]);

  const loadSupabaseData = async (userId: string) => {
    if (!supabase) return;
    setLoading(true);
    const [workTasks, skills, learningTasks, timeLogs, weeklyReviews, incomeEntries, expenses, budgets, categoryBudgets, emis, emiPayments, upcomingPayments, investments, investmentValueHistory, financialGoals, monthlyFinanceReviews, financeSettings] = await Promise.all([
      supabase.from("work_tasks").select("*").eq("user_id", userId),
      supabase.from("skills").select("*").eq("user_id", userId),
      supabase.from("learning_tasks").select("*").eq("user_id", userId),
      supabase.from("time_logs").select("*").eq("user_id", userId),
      supabase.from("weekly_reviews").select("*").eq("user_id", userId),
      supabase.from("income_entries").select("*").eq("user_id", userId),
      supabase.from("expenses").select("*").eq("user_id", userId),
      supabase.from("budgets").select("*").eq("user_id", userId),
      supabase.from("category_budgets").select("*").eq("user_id", userId),
      supabase.from("emis").select("*").eq("user_id", userId),
      supabase.from("emi_payments").select("*").eq("user_id", userId),
      supabase.from("upcoming_payments").select("*").eq("user_id", userId),
      supabase.from("investments").select("*").eq("user_id", userId),
      supabase.from("investment_value_history").select("*").eq("user_id", userId),
      supabase.from("financial_goals").select("*").eq("user_id", userId),
      supabase.from("monthly_finance_reviews").select("*").eq("user_id", userId),
      supabase.from("finance_settings").select("*").eq("user_id", userId)
    ]);
    setData({
      workTasks: (workTasks.data || []).map(fromWorkTask),
      skills: (skills.data || []).map(fromSkill),
      learningTasks: (learningTasks.data || []).map(fromLearningTask),
      timeLogs: (timeLogs.data || []).map(fromTimeLog),
      weeklyReviews: (weeklyReviews.data || []).map(fromWeeklyReview),
      incomeEntries: (incomeEntries.data || []).map(fromFinanceRow),
      expenses: (expenses.data || []).map(fromFinanceRow),
      budgets: (budgets.data || []).map(fromFinanceRow),
      categoryBudgets: (categoryBudgets.data || []).map(fromFinanceRow),
      emis: (emis.data || []).map(fromFinanceRow),
      emiPayments: (emiPayments.data || []).map(fromFinanceRow),
      upcomingPayments: (upcomingPayments.data || []).map(fromFinanceRow).map(normalizeUpcomingPayment),
      investments: (investments.data || []).map(fromFinanceRow),
      investmentValueHistory: (investmentValueHistory.data || []).map(fromFinanceRow),
      financialGoals: (financialGoals.data || []).map(fromFinanceRow),
      monthlyFinanceReviews: (monthlyFinanceReviews.data || []).map(fromFinanceRow),
      financeSettings: (financeSettings.data || []).map(fromFinanceRow)
    });
    setLoading(false);
  };

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    if (hasSupabaseConfig && supabase) {
      const { data: authData, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw error;
      if (authData.user) {
        await supabase.from("users").upsert({ id: authData.user.id, email, name });
      }
      return;
    }
    throw new Error("Secure cloud authentication is not configured yet.");
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return;
    }
    throw new Error("Secure cloud authentication is not configured yet.");
  }, []);

  const signOut = useCallback(async () => {
    if (hasSupabaseConfig && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    if (mode === "local") localStorage.removeItem(USER_KEY);
  }, [mode]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!hasSupabaseConfig || !supabase || !user?.email) {
      throw new Error("Secure cloud authentication is not available.");
    }
    const { error: verificationError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });
    if (verificationError) throw new Error("Current password is incorrect.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, [user]);

  const upsert = useCallback(async <T extends Entity>(collection: Collection, item: T) => {
    setData((current) => ({
      ...current,
      [collection]: upsertLocal(current[collection] as Entity[], item)
    }));
    if (hasSupabaseConfig && supabase) {
      const payload = toDb(collection, item);
      const { error } = await supabase.from(tableMap[collection] as any).upsert(payload as any);
      if (error) throw error;
    }
  }, []);

  const remove = useCallback(async (collection: Collection, id: string) => {
    setData((current) => ({
      ...current,
      [collection]: (current[collection] as Entity[]).filter((item) => item.id !== id)
    }));
    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from(tableMap[collection] as any).delete().eq("id", id);
      if (error) throw error;
    }
  }, []);

  const resetDemo = useCallback(() => {
    const next = createSampleData(user?.id || demoUser.id);
    setData(next);
  }, [user?.id]);

  const value = useMemo<AppStore>(() => ({ user, session, data, loading, mode, signUp, signIn, changePassword, signOut, upsert, remove, resetDemo }), [user, session, data, loading, mode, signUp, signIn, changePassword, signOut, upsert, remove, resetDemo]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function upsertLocal(items: Entity[], item: Entity) {
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index === -1) return [item, ...items];
  return items.map((existing) => (existing.id === item.id ? item : existing));
}

function normalizeAppData(data: AppData): AppData {
  const today = new Date().toISOString().slice(0, 10);
  return {
    ...createSampleData(demoUser.id),
    ...data,
    workTasks: (data.workTasks || []).map((task) => ({
      ...task,
      productOwner: task.productOwner || task.poc || "Personal",
      receivedDate: task.receivedDate || task.assignedDate || today,
      dueDate: task.dueDate || task.assignedDate || today,
      completionPercentage: task.completionPercentage ?? (task.status === "Completed" ? 100 : 0)
    })),
    upcomingPayments: (data.upcomingPayments || []).map(normalizeUpcomingPayment)
  };
}

function normalizeUpcomingPayment(payment: UpcomingPayment): UpcomingPayment {
  const dueDay = payment.dueDay || Number(payment.dueDate?.slice(-2)) || 1;
  const reminderDaysBefore = payment.reminderDaysBefore ?? 3;
  const due = payment.dueDate ? new Date(`${payment.dueDate}T00:00:00`) : new Date();
  return {
    ...payment,
    billingDay: payment.billingDay || 0,
    dueDay,
    reminderDaysBefore,
    reminderDate: toDateString(new Date(due.getTime() - reminderDaysBefore * 24 * 60 * 60 * 1000))
  };
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDb(collection: Collection, item: Entity) {
  const common = { id: item.id };
  if (collection === "workTasks") {
    const task = item as WorkTask;
    return {
      ...common,
      user_id: task.userId,
      title: task.title,
      project_name: task.projectName,
      product_owner: task.productOwner,
      platform: task.platform,
      poc: task.poc,
      category: task.category,
      description: task.description,
      received_date: task.receivedDate,
      assigned_date: task.assignedDate,
      due_date: task.dueDate,
      day_of_week: task.dayOfWeek,
      estimated_minutes: task.estimatedMinutes,
      actual_minutes: task.actualMinutes,
      completion_percentage: task.completionPercentage,
      status: task.status,
      priority: task.priority,
      work_type: task.workType,
      notes: task.notes,
      deliverable: task.deliverable,
      blockers: task.blockers,
      learnings: task.learnings
    };
  }
  if (collection === "skills") {
    const skill = item as Skill;
    return {
      ...common,
      user_id: skill.userId,
      skill_name: skill.skillName,
      category: skill.category,
      current_level: skill.currentLevel,
      target_level: skill.targetLevel,
      reason: skill.reason,
      weekly_target_minutes: skill.weeklyTargetMinutes,
      deadline: skill.deadline,
      progress_percentage: skill.progressPercentage,
      confidence_score: skill.confidenceScore,
      notes: skill.notes
    };
  }
  if (collection === "learningTasks") {
    const task = item as LearningTask;
    return {
      ...common,
      user_id: task.userId,
      skill_id: task.skillId,
      title: task.title,
      description: task.description,
      resource_link: task.resourceLink,
      learning_type: task.learningType,
      planned_date: task.plannedDate,
      planned_minutes: task.plannedMinutes,
      actual_minutes: task.actualMinutes,
      status: task.status,
      difficulty: task.difficulty,
      understanding_score: task.understandingScore,
      output_created: task.outputCreated,
      notes: task.notes
    };
  }
  if (collection === "timeLogs") {
    const log = item as TimeLog;
    return {
      ...common,
      user_id: log.userId,
      linked_type: log.linkedType,
      linked_id: log.linkedId || null,
      log_type: log.logType,
      date: log.date,
      start_time: log.startTime || null,
      end_time: log.endTime || null,
      duration_minutes: log.durationMinutes,
      notes: log.notes
    };
  }
  const review = item as WeeklyReview;
  if (collection === "weeklyReviews") {
    return {
      ...common,
      user_id: review.userId,
      week_start_date: review.weekStartDate,
      week_end_date: review.weekEndDate,
      completed_summary: review.completedSummary,
      incomplete_summary: review.incompleteSummary,
      blockers: review.blockers,
      key_learnings: review.keyLearnings,
      skills_improved: review.skillsImproved,
      work_highlights: review.workHighlights,
      improvement_areas: review.improvementAreas,
      next_week_plan: review.nextWeekPlan,
      auto_summary_json: review.autoSummaryJson
    };
  }
  return camelToSnake(item);
}

function camelToSnake(item: Entity) {
  return Object.fromEntries(
    Object.entries(item as Record<string, unknown>).map(([key, value]) => [
      key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
      value === "" && key.endsWith("Id") ? null : value
    ])
  );
}

function snakeToCamel(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase()),
      value ?? ""
    ])
  );
}

function fromFinanceRow(row: any) {
  return snakeToCamel(row) as any;
}

function fromWorkTask(row: any): WorkTask {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    projectName: row.project_name || "",
    productOwner: row.product_owner || row.poc || "",
    platform: row.platform || "",
    poc: row.poc || "",
    category: row.category || "",
    description: row.description || "",
    receivedDate: row.received_date || row.assigned_date,
    assignedDate: row.assigned_date,
    dueDate: row.due_date || row.assigned_date,
    dayOfWeek: row.day_of_week || "",
    estimatedMinutes: row.estimated_minutes || 0,
    actualMinutes: row.actual_minutes || 0,
    completionPercentage: row.completion_percentage ?? (row.status === "Completed" ? 100 : 0),
    status: row.status,
    priority: row.priority,
    workType: row.work_type,
    notes: row.notes || "",
    deliverable: row.deliverable || "",
    blockers: row.blockers || "",
    learnings: row.learnings || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function fromSkill(row: any): Skill {
  return {
    id: row.id,
    userId: row.user_id,
    skillName: row.skill_name,
    category: row.category,
    currentLevel: row.current_level,
    targetLevel: row.target_level,
    reason: row.reason || "",
    weeklyTargetMinutes: row.weekly_target_minutes || 0,
    deadline: row.deadline || "",
    progressPercentage: row.progress_percentage || 0,
    confidenceScore: row.confidence_score || 1,
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function fromLearningTask(row: any): LearningTask {
  return {
    id: row.id,
    userId: row.user_id,
    skillId: row.skill_id,
    title: row.title,
    description: row.description || "",
    resourceLink: row.resource_link || "",
    learningType: row.learning_type,
    plannedDate: row.planned_date,
    plannedMinutes: row.planned_minutes || 0,
    actualMinutes: row.actual_minutes || 0,
    status: row.status,
    difficulty: row.difficulty,
    understandingScore: row.understanding_score || 1,
    outputCreated: row.output_created || "",
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function fromTimeLog(row: any): TimeLog {
  return {
    id: row.id,
    userId: row.user_id,
    linkedType: row.linked_type,
    linkedId: row.linked_id || "",
    logType: row.log_type,
    date: row.date,
    startTime: row.start_time || "",
    endTime: row.end_time || "",
    durationMinutes: row.duration_minutes || 0,
    notes: row.notes || "",
    createdAt: row.created_at
  };
}

function fromWeeklyReview(row: any): WeeklyReview {
  return {
    id: row.id,
    userId: row.user_id,
    weekStartDate: row.week_start_date,
    weekEndDate: row.week_end_date,
    completedSummary: row.completed_summary || "",
    incompleteSummary: row.incomplete_summary || "",
    blockers: row.blockers || "",
    keyLearnings: row.key_learnings || "",
    skillsImproved: row.skills_improved || "",
    workHighlights: row.work_highlights || "",
    improvementAreas: row.improvement_areas || "",
    nextWeekPlan: row.next_week_plan || "",
    autoSummaryJson: row.auto_summary_json || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
