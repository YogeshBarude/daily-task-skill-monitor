export type ID = string;

export type WorkStatus = "Backlog" | "Planned" | "In Progress" | "Blocked" | "Completed";
export type LearningStatus = "Planned" | "In Progress" | "Completed";
export type Priority = "Low" | "Medium" | "High";
export type WeekStatus = "Not Started" | "In Progress" | "Completed" | "Overdue";
export type FinanceStatus = "Upcoming" | "Paid" | "Missed" | "Closed";
export type PriceUpdateStatus = "Updated" | "Update Failed" | "Manual Update Required" | "API Not Configured" | "Market Closed / Price Not Available";

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
  receivedDate: string;
  assignedDate: string;
  dueDate: string;
  dayOfWeek: string;
  estimatedMinutes: number;
  actualMinutes: number;
  completionPercentage: number;
  status: WorkStatus;
  priority: Priority;
  workType: "Research" | "Analysis" | "Testing" | "Documentation" | "Meeting" | "Development" | "Review" | "Other";
  notes: string;
  deliverable: string;
  blockers: string;
  learnings: string;
  createdAt: string;
  updatedAt: string;
};

export type Skill = {
  id: ID;
  userId: ID;
  skillName: string;
  category: "Technical" | "AI" | "Coding" | "Analytics" | "Cloud" | "Communication" | "Business" | "Other";
  currentLevel: "Beginner" | "Intermediate" | "Advanced";
  targetLevel: "Beginner" | "Intermediate" | "Advanced";
  reason: string;
  weeklyTargetMinutes: number;
  deadline: string;
  progressPercentage: number;
  confidenceScore: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type LearningTask = {
  id: ID;
  userId: ID;
  skillId: ID;
  title: string;
  description: string;
  resourceLink: string;
  learningType: "Video" | "Course" | "Article" | "Practice" | "Project" | "Documentation" | "Revision";
  plannedDate: string;
  plannedMinutes: number;
  actualMinutes: number;
  status: LearningStatus;
  difficulty: "Easy" | "Medium" | "Hard";
  understandingScore: number;
  outputCreated: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type TimeLog = {
  id: ID;
  userId: ID;
  linkedType: "work" | "learning" | "none";
  linkedId: ID | "";
  logType: "Work" | "Learning" | "Personal";
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  notes: string;
  createdAt: string;
};

export type WeeklyReview = {
  id: ID;
  userId: ID;
  weekStartDate: string;
  weekEndDate: string;
  completedSummary: string;
  incompleteSummary: string;
  blockers: string;
  keyLearnings: string;
  skillsImproved: string;
  workHighlights: string;
  improvementAreas: string;
  nextWeekPlan: string;
  autoSummaryJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type IncomeEntry = {
  id: ID;
  userId: ID;
  sourceName: string;
  incomeType: "Salary" | "Freelance" | "Bonus" | "Other";
  amount: number;
  receivedDate: string;
  month: string;
  isRecurring: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Expense = {
  id: ID;
  userId: ID;
  title: string;
  amount: number;
  expenseDate: string;
  expenseTime: string;
  category: "Food" | "Travel" | "Shopping" | "Rent" | "EMI" | "Groceries" | "Health" | "Subscriptions" | "Entertainment" | "Family" | "Education" | "Work-related" | "Utilities" | "Investment" | "Other";
  subCategory: string;
  paymentMode: "UPI" | "Cash" | "Credit Card" | "Debit Card" | "Net Banking" | "Wallet" | "Other";
  expenseNature: "Need" | "Want" | "EMI" | "Investment" | "Other";
  notes: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Budget = {
  id: ID;
  userId: ID;
  month: string;
  totalBudget: number;
  savingsTarget: number;
  investmentTarget: number;
  discretionaryLimit: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryBudget = {
  id: ID;
  userId: ID;
  budgetId: ID;
  category: Expense["category"];
  budgetAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type Emi = {
  id: ID;
  userId: ID;
  emiName: string;
  emiType: "Education Loan" | "Personal Loan" | "Credit Card EMI" | "Product EMI" | "Other";
  emiAmount: number;
  dueDay: number;
  startDate: string;
  endDate: string;
  totalLoanAmount: number;
  interestRate: number;
  lenderName: string;
  isRecurring: boolean;
  status: FinanceStatus;
  reminderDaysBefore: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type EmiPayment = {
  id: ID;
  userId: ID;
  emiId: ID;
  paymentMonth: string;
  paymentDate: string;
  amountPaid: number;
  status: "Paid" | "Missed";
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type UpcomingPayment = {
  id: ID;
  userId: ID;
  title: string;
  amount: number;
  dueDate: string;
  category: string;
  paymentType: "EMI" | "Credit Card Bill" | "Subscription" | "Insurance" | "Rent" | "Education Fee" | "Other Planned Payment";
  isRecurring: boolean;
  billingDay: number;
  dueDay: number;
  reminderDaysBefore: number;
  reminderDate: string;
  status: "Upcoming" | "Paid" | "Missed";
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Investment = {
  id: ID;
  userId: ID;
  investmentName: string;
  investmentType: "Mutual Fund" | "Stocks" | "ETF" | "Gold" | "Gold ETF" | "Digital Gold" | "Fixed Deposit" | "Recurring Deposit" | "PPF" | "NPS" | "Crypto" | "Other";
  platform: string;
  amountInvested: number;
  currentValue: number;
  investmentDate: string;
  tickerSymbol: string;
  isin: string;
  marketExchange: string;
  units: number;
  averageBuyPrice: number;
  currentPrice: number;
  linkedGoalId: ID | "";
  riskLevel: "Low" | "Medium" | "High";
  notes: string;
  gainLoss: number;
  returnPercentage: number;
  priceSource: string;
  priceUpdateStatus: PriceUpdateStatus;
  lastPriceUpdatedAt: string;
  isPriceTrackingEnabled: boolean;
  manualCurrentValue: number;
  createdAt: string;
  updatedAt: string;
};

export type InvestmentValueHistory = {
  id: ID;
  userId: ID;
  investmentId: ID;
  valueDate: string;
  currentPrice: number;
  currentValue: number;
  amountInvested: number;
  gainLoss: number;
  returnPercentage: number;
  priceSource: string;
  updateType: "automatic" | "manual";
  createdAt: string;
};

export type FinancialGoal = {
  id: ID;
  userId: ID;
  goalName: string;
  targetAmount: number;
  currentSavedAmount: number;
  targetDate: string;
  priority: Priority;
  linkedInvestmentId: ID | "";
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type MonthlyFinanceReview = {
  id: ID;
  userId: ID;
  month: string;
  wentWell: string;
  overspentAreas: string;
  avoidableExpenses: string;
  emisPaidSummary: string;
  investmentsMadeSummary: string;
  savingsSummary: string;
  nextMonthPlan: string;
  notes: string;
  autoSummaryJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type FinanceSettings = {
  id: ID;
  userId: ID;
  defaultCurrency: "INR";
  defaultMonthlyIncome: number;
  monthStartDate: number;
  budgetAlertThreshold: number;
  emiReminderDays: number;
  investmentUpdateReminderFrequency: "Daily" | "Weekly" | "Monthly";
  createdAt: string;
  updatedAt: string;
};

export type AppData = {
  workTasks: WorkTask[];
  skills: Skill[];
  learningTasks: LearningTask[];
  timeLogs: TimeLog[];
  weeklyReviews: WeeklyReview[];
  incomeEntries: IncomeEntry[];
  expenses: Expense[];
  budgets: Budget[];
  categoryBudgets: CategoryBudget[];
  emis: Emi[];
  emiPayments: EmiPayment[];
  upcomingPayments: UpcomingPayment[];
  investments: Investment[];
  investmentValueHistory: InvestmentValueHistory[];
  financialGoals: FinancialGoal[];
  monthlyFinanceReviews: MonthlyFinanceReview[];
  financeSettings: FinanceSettings[];
};
