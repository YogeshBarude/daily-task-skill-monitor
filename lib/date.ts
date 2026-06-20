import { addDays, endOfWeek, format, isWithinInterval, parseISO, startOfWeek } from "date-fns";

export function toDateInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function weekBounds(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end, startInput: toDateInput(start), endInput: toDateInput(end) };
}

export function weekDays(date = new Date()) {
  const { start } = weekBounds(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(start, index);
    return {
      date: day,
      input: toDateInput(day),
      dayName: format(day, "EEEE"),
      label: format(day, "EEE, MMM d")
    };
  });
}

export function isInWeek(dateInput: string, weekStartInput: string) {
  const start = parseISO(weekStartInput);
  const end = endOfWeek(start, { weekStartsOn: 1 });
  return isWithinInterval(parseISO(dateInput), { start, end });
}

export function minutesToHours(minutes: number) {
  return Math.round((minutes / 60) * 10) / 10;
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}
