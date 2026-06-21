import { addDays, format, parseISO } from "date-fns";
import { WorkTask } from "./types";

export const sprintColumns = ["Project", "Task", "Product Owner", "Priority", "Assigned Date", "Due Date", "Status"];

export function tasksForSprint(tasks: WorkTask[], weekStart: string) {
  const start = parseISO(weekStart);
  const end = addDays(start, 6);
  return tasks
    .filter((task) => {
      const assigned = parseISO(task.assignedDate);
      return assigned >= start && assigned <= end;
    })
    .sort((a, b) => a.projectName.localeCompare(b.projectName) || a.dueDate.localeCompare(b.dueDate));
}

export function sprintCsv(tasks: WorkTask[]) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [
    sprintColumns.join(","),
    ...tasks.map((task) => [
      task.projectName,
      task.title,
      task.productOwner,
      task.priority,
      task.assignedDate,
      task.dueDate,
      task.status
    ].map(escape).join(","))
  ].join("\n");
}

export function sprintShareText(tasks: WorkTask[], weekStart: string) {
  const end = format(addDays(parseISO(weekStart), 6), "dd MMM yyyy");
  const start = format(parseISO(weekStart), "dd MMM yyyy");
  const lines = tasks.map((task, index) =>
    `${index + 1}. ${task.projectName} | ${task.title} | PO: ${task.productOwner} | ${task.priority} priority | Assigned: ${task.assignedDate} | Due: ${task.dueDate} | ${task.status}`
  );
  return `Sprint Plan: ${start} - ${end}\n\n${lines.join("\n")}`;
}
