import { AppData, Budget, CategoryBudget, Emi, Expense, FinanceSettings, FinancialGoal, IncomeEntry, Investment, InvestmentValueHistory, LearningTask, MonthlyFinanceReview, Skill, TimeLog, UpcomingPayment, UserProfile, WeeklyReview, WorkTask } from "./types";
import { toDateInput, weekDays } from "./date";

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
      receivedDate: days[0].input,
      assignedDate: days[0].input,
      dueDate: days[1].input,
      dayOfWeek: days[0].dayName,
      estimatedMinutes: 120,
      actualMinutes: 150,
      completionPercentage: 100,
      status: "Completed",
      priority: "High",
      workType: "Testing",
      notes: "Validated upload, mapping, and score output behavior.",
      deliverable: "Testing notes and defect list",
      blockers: "",
      learnings: "Model validation flows need clearer error states.",
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
      receivedDate: days[0].input,
      assignedDate: days[2].input,
      dueDate: days[4].input,
      dayOfWeek: days[2].dayName,
      estimatedMinutes: 180,
      actualMinutes: 90,
      completionPercentage: 50,
      status: "In Progress",
      priority: "Medium",
      workType: "Analysis",
      notes: "Charts drafted, narrative pending.",
      deliverable: "Analysis deck",
      blockers: "Waiting on final benchmark numbers",
      learnings: "Need reusable deck structure.",
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
      receivedDate: days[1].input,
      assignedDate: days[4].input,
      dueDate: days[6].input,
      dayOfWeek: days[4].dayName,
      estimatedMinutes: 150,
      actualMinutes: 0,
      completionPercentage: 0,
      status: "Planned",
      priority: "High",
      workType: "Analysis",
      notes: "",
      deliverable: "Benchmark table",
      blockers: "",
      learnings: "",
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
      receivedDate: days[0].input,
      assignedDate: days[1].input,
      dueDate: days[3].input,
      dayOfWeek: days[1].dayName,
      estimatedMinutes: 90,
      actualMinutes: 45,
      completionPercentage: 45,
      status: "In Progress",
      priority: "Medium",
      workType: "Documentation",
      notes: "Intro and setup sections done.",
      deliverable: "Demo script",
      blockers: "",
      learnings: "",
      createdAt: now,
      updatedAt: now
    }
  ];

  const skills: Skill[] = [
    skill("sk-1", userId, "FastAPI", "Coding", 55, 4, days[6].input, 240),
    skill("sk-2", userId, "Azure DevOps", "Cloud", 35, 3, days[6].input, 180),
    skill("sk-3", userId, "Python Backend", "Coding", 60, 4, days[6].input, 210),
    skill("sk-4", userId, "GenAI Prototyping", "AI", 45, 3, days[6].input, 180),
    skill("sk-5", userId, "SQL", "Analytics", 70, 4, days[6].input, 150)
  ];

  const learningTasks: LearningTask[] = [
    learning("lt-1", userId, "sk-1", "Build simple API with GET and POST endpoints", days[1].input, 90, 120, "Completed", "Project"),
    learning("lt-2", userId, "sk-2", "Create Azure DevOps pipeline notes", days[3].input, 75, 0, "Planned", "Documentation"),
    learning("lt-3", userId, "sk-3", "Practice production-ready error handling", days[4].input, 90, 30, "In Progress", "Practice"),
    learning("lt-4", userId, "sk-4", "Prototype GenAI prompt evaluation flow", days[5].input, 120, 0, "Planned", "Project")
  ];

  const timeLogs: TimeLog[] = [
    log("tl-1", userId, "work", "wt-1", "Work", days[0].input, "09:30", "12:00", 150, "AI Governance testing"),
    log("tl-2", userId, "learning", "lt-1", "Learning", days[1].input, "20:00", "22:00", 120, "FastAPI local build"),
    log("tl-3", userId, "work", "wt-2", "Work", days[2].input, "10:00", "11:30", 90, "Synthetic deck charts")
  ];

  const weeklyReviews: WeeklyReview[] = [
    {
      id: "wr-1",
      userId,
      weekStartDate: days[0].input,
      weekEndDate: days[6].input,
      completedSummary: "Completed AI Governance validation testing and FastAPI practice task.",
      incompleteSummary: "Analysis deck and demo script still need finishing.",
      blockers: "Final benchmark data is pending.",
      keyLearnings: "Need reusable validation checklist and API practice cadence.",
      skillsImproved: "FastAPI, SQL",
      workHighlights: "Model validation flow tested end to end.",
      improvementAreas: "Plan learning sessions earlier in the day.",
      nextWeekPlan: "Finish benchmark deck and increase backend practice.",
      autoSummaryJson: {},
      createdAt: now,
      updatedAt: now
    }
  ];

  const month = new Date().toISOString().slice(0, 7);
  const incomeEntries: IncomeEntry[] = [
    {
      id: "inc-1",
      userId,
      sourceName: "Salary",
      incomeType: "Salary",
      amount: 90000,
      receivedDate: days[0].input,
      month,
      isRecurring: true,
      notes: "Monthly salary",
      createdAt: now,
      updatedAt: now
    }
  ];

  const expenses: Expense[] = [
    expense("exp-1", userId, "Lunch", 250, days[0].input, "Food", "Meals", "UPI", "Need"),
    expense("exp-2", userId, "Office travel", 180, days[0].input, "Travel", "Commute", "UPI", "Need"),
    expense("exp-3", userId, "Coffee", 120, days[1].input, "Food", "Cafe", "UPI", "Want"),
    expense("exp-4", userId, "Shopping", 2000, days[2].input, "Shopping", "Clothes", "Debit Card", "Want"),
    expense("exp-5", userId, "Subscription", 499, days[3].input, "Subscriptions", "Software", "Credit Card", "Need"),
    expense("exp-6", userId, "Health checkup", 800, days[4].input, "Health", "Clinic", "UPI", "Need"),
    expense("exp-7", userId, "Education loan EMI paid", 18000, days[1].input, "EMI", "Education loan", "Net Banking", "EMI"),
    expense("exp-8", userId, "Mutual Fund SIP", 5000, days[2].input, "Investment", "SIP", "Net Banking", "Investment")
  ];

  const budgets: Budget[] = [
    {
      id: "bud-1",
      userId,
      month,
      totalBudget: 35000,
      savingsTarget: 20000,
      investmentTarget: 10000,
      discretionaryLimit: 9000,
      createdAt: now,
      updatedAt: now
    }
  ];

  const categoryBudgets: CategoryBudget[] = [
    categoryBudget("cb-1", userId, "bud-1", "Food", 8000),
    categoryBudget("cb-2", userId, "bud-1", "Travel", 5000),
    categoryBudget("cb-3", userId, "bud-1", "Shopping", 6000),
    categoryBudget("cb-4", userId, "bud-1", "Subscriptions", 2000),
    categoryBudget("cb-5", userId, "bud-1", "Health", 3000)
  ];

  const emis: Emi[] = [
    {
      id: "emi-1",
      userId,
      emiName: "Education Loan EMI",
      emiType: "Education Loan",
      emiAmount: 18000,
      dueDay: 5,
      startDate: days[0].input,
      endDate: `${new Date().getFullYear() + 4}-12-05`,
      totalLoanAmount: 800000,
      interestRate: 9.5,
      lenderName: "Education lender",
      isRecurring: true,
      status: "Paid",
      reminderDaysBefore: 3,
      notes: "Keep buffer before EMI date.",
      createdAt: now,
      updatedAt: now
    }
  ];

  const emiPayments = [
    {
      id: "emip-1",
      userId,
      emiId: "emi-1",
      paymentMonth: month,
      paymentDate: days[1].input,
      amountPaid: 18000,
      status: "Paid" as const,
      notes: "Paid this month",
      createdAt: now,
      updatedAt: now
    }
  ];

  const upcomingPayments: UpcomingPayment[] = [
    payment("pay-1", userId, "Credit card bill", 3500, days[5].input, "Credit Card", "Credit Card Bill"),
    payment("pay-2", userId, "Cloud subscription", 799, days[6].input, "Subscriptions", "Subscription")
  ];

  const investments: Investment[] = [
    investment("inv-1", userId, "Mutual Fund SIP", "Mutual Fund", "Groww", 5000, 5125, "MF12345", "NSE", 50, 100, 102.5, "Medium", "Manual Update Required"),
    investment("inv-2", userId, "Gold ETF / Digital Gold", "Gold ETF", "Broker", 3000, 3090, "GOLDETF", "NSE", 10, 300, 309, "Low", "API Not Configured"),
    investment("inv-3", userId, "Starter Stocks", "Stocks", "Broker", 2000, 2140, "TCS", "NSE", 1, 2000, 2140, "High", "API Not Configured")
  ];

  const investmentValueHistory: InvestmentValueHistory[] = investments.map((item, index) => ({
    id: `ivh-${index + 1}`,
    userId,
    investmentId: item.id,
    valueDate: item.investmentDate,
    currentPrice: item.currentPrice,
    currentValue: item.currentValue,
    amountInvested: item.amountInvested,
    gainLoss: item.gainLoss,
    returnPercentage: item.returnPercentage,
    priceSource: item.priceSource,
    updateType: "manual",
    createdAt: now
  }));

  const financialGoals: FinancialGoal[] = [
    goal("goal-1", userId, "Emergency Fund", 150000, 18000, "High"),
    goal("goal-2", userId, "Laptop Fund", 100000, 12000, "Medium"),
    goal("goal-3", userId, "Travel Fund", 50000, 6000, "Low")
  ];

  const monthlyFinanceReviews: MonthlyFinanceReview[] = [];
  const financeSettings: FinanceSettings[] = [
    {
      id: "finset-1",
      userId,
      defaultCurrency: "INR",
      defaultMonthlyIncome: 90000,
      monthStartDate: 1,
      budgetAlertThreshold: 80,
      emiReminderDays: 3,
      investmentUpdateReminderFrequency: "Weekly",
      createdAt: now,
      updatedAt: now
    }
  ];

  return { workTasks, skills, learningTasks, timeLogs, weeklyReviews, incomeEntries, expenses, budgets, categoryBudgets, emis, emiPayments, upcomingPayments, investments, investmentValueHistory, financialGoals, monthlyFinanceReviews, financeSettings };
}

function skill(id: string, userId: string, skillName: Skill["skillName"], category: Skill["category"], progress: number, confidence: number, deadline: string, weeklyTargetMinutes: number): Skill {
  return {
    id,
    userId,
    skillName,
    category,
    currentLevel: progress > 60 ? "Intermediate" : "Beginner",
    targetLevel: "Advanced",
    reason: `Improve ${skillName} for production-quality work.`,
    weeklyTargetMinutes,
    deadline,
    progressPercentage: progress,
    confidenceScore: confidence,
    notes: "",
    createdAt: now,
    updatedAt: now
  };
}

function learning(id: string, userId: string, skillId: string, title: string, plannedDate: string, plannedMinutes: number, actualMinutes: number, status: LearningTask["status"], learningType: LearningTask["learningType"]): LearningTask {
  return {
    id,
    userId,
    skillId,
    title,
    description: title,
    resourceLink: "",
    learningType,
    plannedDate,
    plannedMinutes,
    actualMinutes,
    status,
    difficulty: "Medium",
    understandingScore: status === "Completed" ? 4 : 3,
    outputCreated: status === "Completed" ? "Working local output" : "",
    notes: "",
    createdAt: now,
    updatedAt: now
  };
}

function log(id: string, userId: string, linkedType: TimeLog["linkedType"], linkedId: string, logType: TimeLog["logType"], date: string, startTime: string, endTime: string, durationMinutes: number, notes: string): TimeLog {
  return { id, userId, linkedType, linkedId, logType, date, startTime, endTime, durationMinutes, notes, createdAt: now };
}

function expense(id: string, userId: string, title: string, amount: number, expenseDate: string, category: Expense["category"], subCategory: string, paymentMode: Expense["paymentMode"], expenseNature: Expense["expenseNature"]): Expense {
  return { id, userId, title, amount, expenseDate, expenseTime: "10:00", category, subCategory, paymentMode, expenseNature, notes: "", isRecurring: false, createdAt: now, updatedAt: now };
}

function categoryBudget(id: string, userId: string, budgetId: string, category: Expense["category"], budgetAmount: number): CategoryBudget {
  return { id, userId, budgetId, category, budgetAmount, createdAt: now, updatedAt: now };
}

function payment(id: string, userId: string, title: string, amount: number, dueDate: string, category: string, paymentType: UpcomingPayment["paymentType"]): UpcomingPayment {
  const dueDay = new Date(`${dueDate}T00:00:00`).getDate();
  const reminderDaysBefore = 3;
  const reminderDate = toDateInput(new Date(new Date(`${dueDate}T00:00:00`).getTime() - reminderDaysBefore * 24 * 60 * 60 * 1000));
  return { id, userId, title, amount, dueDate, category, paymentType, isRecurring: false, billingDay: paymentType === "Credit Card Bill" ? Math.max(1, dueDay - 18) : 0, dueDay, reminderDaysBefore, reminderDate, status: "Upcoming", notes: "", createdAt: now, updatedAt: now };
}

function investment(id: string, userId: string, investmentName: string, investmentType: Investment["investmentType"], platform: string, amountInvested: number, currentValue: number, tickerSymbol: string, marketExchange: string, units: number, averageBuyPrice: number, currentPrice: number, riskLevel: Investment["riskLevel"], priceUpdateStatus: Investment["priceUpdateStatus"]): Investment {
  const gainLoss = currentValue - amountInvested;
  return {
    id,
    userId,
    investmentName,
    investmentType,
    platform,
    amountInvested,
    currentValue,
    investmentDate: toDateInput(new Date()),
    tickerSymbol,
    isin: "",
    marketExchange,
    units,
    averageBuyPrice,
    currentPrice,
    linkedGoalId: "",
    riskLevel,
    notes: "Tracking only, no investment advice.",
    gainLoss,
    returnPercentage: amountInvested ? Math.round((gainLoss / amountInvested) * 10000) / 100 : 0,
    priceSource: "Manual",
    priceUpdateStatus,
    lastPriceUpdatedAt: now,
    isPriceTrackingEnabled: ["Stocks", "ETF", "Mutual Fund", "Gold ETF", "Digital Gold", "Crypto"].includes(investmentType),
    manualCurrentValue: currentValue,
    createdAt: now,
    updatedAt: now
  };
}

function goal(id: string, userId: string, goalName: string, targetAmount: number, currentSavedAmount: number, priority: FinancialGoal["priority"]): FinancialGoal {
  return { id, userId, goalName, targetAmount, currentSavedAmount, targetDate: `${new Date().getFullYear() + 1}-12-31`, priority, linkedInvestmentId: "", notes: "", createdAt: now, updatedAt: now };
}
