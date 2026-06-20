import { differenceInCalendarMonths, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { AppData, Expense, Investment } from "./types";
import { isInWeek, toDateInput, weekDays } from "./date";

export const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function monthKey(date = new Date()) {
  return format(date, "yyyy-MM");
}

export function inMonth(dateInput: string, month: string) {
  return dateInput.startsWith(month);
}

export function financeMonthData(data: AppData, month: string) {
  return {
    incomeEntries: data.incomeEntries.filter((item) => item.month === month || inMonth(item.receivedDate, month)),
    expenses: data.expenses.filter((item) => inMonth(item.expenseDate, month)),
    emis: data.emis,
    emiPayments: data.emiPayments.filter((item) => item.paymentMonth === month),
    investments: data.investments.filter((item) => inMonth(item.investmentDate, month) || item.currentValue > 0),
    investmentValueHistory: data.investmentValueHistory.filter((item) => inMonth(item.valueDate, month)),
    financialGoals: data.financialGoals,
    monthlyFinanceReviews: data.monthlyFinanceReviews.filter((item) => item.month === month)
  };
}

export function financeMetrics(data: AppData, month: string) {
  const scoped = financeMonthData(data, month);
  const totalIncome = sum(scoped.incomeEntries.map((item) => item.amount));
  const totalExpenses = sum(scoped.expenses.filter((item) => item.expenseNature !== "Investment").map((item) => item.amount));
  const totalEmi = sum(scoped.emis.filter((emi) => emi.status !== "Closed").map((emi) => emi.emiAmount));
  const emiPaid = sum(scoped.emiPayments.map((payment) => payment.amountPaid));
  const totalInvestment = sum(scoped.investments.filter((item) => inMonth(item.investmentDate, month)).map((item) => item.amountInvested));
  const currentInvestmentValue = sum(data.investments.map((item) => item.currentValue));
  const savings = totalIncome - totalExpenses - emiPaid - totalInvestment;
  const highestCategory = topCategory(scoped.expenses);
  const daysElapsed = Math.max(1, new Date().getMonth() === parseISO(`${month}-01`).getMonth() ? new Date().getDate() : endOfMonth(parseISO(`${month}-01`)).getDate());
  const score = financeDisciplineScore(data, month);

  return {
    totalIncome,
    totalExpenses,
    totalEmi,
    totalInvestment,
    currentInvestmentValue,
    savings,
    savingsRate: ratio(savings, totalIncome),
    expenseToIncome: ratio(totalExpenses, totalIncome),
    emiToIncome: ratio(totalEmi, totalIncome),
    remainingBalance: totalIncome - totalExpenses - emiPaid - totalInvestment,
    highestCategory: highestCategory?.name || "No spending yet",
    averageDailySpend: totalExpenses / daysElapsed,
    financeScore: score,
    financeLabel: financeScoreLabel(score)
  };
}

export function financeDisciplineScore(data: AppData, month: string) {
  const scoped = financeMonthData(data, month);
  const expenses = sum(scoped.expenses.filter((item) => item.expenseNature !== "Investment").map((item) => item.amount));
  const income = sum(scoped.incomeEntries.map((item) => item.amount));
  const investments = sum(scoped.investments.filter((item) => inMonth(item.investmentDate, month)).map((item) => item.amountInvested));
  const wants = sum(scoped.expenses.filter((item) => item.expenseNature === "Want").map((item) => item.amount));
  const needs = sum(scoped.expenses.filter((item) => item.expenseNature === "Need").map((item) => item.amount));

  const savingsScore = income ? Math.min(Math.max((income - expenses - investments) / income, 0), 1) : 0.7;
  const emiScore = scoped.emis.length ? scoped.emis.filter((emi) => emi.status === "Paid" || emi.status === "Closed").length / scoped.emis.length : 1;
  const investmentScore = income ? Math.min(investments / Math.max(income * 0.2, 1), 1) : 0.7;
  const needWantScore = wants + needs ? Math.max(0, 1 - wants / (wants + needs)) : 0.8;
  return Math.round(savingsScore * 35 + emiScore * 25 + investmentScore * 25 + needWantScore * 15);
}

export function financeScoreLabel(score: number) {
  if (score >= 80) return "Excellent financial control";
  if (score >= 60) return "Good, but can improve";
  if (score >= 40) return "Needs better tracking";
  return "Spending or tracking needs attention";
}

export function dailyExpenseSeries(data: AppData, weekStart: string) {
  return weekDays(new Date(`${weekStart}T00:00:00`)).map((day) => ({
    day: day.dayName.slice(0, 3),
    date: day.input,
    expense: sum(data.expenses.filter((item) => item.expenseDate === day.input).map((item) => item.amount)),
    investment: sum(data.expenses.filter((item) => item.expenseDate === day.input && item.expenseNature === "Investment").map((item) => item.amount)),
    emi: sum(data.expenses.filter((item) => item.expenseDate === day.input && item.expenseNature === "EMI").map((item) => item.amount))
  }));
}

export function weeklyFinanceSummary(data: AppData, weekStart: string) {
  const series = dailyExpenseSeries(data, weekStart);
  const sorted = [...series].sort((a, b) => b.expense - a.expense);
  return {
    totalWeeklySpend: sum(series.map((item) => item.expense)),
    highestSpendingDay: sorted[0]?.day || "No data",
    lowestSpendingDay: sorted[sorted.length - 1]?.day || "No data",
    averageDailySpend: sum(series.map((item) => item.expense)) / 7,
    topCategories: categoryTotals(data.expenses.filter((expense) => isInWeek(expense.expenseDate, weekStart))).slice(0, 3)
  };
}

export function categoryTotals(expenses: Expense[]) {
  return Object.entries(groupSum(expenses, (item) => item.category, (item) => item.amount))
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function paymentModeTotals(expenses: Expense[]) {
  return Object.entries(groupSum(expenses, (item) => item.paymentMode, (item) => item.amount)).map(([name, value]) => ({ name, value }));
}

export function natureTotals(expenses: Expense[]) {
  return Object.entries(groupSum(expenses, (item) => item.expenseNature, (item) => item.amount)).map(([name, value]) => ({ name, value }));
}

export function investmentAllocation(investments: Investment[]) {
  return Object.entries(groupSum(investments, (item) => item.investmentType, (item) => item.currentValue)).map(([name, value]) => ({ name, value }));
}

export function portfolioMetrics(investments: Investment[]) {
  const totalInvested = sum(investments.map((item) => item.amountInvested));
  const currentValue = sum(investments.map((item) => item.currentValue));
  const gainLoss = currentValue - totalInvested;
  return {
    totalInvested,
    currentValue,
    gainLoss,
    returnPercentage: ratio(gainLoss, totalInvested),
    topGainers: [...investments].sort((a, b) => b.returnPercentage - a.returnPercentage).slice(0, 3),
    topLosers: [...investments].sort((a, b) => a.returnPercentage - b.returnPercentage).slice(0, 3),
    manualNeeded: investments.filter((item) => item.priceUpdateStatus !== "Updated")
  };
}

export function portfolioHistory(data: AppData) {
  return data.investmentValueHistory
    .reduce<Record<string, number>>((acc, item) => {
      acc[item.valueDate] = (acc[item.valueDate] || 0) + item.currentValue;
      return acc;
    }, {});
}

export function monthlyFinanceSummary(data: AppData, month: string) {
  const metrics = financeMetrics(data, month);
  const expenses = data.expenses.filter((item) => inMonth(item.expenseDate, month));
  const categories = categoryTotals(expenses);
  const daily = expenses.reduce<Record<string, number>>((acc, item) => {
    acc[item.expenseDate] = (acc[item.expenseDate] || 0) + item.amount;
    return acc;
  }, {});
  const highestDay = Object.entries(daily).sort((a, b) => b[1] - a[1])[0];
  return {
    totalIncome: metrics.totalIncome,
    totalExpenses: metrics.totalExpenses,
    totalEmiPaid: sum(data.emiPayments.filter((item) => item.paymentMonth === month).map((item) => item.amountPaid)),
    totalInvestments: metrics.totalInvestment,
    totalSavings: metrics.savings,
    topSpendingCategory: categories[0]?.name || "No spending yet",
    highestSpendingDay: highestDay ? `${highestDay[0]} (${currency.format(highestDay[1])})` : "No spending yet",
    investmentContribution: metrics.totalInvestment,
    remainingBalance: metrics.remainingBalance,
    financeDisciplineScore: metrics.financeScore
  };
}

export function monthlyTrend(data: AppData) {
  const grouped = data.expenses.reduce<Record<string, number>>((acc, item) => {
    const key = item.expenseDate.slice(0, 7);
    acc[key] = (acc[key] || 0) + item.amount;
    return acc;
  }, {});
  return Object.entries(grouped).map(([month, expense]) => ({ month, expense }));
}

export function goalProgress(goal: { targetAmount: number; currentSavedAmount: number; targetDate: string }) {
  const remaining = Math.max(0, goal.targetAmount - goal.currentSavedAmount);
  const months = Math.max(1, differenceInCalendarMonths(parseISO(goal.targetDate), new Date()));
  return {
    remaining,
    progress: goal.targetAmount ? Math.round((goal.currentSavedAmount / goal.targetAmount) * 100) : 0,
    monthlyRequired: remaining / months
  };
}

export function currentMonthInterval(month: string) {
  const start = startOfMonth(parseISO(`${month}-01`));
  return { start, end: endOfMonth(start) };
}

function topCategory(expenses: Expense[]) {
  return categoryTotals(expenses)[0];
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function ratio(value: number, total: number) {
  return total ? Math.round((value / total) * 1000) / 10 : 0;
}

function groupSum<T>(items: T[], key: (item: T) => string, value: (item: T) => number) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const group = key(item);
    acc[group] = (acc[group] || 0) + value(item);
    return acc;
  }, {});
}
