import {
  ADtoBS,
  BStoAD,
  NepaliDate,
  NEPALI_DATE_MAP,
  NUMBER_NP,
} from "nepali-date-library";

export type BsParts = { year: number; month: number; day: number };

export type MonthView = { year: number; month: number };

export type CalendarCell = {
  bs: BsParts;
  ad: string | null;
  inMonth: boolean;
  isToday: boolean;
};

export type MonthGrid = {
  cells: CalendarCell[];
  daysInMonth: number;
};

const AD_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const AD_MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const BS_MIN_YEAR = NEPALI_DATE_MAP[0].year;
export const BS_MAX_YEAR =
  NEPALI_DATE_MAP[NEPALI_DATE_MAP.length - 1].year;

const pad = (value: number) => String(value).padStart(2, "0");

const safeToAd = (bsDate: string): string | null => {
  try {
    return BStoAD(bsDate);
  } catch {
    return null;
  }
};

export const AD_MIN_DATE = safeToAd(`${BS_MIN_YEAR}-01-01`) ?? "";
export const AD_MAX_DATE = safeToAd(`${BS_MAX_YEAR}-12-31`) ?? "";

export function toBS(adDate: string): string | null {
  if (!adDate) return null;
  try {
    return ADtoBS(adDate);
  } catch {
    return null;
  }
}

export function toAD(bsDate: string): string | null {
  if (!bsDate) return null;
  try {
    return BStoAD(bsDate);
  } catch {
    return null;
  }
}

export function todayBS(): BsParts {
  const today = new NepaliDate();
  return {
    year: today.getYear(),
    month: today.getMonth(),
    day: today.getDate(),
  };
}

export function todayAD(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function bsToString(parts: BsParts): string {
  return `${parts.year}-${pad(parts.month + 1)}-${pad(parts.day)}`;
}

export function formatBsDate(bsDate: string): string {
  const [year, month, day] = bsDate.split("-").map(Number);
  if (!year || !month || !day) return "";
  return `${NepaliDate.getMonthName(month - 1)} ${day}, ${year}`;
}

export function formatAdDate(adDate: string): string {
  const [year, month, day] = adDate.split("-").map(Number);
  if (!year || !month || !day) return "";
  return `${AD_MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

export function formatAdDay(adDate: string): string {
  const [year, month, day] = adDate.split("-").map(Number);
  if (!year || !month || !day) return "";
  if (day === 1) return `${AD_MONTH_SHORT[month - 1]} 1`;
  return String(day);
}

export function toNepaliDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => NUMBER_NP[Number(digit)] ?? digit);
}

export function formatBsDateNepali(bsDate: string): string {
  const [year, month, day] = bsDate.split("-").map(Number);
  if (!year || !month || !day) return "";
  return `${NepaliDate.getMonthName(month - 1, false, true)} ${day}, ${year}`;
}

export function bsWeekday(bsDate: string): number {
  return new NepaliDate(bsDate).getDay();
}

export function adWeekday(adDate: string): number {
  const [year, month, day] = adDate.split("-").map(Number);
  if (!year || !month || !day) return 0;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function weekdayName(day: number, short = false, nepali = false): string {
  return NepaliDate.getDayName(day, short, nepali);
}

export function monthName(month: number, short = false, nepali = false): string {
  return NepaliDate.getMonthName(month, short, nepali);
}

export function buildMonthGrid(year: number, month: number): MonthGrid {
  const calendar = NepaliDate.getCalendarDays(year, month);
  const today = todayBS();
  const cells: CalendarCell[] = [];

  const push = (
    cellYear: number,
    cellMonth: number,
    day: number,
    inMonth: boolean,
  ) => {
    const bs = { year: cellYear, month: cellMonth, day };
    cells.push({
      bs,
      ad: safeToAd(`${cellYear}-${pad(cellMonth + 1)}-${pad(day)}`),
      inMonth,
      isToday:
        today.year === cellYear && today.month === cellMonth && today.day === day,
    });
  };

  for (const day of calendar.prevMonth.days) {
    push(calendar.prevMonth.year, calendar.prevMonth.month, day, false);
  }
  for (const day of calendar.currentMonth.days) {
    push(year, month, day, true);
  }
  for (const day of calendar.nextMonth.days) {
    push(calendar.nextMonth.year, calendar.nextMonth.month, day, false);
  }

  return {
    cells,
    daysInMonth: calendar.currentMonth.days.length,
  };
}

export function shiftMonth(view: MonthView, delta: number): MonthView | null {
  const total = view.year * 12 + view.month + delta;
  const year = Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  if (year < BS_MIN_YEAR || year > BS_MAX_YEAR) return null;
  return { year, month };
}
