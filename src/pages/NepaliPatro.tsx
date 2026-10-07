import { useMemo, useState } from "react";
import {
  BS_MAX_YEAR,
  BS_MIN_YEAR,
  buildMonthGrid,
  bsToString,
  bsWeekday,
  formatAdDate,
  formatAdDay,
  formatBsDate,
  formatBsDateNepali,
  monthName,
  shiftMonth,
  toNepaliDigits,
  todayBS,
  weekdayName,
  type CalendarCell,
  type MonthView,
} from "../lib/nepaliDate";
import {
  eventsFor,
  eventsForMonth,
  type PatroEventType,
} from "../lib/nepaliEvents";

const YEARS = Array.from(
  { length: BS_MAX_YEAR - BS_MIN_YEAR + 1 },
  (_, index) => BS_MIN_YEAR + index,
);

const EVENT_BADGE: Record<
  PatroEventType,
  { label: string; className: string }
> = {
  "public-holiday": {
    label: "Holiday",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300",
  },
  festival: {
    label: "Festival",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
  },
  observance: {
    label: "Observance",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  },
};

const cellBsDate = (cell: CalendarCell) => bsToString(cell.bs);

const NepaliPatro = () => {
  const today = todayBS();
  const [view, setView] = useState<MonthView>({ year: today.year, month: today.month });
  const [selectedDay, setSelectedDay] = useState<number | null>(today.day);

  const grid = useMemo(() => buildMonthGrid(view.year, view.month), [view]);
  const previous = shiftMonth(view, -1);
  const next = shiftMonth(view, 1);

  const monthEvents = useMemo(
    () =>
      eventsForMonth(view.year, view.month).flatMap(({ bsDate, day, events }) =>
        events.map((event) => ({ bsDate, day, event })),
      ),
    [view],
  );

  const selected: CalendarCell | undefined = grid.cells.find(
    (cell) => cell.inMonth && cell.bs.day === selectedDay,
  );

  const selectedEvents = selected ? eventsFor(cellBsDate(selected)) : [];

  const goToToday = () => {
    setView({ year: today.year, month: today.month });
    setSelectedDay(today.day);
  };

  const controlClass =
    "rounded-md border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nepali Patro</h1>
          <p className="mt-2 text-gray-600">Bikram Sambat calendar with English dates.</p>
        </div>
        <button
          type="button"
          onClick={goToToday}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Today
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => previous && setView(previous)}
              disabled={!previous}
              className={controlClass}
              aria-label="Previous month"
            >
              ‹
            </button>

            <select
              value={view.month}
              onChange={(e) => setView({ ...view, month: Number(e.target.value) })}
              className="rounded-md border bg-white px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label="Month"
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index} value={index}>
                  {monthName(index)} · {monthName(index, false, true)}
                </option>
              ))}
            </select>

            <select
              value={view.year}
              onChange={(e) => setView({ ...view, year: Number(e.target.value) })}
              className="rounded-md border bg-white px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label="Year"
            >
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year} BS
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => next && setView(next)}
              disabled={!next}
              className={`${controlClass} ml-auto`}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xl font-bold text-gray-900">
              {monthName(view.month)} {view.year}
            </p>
            <p className="text-sm text-gray-500">
              {toNepaliDigits(`${monthName(view.month, false, true)} ${view.year}`)}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="pb-1 text-center text-xs font-semibold text-gray-500">
                <span className="block">{weekdayName(index, true)}</span>
                <span className="block text-[10px] font-normal text-gray-400">
                  {weekdayName(index, true, true)}
                </span>
              </div>
            ))}

            {grid.cells.map((cell, index) => {
              const weekend = index % 7 === 0 || index % 7 === 6;
              const isSelected = selectedDay === cell.bs.day && cell.inMonth;

              const cellEvents = cell.inMonth ? eventsFor(cellBsDate(cell)) : [];
              const holiday = cellEvents.some(
                (event) => event.type === "public-holiday",
              );
              const eventNames = cellEvents.map((event) => event.name).join(", ");
              const screenReaderText = cellEvents
                .map((event) => `${event.name} (${event.type.replace("-", " ")})`)
                .join(", ");

              const dayColor = cell.isToday
                ? "text-white"
                : !cell.inMonth
                  ? "text-gray-300"
                  : weekend || holiday
                    ? "text-red-600"
                    : "text-gray-800";

              const subColor = cell.isToday
                ? "text-blue-100"
                : !cell.inMonth
                  ? "text-gray-300"
                  : "text-gray-400";

              const dotClass = cell.isToday
                ? holiday
                  ? "bg-white dark:bg-white"
                  : "bg-amber-200 dark:bg-amber-200"
                : holiday
                  ? "bg-red-500 dark:bg-red-400"
                  : "bg-amber-500 dark:bg-amber-400";

              const tooltip =
                [cell.ad ? formatAdDate(cell.ad) : "", eventNames]
                  .filter(Boolean)
                  .join(" · ") || undefined;

              return (
                <button
                  key={`${cell.bs.year}-${cell.bs.month}-${cell.bs.day}-${index}`}
                  type="button"
                  onClick={() => setSelectedDay(cell.bs.day)}
                  title={tooltip}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-lg px-1 transition sm:min-h-16 ${cell.isToday
                      ? "bg-blue-600 shadow-sm"
                      : isSelected
                        ? "bg-blue-50 ring-2 ring-blue-400"
                        : cell.inMonth
                          ? "hover:bg-blue-50"
                          : "bg-gray-50 hover:bg-gray-100"
                    }`}
                >
                  <span className={`text-base font-semibold ${dayColor}`}>{cell.bs.day}</span>
                  <span className={`text-[10px] leading-tight ${subColor}`}>
                    {cell.ad ? formatAdDay(cell.ad) : ""}
                  </span>
                  {cellEvents.length > 0 && (
                    <>
                      <span
                        aria-hidden="true"
                        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`}
                      />
                      <span className="sr-only">{screenReaderText}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            This month's events
          </p>
          {monthEvents.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              No events this month
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
              {monthEvents.map(({ bsDate, day, event }) => (
                <li key={`${bsDate}-${event.name}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-2 py-2 text-left hover:bg-blue-50 dark:hover:bg-gray-700"
                  >
                    <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {day}
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {event.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {event.nameNe}
                    </span>
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${EVENT_BADGE[event.type].className}`}
                    >
                      {EVENT_BADGE[event.type].label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="h-fit rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Selected date
          </p>
          {selected ? (
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {formatBsDate(cellBsDate(selected))}
                </p>
                <p className="text-sm text-gray-600">
                  {toNepaliDigits(formatBsDateNepali(cellBsDate(selected)))}
                </p>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  English date
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  {selected.ad ? formatAdDate(selected.ad) : "—"}
                </p>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Day
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  {weekdayName(bsWeekday(cellBsDate(selected)))}
                </p>
                <p className="text-sm text-gray-500">
                  {weekdayName(bsWeekday(cellBsDate(selected)), false, true)}
                </p>
              </div>

              {selectedEvents.length > 0 && (
                <div className="border-t pt-3 dark:border-gray-700">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Events
                  </p>
                  <ul className="mt-2 space-y-2">
                    {selectedEvents.map((event) => (
                      <li
                        key={event.name}
                        className="flex flex-wrap items-baseline justify-between gap-x-2"
                      >
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {event.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {event.nameNe}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Tap a date for details.</p>
          )}
        </aside>
      </div>
    </section>
  );
};

export default NepaliPatro;
