import { isInWeek, minutesToHours, weekDays } from "./date";
import { AppData, LearningTask, Skill, WorkTask } from "./types";

export function scopedWeekData(data: AppData, weekStartInput: string) {
  return {
    workTasks: data.workTasks.filter((task) => isInWeek(task.assignedDate, weekStartInput)),
    learningTasks: data.learningTasks.filter((task) => isInWeek(task.plannedDate, weekStartInput)),
    skills: data.skills,
    weeklyReviews: data.weeklyReviews.filter((review) => review.weekStartDate === weekStartInput)
  };
}

export function productivityScore(workTasks: WorkTask[], learningTasks: LearningTask[]) {
  const completedWork = workTasks.filter((task) => task.status === "Completed").length;
  const completionRate = workTasks.length ? completedWork / workTasks.length : 0;

  const plannedWork = sum(workTasks.map((task) => task.estimatedMinutes));
  const actualWork = sum(workTasks.map((task) => task.actualMinutes));
  const accuracy = plannedWork ? 1 - Math.min(Math.abs(plannedWork - actualWork) / plannedWork, 1) : 0;

  const learningDays = new Set(learningTasks.filter((task) => task.actualMinutes > 0 || task.status === "Done").map((task) => task.plannedDate)).size;
  const consistency = Math.min(learningDays / 5, 1);

  const highPriority = workTasks.filter((task) => task.priority === "High");
  const highDone = highPriority.length ? highPriority.filter((task) => task.status === "Completed").length / highPriority.length : 1;

  const score = completionRate * 40 + accuracy * 25 + consistency * 20 + highDone * 15;
  return Math.round(score);
}

export function productivityLabel(score: number) {
  if (score >= 80) return "Excellent week";
  if (score >= 60) return "Good week";
  if (score >= 40) return "Needs improvement";
  return "Poor tracking or low completion";
}

export function dashboardMetrics(data: AppData, weekStartInput: string) {
  const week = scopedWeekData(data, weekStartInput);
  const score = productivityScore(week.workTasks, week.learningTasks);
  return {
    totalWorkHours: minutesToHours(sum(week.workTasks.map((task) => task.actualMinutes))),
    totalLearningHours: minutesToHours(sum(week.learningTasks.map((task) => task.actualMinutes))),
    completedWorkTasks: week.workTasks.filter((task) => task.status === "Completed").length,
    pendingWorkTasks: week.workTasks.filter((task) => task.status !== "Completed").length,
    productivityScore: score,
    productivityLabel: productivityLabel(score)
  };
}

export function dailySeries(data: AppData, weekStartInput: string) {
  const days = weekDays(new Date(`${weekStartInput}T00:00:00`));
  return days.map((day) => {
    const work = sum(data.workTasks.filter((task) => task.assignedDate === day.input).map((task) => task.actualMinutes));
    const learning = sum(data.learningTasks.filter((task) => task.plannedDate === day.input).map((task) => task.actualMinutes));
    const completed = data.workTasks.filter((task) => task.assignedDate === day.input && task.status === "Completed").length;
    return {
      day: day.dayName.slice(0, 3),
      date: day.input,
      workHours: minutesToHours(work),
      learningHours: minutesToHours(learning),
      completed
    };
  });
}

export function projectDistribution(workTasks: WorkTask[]) {
  return Object.entries(groupSum(workTasks, (task) => task.projectName || "Unassigned", (task) => task.actualMinutes || task.estimatedMinutes)).map(([name, minutes]) => ({
    name,
    value: minutesToHours(minutes)
  }));
}

export function skillCategoryDistribution(skills: Skill[], learningTasks: LearningTask[]) {
  const skillById = new Map(skills.map((skill) => [skill.id, skill]));
  const grouped = groupSum(
    learningTasks,
    (task) => skillById.get(task.skillId)?.category || "Other",
    (task) => task.actualMinutes
  );
  return Object.entries(grouped).map(([name, minutes]) => ({ name, value: minutesToHours(minutes) }));
}

export function statusDistribution(workTasks: WorkTask[]) {
  return Object.entries(groupCount(workTasks, (task) => task.status)).map(([name, value]) => ({ name, value }));
}

export function priorityDistribution(workTasks: WorkTask[]) {
  return Object.entries(groupCount(workTasks, (task) => task.priority)).map(([name, value]) => ({ name, value }));
}

export function autoWeeklySummary(data: AppData, weekStartInput: string) {
  const week = scopedWeekData(data, weekStartInput);
  const days = dailySeries(data, weekStartInput);
  const sorted = [...days].sort((a, b) => b.workHours + b.learningHours - (a.workHours + a.learningHours));
  const projects = projectDistribution(week.workTasks).sort((a, b) => b.value - a.value);
  const skillCats = skillCategoryDistribution(week.skills, week.learningTasks).sort((a, b) => b.value - a.value);
  return {
    totalTasksCompleted: week.workTasks.filter((task) => task.status === "Completed").length + week.learningTasks.filter((task) => task.status === "Done").length,
    totalHoursWorked: minutesToHours(sum(week.workTasks.map((task) => task.actualMinutes))),
    totalHoursLearned: minutesToHours(sum(week.learningTasks.map((task) => task.actualMinutes))),
    mostProductiveDay: sorted[0]?.day || "No data",
    leastProductiveDay: sorted[sorted.length - 1]?.day || "No data",
    topProjectByTime: projects[0]?.name || "No project yet",
    topSkillByTime: skillCats[0]?.name || "No skill yet",
    pendingCarryForwardTasks: week.workTasks.filter((task) => task.status !== "Completed").map((task) => task.title)
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function groupSum<T>(items: T[], key: (item: T) => string, value: (item: T) => number) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const group = key(item);
    acc[group] = (acc[group] || 0) + value(item);
    return acc;
  }, {});
}

function groupCount<T>(items: T[], key: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const group = key(item);
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});
}
