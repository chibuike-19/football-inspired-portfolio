import type { Position, YearMonth } from "@/content/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatYearMonth(value: YearMonth): string {
  const [year, month] = value.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatRange(position: Pick<Position, "start" | "end">): string {
  const end = position.end ? formatYearMonth(position.end) : "Present";
  return `${formatYearMonth(position.start)} – ${end}`;
}
