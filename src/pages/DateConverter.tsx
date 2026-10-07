import { useState } from "react";
import {
  AD_MAX_DATE,
  AD_MIN_DATE,
  BS_MAX_YEAR,
  BS_MIN_YEAR,
  adWeekday,
  bsWeekday,
  formatAdDate,
  formatBsDate,
  formatBsDateNepali,
  toAD,
  toBS,
  todayAD,
  todayBS,
  weekdayName,
} from "../lib/nepaliDate";

type Mode = "bs-to-ad" | "ad-to-bs";

const formatDigits = (digits: string) => {
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

const toParts = (digits: string) =>
  `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;

const DateConverter = () => {
  const [mode, setMode] = useState<Mode>("bs-to-ad");
  const [digits, setDigits] = useState("");

  const complete = digits.length === 8;
  const sourceDate = complete ? toParts(digits) : "";
  const resultDate = complete
    ? mode === "bs-to-ad"
      ? toAD(sourceDate)
      : toBS(sourceDate)
    : null;

  const error =
    complete && resultDate === null
      ? mode === "bs-to-ad"
        ? `Invalid date. Supported BS range: ${BS_MIN_YEAR} - ${BS_MAX_YEAR}`
        : `Invalid date. Supported AD range: ${AD_MIN_DATE} to ${AD_MAX_DATE}`
      : null;

  const changeMode = (next: Mode) => {
    if (next === mode) return;
    if (resultDate) {
      setDigits(resultDate.replace(/-/g, ""));
    }
    setMode(next);
  };

  const setToday = () => {
    setDigits(
      (mode === "bs-to-ad"
        ? `${todayBS().year}${String(todayBS().month + 1).padStart(2, "0")}${String(todayBS().day).padStart(2, "0")}`
        : todayAD().replace(/-/g, "")
      ).replace(/\D/g, ""),
    );
  };

  const sourceLabel =
    mode === "bs-to-ad" ? "Bikram Sambat (BS)" : "English / Anno Domini (AD)";
  const resultLabel =
    mode === "bs-to-ad" ? "English (AD) result" : "Bikram Sambat (BS) result";

  const bsValue = mode === "bs-to-ad" ? sourceDate : resultDate;
  const adValue = mode === "bs-to-ad" ? resultDate : sourceDate;

  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-3xl font-bold text-gray-900">BS ↔ AD Date Converter</h1>
      <p className="mt-2 text-gray-600">
        Convert between Bikram Sambat (Nepali) and Gregorian (English) dates.
      </p>

      <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeMode("bs-to-ad")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              mode === "bs-to-ad"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            BS → AD
          </button>
          <button
            type="button"
            onClick={() => changeMode("ad-to-bs")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              mode === "ad-to-bs"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            AD → BS
          </button>
          <button
            type="button"
            onClick={() => changeMode(mode === "bs-to-ad" ? "ad-to-bs" : "bs-to-ad")}
            title="Swap direction"
            className="ml-auto rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ⇄ Swap
          </button>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">{sourceLabel}</label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={formatDigits(digits)}
              placeholder="YYYY-MM-DD"
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg tracking-widest focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="button"
              onClick={setToday}
              className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDigits("")}
              className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            {resultLabel}
          </p>
          {resultDate ? (
            <div className="mt-2 space-y-1">
              <p className="text-2xl font-bold text-gray-900">
                {mode === "bs-to-ad" ? formatAdDate(resultDate) : formatBsDate(resultDate)}
              </p>
              <p className="text-sm text-gray-600">
                {resultDate} ·{" "}
                {weekdayName(
                  mode === "bs-to-ad" ? adWeekday(resultDate) : bsWeekday(resultDate),
                )}
              </p>
              <p className="text-sm text-gray-500">
                {mode === "bs-to-ad"
                  ? formatBsDate(sourceDate)
                  : formatBsDateNepali(resultDate)}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              {error ? "No conversion for this date." : "Enter a full date to see the conversion."}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              BS date
            </p>
            <p className="mt-1 font-mono text-lg text-gray-800">{bsValue || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              AD date
            </p>
            <p className="mt-1 font-mono text-lg text-gray-800">{adValue || "—"}</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Supported range: {BS_MIN_YEAR}–{BS_MAX_YEAR} BS ({AD_MIN_DATE} to {AD_MAX_DATE} AD)
      </p>
    </section>
  );
};

export default DateConverter;
