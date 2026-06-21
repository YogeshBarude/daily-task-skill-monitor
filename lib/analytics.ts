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

export function dashboardMetrics(data: AppData, weekStartInput: string) {
  const week = scopedWeekData(data, weekStartInput);
  return {
    totalWorkHours: minutesToHours(sum(week.workTasks.map((task) => task.estimatedMinutes))),
    totalLearningHours: minutesToHours(sum(week.learningTasks.filter((task) => task.status === "Done").map((task) => task.plannedMinutes))),
    completedWorkTasks: week.workTasks.filter((task) => task.status === "Completed").length,
    pendingWorkTasks: week.workTasks.filter((task) => task.status !== "Completed").length
  };
}

export function dailySeries(data: AppData, weekStartInput: string) {
  const days = weekDays(new Date(`${weekStartInput}T00:00:00`));
  return days.map((day) => {
    const work = sum(data.workTasks.filter((task) => task.assignedDate === day.input).map((task) => task.estimatedMinutes));
    const learning = sum(data.learningTasks.filter((task) => task.plannedDate === day.input && task.status === "Done").map((task) => task.plannedMinutes));
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
  return Object.entries(groupSum(workTasks, (task) => task.projectName || "Unassigned", (task) => task.estimatedMinutes)).map(([name, minutes]) => ({
    name,
    value: minutesToHours(minutes)
  }));
}

export function skillCategoryDistribution(skills: Skill[], learningTasks: LearningTask[]) {
  const skillById = new Map(skills.map((skill) => [skill.id, skill]));
  const grouped = groupSum(
    learningTasks,
    (task) => skillById.get(task.skillId)?.category || "Other",
    (task) => task.status === "Done" ? task.plannedMinutes : 0
  );
  return Object.entries(grouped).map(([name, minutes]) => ({ name, value: minutesToHours(minutes) }));
}

export function autoWeeklySummary(data: AppData, weekStartInput: string) {
  const week = scopedWeekData(data, weekStartInput);
  const days = dailySeries(data, weekStartInput);
  const sorted = [...days].sort((a, b) => b.workHours + b.learningHours - (a.workHours + a.learningHours));
  const projects = projectDistribution(week.workTasks).sort((a, b) => b.value - a.value);
  const skillCats = skillCategoryDistribution(week.skills, week.learningTasks).sort((a, b) => b.value - a.value);
  return {
    totalTasksCompleted: week.workTasks.filter((task) => task.status === "Completed").length + week.learningTasks.filter((task) => task.status === "Done").length,
    totalHoursWorked: minutesToHours(sum(week.workTasks.map((task) => task.estimatedMinutes))),
    totalHoursLearned: minutesToHours(sum(week.learningTasks.filter((task) => task.status === "Done").map((task) => task.plannedMinutes))),
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
