import { AppData, LearningTask, Skill, UserProfile, WeeklyReview, WorkTask } from "./types";
import { weekDays } from "./date";

const now = new Date().toISOString();

export const demoUser: UserProfile = {
  id: "local-user",
  email: "demo@daily-monitor.local",
  name: "Demo User"
};

export function createSampleData(userId = demoUser.id): AppData {
  const days = weekDays();
  const workTasks: WorkTask[] = [
    {
      id: "wt-1",
      userId,
      title: "Testing AI Governance platform using .pkl model files",
      projectName: "AI Governance",
      productOwner: "Vaibhav",
      platform: "AI Governance Portal",
      poc: "Vaibhav",
      category: "Validation",
      description: "Test classification and regression model validation flows with CSV inputs.",
      assignedDate: days[0].input,
      dueDate: days[1].input,
      estimatedMinutes: 120,
      status: "Completed",
      priority: "High",
      notes: "Validated upload, mapping, and score output behavior.",
      blockers: "",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "wt-2",
      userId,
      title: "Preparing synthetic testing analysis deck",
      projectName: "Synthetic Testing",
      productOwner: "Internal",
      platform: "PowerPoint",
      poc: "Internal",
      category: "Analysis",
      description: "Summarize synthetic test results and methodology.",
      assignedDate: days[2].input,
      dueDate: days[4].input,
      estimatedMinutes: 180,
      status: "In Progress",
      priority: "Low",
      notes: "Charts drafted, narrative pending.",
      blockers: "Waiting on final benchmark numbers",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "wt-3",
      userId,
      title: "Benchmarking purchase intent and funnel score data",
      projectName: "Coca-Cola Creative Analysis",
      productOwner: "Research team",
      platform: "Analytics workbook",
      poc: "Research team",
      category: "Benchmarking",
      description: "Compare creative testing outputs across purchase intent, recall, and funnel metrics.",
      assignedDate: days[4].input,
      dueDate: days[6].input,
      estimatedMinutes: 150,
      status: "In Progress",
      priority: "High",
      notes: "",
      blockers: "",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "wt-4",
      userId,
      title: "Creating demo video script",
      projectName: "DU Telecom Concept Testing",
      productOwner: "Product team",
      platform: "Docs",
      poc: "Product team",
      category: "Documentation",
      description: "Draft demo script showing concept testing flow and insights.",
      assignedDate: days[1].input,
      dueDate: days[3].input,
      estimatedMinutes: 90,
      status: "In Progress",
      priority: "Low",
      notes: "Intro and setup sections done.",
      blockers: "",
      createdAt: now,
      updatedAt: now
    }
  ];

  const skills: Skill[] = [
    skill("sk-1", userId, "FastAPI", "Coding", "Intermediate", days[6].input, 240),
    skill("sk-2", userId, "UI Design", "Design", "Beginner", days[6].input, 180),
    skill("sk-3", userId, "Python Backend", "Coding", "Intermediate", days[6].input, 210),
    skill("sk-4", userId, "Business English", "Language", "Beginner", days[6].input, 180)
  ];

  const learningTasks: LearningTask[] = [
    learning("lt-1", userId, "sk-1", "Build simple API with GET and POST endpoints", days[1].input, 90, "Done", "Build"),
    learning("lt-2", userId, "sk-2", "Review dashboard layout patterns", days[3].input, 75, "Planned", "Read"),
    learning("lt-3", userId, "sk-3", "Practice production-ready error handling", days[4].input, 90, "In Progress", "Practice"),
    learning("lt-4", userId, "sk-4", "Watch business presentation lesson", days[5].input, 120, "Planned", "Watch")
  ];

  const weeklyReviews: WeeklyReview[] = [
    {
      id: "wr-1",
      userId,
      weekStartDate: days[0].input,
      weekEndDate: days[6].input,
      completedSummary: "Completed AI Governance validation testing and FastAPI practice task.",
      blockers: "Final benchmark data is pending.",
      keyLearnings: "Need reusable validation checklist and API practice cadence.",
      nextWeekPlan: "Finish benchmark deck and increase backend practice.",
      autoSummaryJson: {},
      createdAt: now,
      updatedAt: now
    }
  ];

  return { workTasks, skills, learningTasks, weeklyReviews };
}

function skill(id: string, userId: string, skillName: Skill["skillName"], category: Skill["category"], currentLevel: Skill["currentLevel"], deadline: string, weeklyTargetMinutes: number): Skill {
  return {
    id,
    userId,
    skillName,
    category,
    currentLevel,
    targetLevel: "Advanced",
    weeklyTargetMinutes,
    deadline,
    createdAt: now,
    updatedAt: now
  };
}

function learning(id: string, userId: string, skillId: string, title: string, plannedDate: string, plannedMinutes: number, status: LearningTask["status"], learningType: LearningTask["learningType"]): LearningTask {
  return {
    id,
    userId,
    skillId,
    title,
    learningType,
    plannedDate,
    plannedMinutes,
    status,
    createdAt: now,
    updatedAt: now
  };
}
