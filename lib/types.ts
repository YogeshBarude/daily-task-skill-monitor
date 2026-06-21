export type ID = string;

export type WorkStatus = "In Progress" | "Completed";
export type LearningStatus = "Planned" | "In Progress" | "Done" | "Skipped";
export type Priority = "Low" | "High";

export type UserProfile = {
  id: ID;
  email: string;
  name: string;
};

export type WorkTask = {
  id: ID;
  userId: ID;
  title: string;
  projectName: string;
  productOwner: string;
  platform: string;
  poc: string;
  category: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  estimatedMinutes: number;
  status: WorkStatus;
  priority: Priority;
  notes: string;
  blockers: string;
  createdAt: string;
  updatedAt: string;
};

export type Skill = {
  id: ID;
  userId: ID;
  skillName: string;
  category: "Coding" | "Design" | "Language" | "Other";
  currentLevel: "Beginner" | "Intermediate" | "Advanced";
  targetLevel: "Beginner" | "Intermediate" | "Advanced";
  weeklyTargetMinutes: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
};

export type LearningTask = {
  id: ID;
  userId: ID;
  skillId: ID;
  title: string;
  learningType: "Read" | "Watch" | "Practice" | "Build" | "Review";
  plannedDate: string;
  plannedMinutes: number;
  status: LearningStatus;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyReview = {
  id: ID;
  userId: ID;
  weekStartDate: string;
  weekEndDate: string;
  completedSummary: string;
  blockers: string;
  keyLearnings: string;
  nextWeekPlan: string;
  autoSummaryJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AppData = {
  workTasks: WorkTask[];
  skills: Skill[];
  learningTasks: LearningTask[];
  weeklyReviews: WeeklyReview[];
};
