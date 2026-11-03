import { useMemo, useState } from "react";
import {
  buildMonthGrid,
  bsToString,
  formatAdDay,
  formatAdDate,
  monthName,
  shiftMonth,
  toNepaliDigits,
  todayBS,
  toAD,
  type CalendarCell,
  type MonthView,
} from "../lib/nepaliDate";
import {
  eventsFor,
  eventsForMonth,
} from "../lib/nepaliEvents";

const WEEKDAYS = ["आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहिवार", "शुक्रवार", "शनिवार"];

const cellBsDate = (cell: CalendarCell) => bsToString(cell.bs);

const NepaliPatro = () => {
  const today = todayBS();
  const [view, setView] = useState<MonthView>({ year: today.year, month: today.month });

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

  const goToToday = () => {
    setView({ year: today.year, month: today.month });
  };

  const getAdMonthSpan = (cells: CalendarCell[]) => {
    const inMonthCells = cells.filter(c => c.inMonth && c.ad);
    if (inMonthCells.length === 0) return "";
    const firstAdDate = inMonthCells[0].ad!;
    const lastAdDate = inMonthCells[inMonthCells.length - 1].ad!;
    const [y1, m1] = firstAdDate.split("-").map(Number);
    const [y2, m2] = lastAdDate.split("-").map(Number);
    
    const m1Name = new Date(y1, m1 - 1, 1).toLocaleString('en-US', { month: 'short' });
    const m2Name = m1 === m2 ? "" : `/${new Date(y2, m2 - 1, 1).toLocaleString('en-US', { month: 'short' })}`;
    const yDisplay = y1 === y2 ? y1 : `${y1}/${y2}`;
    
    return `${m1Name}${m2Name} ${yDisplay}`;
  };

  const adMonthSpanText = useMemo(() => getAdMonthSpan(grid.cells), [grid.cells]);

  return (
    <section className="mx-auto max-w-350 px-2 sm:px-4 py-4 sm:py-8 flex flex-col lg:flex-row gap-4 sm:gap-6 bg-[#f4f5f7] min-h-screen font-sans">
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 sm:pb-6 mb-2 sm:mb-4 gap-3">
          <div className="flex items-baseline gap-2 sm:gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              {monthName(view.month, false, true)} {toNepaliDigits(view.year)}
            </h1>
            <button className="flex items-center gap-1 text-[11px] sm:text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              {monthName(view.month)} - {adMonthSpanText}
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-end w-full sm:w-auto gap-3">
            <button
              onClick={goToToday}
              className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold text-white bg-[#a81c1c] rounded shadow-sm hover:bg-red-800 transition-colors"
            >
              आज
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => previous && setView(previous)}
                disabled={!previous}
                className="p-1.5 sm:p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => next && setView(next)}
                disabled={!next}
                className="p-1.5 sm:p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="border border-gray-200 rounded-sm overflow-hidden bg-white">
          <div className="grid grid-cols-7 bg-white">
            {WEEKDAYS.map((day, index) => (
              <div
                key={index}
                className={`py-2 sm:py-3 text-center text-[10px] sm:text-sm font-bold border-r border-b last:border-r-0 border-gray-200 ${
                  index === 0 || index === 6 ? "text-[#a81c1c]" : "text-gray-700"
                }`}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 1)}</span>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 bg-gray-200 gap-px">
            {grid.cells.map((cell, index) => {
              const weekend = index % 7 === 0 || index % 7 === 6;
              const cellEvents = cell.inMonth ? eventsFor(cellBsDate(cell)) : [];
              const holiday = cellEvents.some((event) => event.type === "public-holiday");
              const festival = cellEvents.some((event) => event.type === "festival");
              const isRedDay = weekend || holiday || festival;

              return (
                <div
                  key={`${cell.bs.year}-${cell.bs.month}-${cell.bs.day}-${index}`}
                  className={`relative flex flex-col min-h-17.5 sm:min-h-27.5 p-1 sm:p-2 bg-white ${
                    cell.isToday ? "bg-[#276e48]" : ""
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className={`text-[9px] sm:text-[10px] w-full text-center px-3 sm:px-5 line-clamp-2 leading-[1.1] font-medium pt-0.5 sm:pt-1 min-h-5.5 sm:min-h-6.5 ${
                      cell.isToday ? "text-green-50" : isRedDay ? "text-[#a81c1c]" : "text-gray-500"
                    }`}
                    title={cell.inMonth && cellEvents.length > 0 ? cellEvents.map((e) => e.nameNe).join(" / ") : ""}>
                      {cell.inMonth && cellEvents.length > 0
                        ? cellEvents.map((e) => e.nameNe).join(" / ")
                        : ""}
                    </div>
                    {cell.inMonth && cell.ad && (
                      <span className={`absolute top-1 sm:top-2 right-1.5 sm:right-2 text-[10px] sm:text-xs font-semibold ${
                        cell.isToday ? "text-green-50" : "text-gray-500"
                      }`}>
                        {formatAdDay(cell.ad)}
                      </span>
                    )}
                  </div>
                  
                  <div className={`grow flex flex-col items-center justify-center text-2xl sm:text-4xl font-bold mt-0.5 sm:mt-1 ${
                    !cell.inMonth 
                      ? "text-gray-300" 
                      : cell.isToday
                        ? "text-white"
                        : isRedDay
                          ? "text-[#a81c1c]"
                          : "text-gray-800"
                  }`}>
                    {toNepaliDigits(cell.bs.day)}
                  </div>

                  <div className={`text-center text-[10px] sm:text-xs pb-1 font-medium ${
                    cell.isToday ? "text-green-100" : isRedDay ? "text-red-400" : "text-gray-400"
                  }`}>
                    {/* Placeholder for Tithi since we don't have exact Tithi data */}
                    {cell.inMonth ? "प्रतिपदा" : ""} 
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[320px] xl:w-105 bg-[#fbf5f5] rounded-lg shadow-sm border border-red-100 overflow-hidden flex flex-col h-125 lg:h-[calc(100vh-4rem)]">
        <div className="flex border-b border-red-100 bg-[#fbf5f5] sticky top-0 z-10 pt-2 px-2">
          <button className="flex-1 pb-3 text-[15px] font-bold text-[#a81c1c] border-b-[3px] border-[#a81c1c]">
            पर्वहरू
          </button>
          <button className="flex-1 pb-3 text-[15px] font-bold text-gray-500 hover:text-gray-700 border-b-[3px] border-transparent">
            साइतहरू
          </button>
          <button className="flex-1 pb-3 text-[15px] font-bold text-gray-500 hover:text-gray-700 border-b-[3px] border-transparent">
            आगामी बिदा
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="text-[13px] font-bold text-[#a81c1c] mb-2 px-2">आज</div>
          
          <div className="space-y-0 divide-y divide-gray-200">
            {monthEvents.map(({ bsDate, day, event }, i) => {
              const adDate = toAD(bsDate);
              const adDateFormatted = adDate ? formatAdDate(adDate) : "";
              
              return (
                <div key={`${bsDate}-${i}`} className="py-4 px-2 flex gap-4 items-center group hover:bg-red-50/50 transition-colors">
                  <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                    <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${event.nameNe}&backgroundColor=f8d7da`} alt="Icon" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-gray-900 group-hover:text-[#a81c1c] transition-colors">{event.nameNe}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {event.type === 'public-holiday' ? 'सार्वजनिक बिदा' : (event.type === 'festival' ? 'चाडपर्व' : 'विविध')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-bold text-gray-900">
                      {toNepaliDigits(day)} {monthName(view.month, true, true)}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {adDateFormatted && adDateFormatted.split(",")[0]}
                    </div>
                  </div>
                </div>
              );
            })}
            {monthEvents.length === 0 && (
              <div className="py-8 text-center text-gray-500 text-sm">
                कुनै पर्व छैन
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NepaliPatro;
