/**
 * Festival / holiday data for the Nepali Patro calendar.
 *
 * KEY FORMAT: every key of PATRO_EVENTS must be the exact output of
 * bsToString() from "./nepaliDate" — a Bikram Sambat date in "YYYY-MM-DD"
 * with zero-padded month and day, e.g. "2083-06-21" (Ashwin 21, 2083 BS).
 *
 * DATA SOURCE: generated from nepalicalendar.rat32.com (the upstream of
 * the-value-crew/nepali-calendar-api) by `npm run events:generate` — do NOT
 * hand-edit generated year files. Each year lives in ./events/<year>.ts.
 *
 * HOW TO ADD A NEW YEAR:
 *   npm run events:generate <bsYear>
 * This scrapes the source, validates against the nepali-date-library, caches
 * raw JSON under data/raw/<bsYear>/, and writes src/lib/events/<bsYear>.ts.
 * Offline re-run is possible once data/raw/<bsYear>/ exists.
 */

import { PATRO_EVENTS_2083 } from "./events/2083";

export type PatroEventType = "public-holiday" | "festival" | "observance";

export type PatroEvent = {
  name: string;
  nameNe: string;
  type: PatroEventType;
};

export const PATRO_EVENTS: Record<string, PatroEvent[]> = {
  ...PATRO_EVENTS_2083,
};

export function eventsFor(bsDate: string): PatroEvent[] {
  return PATRO_EVENTS[bsDate] ?? [];
}

export function isHoliday(bsDate: string): boolean {
  return eventsFor(bsDate).some((event) => event.type === "public-holiday");
}

export function eventsForMonth(
  year: number,
  month: number,
): { bsDate: string; day: number; events: PatroEvent[] }[] {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;

  return Object.keys(PATRO_EVENTS)
    .filter((bsDate) => bsDate.startsWith(prefix))
    .map((bsDate) => ({
      bsDate,
      day: Number(bsDate.slice(8, 10)),
      events: PATRO_EVENTS[bsDate],
    }))
    .filter((entry) => entry.events.length > 0 && entry.day >= 1 && entry.day <= 32)
    .sort((a, b) => a.day - b.day);
}
