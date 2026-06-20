"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { createSampleData, demoUser } from "./sample-data";
import { hasSupabaseConfig, supabase } from "./supabase";
import { AppData, LearningTask, Skill, UserProfile, WeeklyReview, WorkTask } from "./types";

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
  weeklyReviews: "weekly_reviews"
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
    const [workTasks, skills, learningTasks, weeklyReviews] = await Promise.all([
      supabase.from("work_tasks").select("*").eq("user_id", userId),
      supabase.from("skills").select("id,user_id,skill_name,category,current_level,target_level,weekly_target_minutes,deadline,created_at,updated_at").eq("user_id", userId),
      supabase.from("learning_tasks").select("id,user_id,skill_id,title,learning_type,planned_date,planned_minutes,actual_minutes,status,created_at,updated_at").eq("user_id", userId),
      supabase.from("weekly_reviews").select("*").eq("user_id", userId)
    ]);
    setData({
      workTasks: (workTasks.data || []).map(fromWorkTask),
      skills: (skills.data || []).map(fromSkill),
      learningTasks: (learningTasks.data || []).map(fromLearningTask),
      weeklyReviews: (weeklyReviews.data || []).map(fromWeeklyReview)
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
  const defaults = createSampleData(demoUser.id);
  return {
    skills: data.skills || defaults.skills,
    learningTasks: data.learningTasks || defaults.learningTasks,
    weeklyReviews: data.weeklyReviews || defaults.weeklyReviews,
    workTasks: (data.workTasks || []).map((task) => {
      const legacyTask = task as WorkTask & { actualMinutes?: number; workType?: string };
      const currentTask = { ...legacyTask };
      delete currentTask.actualMinutes;
      delete currentTask.workType;
      return {
        ...currentTask,
        priority: task.priority === "High" ? "High" : "Low",
        productOwner: task.productOwner || task.poc || "Personal",
        receivedDate: task.receivedDate || task.assignedDate || today,
        dueDate: task.dueDate || task.assignedDate || today,
        completionPercentage: task.completionPercentage ?? (task.status === "Completed" ? 100 : 0)
      };
    })
  };
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
      completion_percentage: task.completionPercentage,
      status: task.status,
      priority: task.priority,
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
      weekly_target_minutes: skill.weeklyTargetMinutes,
      deadline: skill.deadline
    };
  }
  if (collection === "learningTasks") {
    const task = item as LearningTask;
    return {
      ...common,
      user_id: task.userId,
      skill_id: task.skillId,
      title: task.title,
      learning_type: task.learningType,
      planned_date: task.plannedDate,
      planned_minutes: task.plannedMinutes,
      actual_minutes: task.actualMinutes,
      status: task.status
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
  throw new Error(`Unsupported collection: ${collection}`);
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
    completionPercentage: row.completion_percentage ?? (row.status === "Completed" ? 100 : 0),
    status: row.status,
    priority: row.priority === "High" ? "High" : "Low",
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
    weeklyTargetMinutes: row.weekly_target_minutes || 0,
    deadline: row.deadline || "",
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
    learningType: normalizeLearningType(row.learning_type),
    plannedDate: row.planned_date,
    plannedMinutes: row.planned_minutes || 0,
    actualMinutes: row.actual_minutes || 0,
    status: row.status === "Completed" ? "Done" : row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeLearningType(value: string): LearningTask["learningType"] {
  if (value === "Video" || value === "Course") return "Watch";
  if (value === "Article" || value === "Documentation") return "Read";
  if (value === "Project") return "Build";
  if (value === "Revision") return "Review";
  return ["Read", "Watch", "Practice", "Build", "Review"].includes(value) ? value as LearningTask["learningType"] : "Practice";
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
