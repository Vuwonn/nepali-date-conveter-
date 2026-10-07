import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ndl = require("nepali-date-library") as {
  BStoAD(bsDate: string): string;
  NEPALI_DATE_MAP: { year: number; days: number[] }[];
  NepaliDate: new (bsDate?: string) => { getDay(): number };
};

const getCalendarDays = (year: number, month0: number) => {
  const row = ndl.NEPALI_DATE_MAP.find((entry) => entry.year === year);
  return row ? row.days[month0] : 0;
};
const toAD = (bsDate: string): string | null => {
  try {
    return ndl.BStoAD(bsDate);
  } catch {
    return null;
  }
};
const bsWeekday = (bsDate: string): number => new ndl.NepaliDate(bsDate).getDay();

const RAT32_URL = "https://nepalicalendar.rat32.com/index_nep.php";
const RAT32_SOURCE = "nepalicalendar.rat32.com (source of the-value-crew/nepali-calendar-api, scraper scrapper_v1.js)";

type Opts = { year: number; force: boolean };

function parseOpts(argv: string[]): Opts {
  const year = Number(argv[0] ?? 2083);
  const force = argv.includes("--force");
  return { year, force };
}

const NP_DIGITS: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
};

const npToEn = (s: string): string =>
  s.replace(/[०-९]/g, (d) => NP_DIGITS[d] ?? d);

const stripHtml = (s: string): string =>
  s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const pad = (n: number): string => String(n).padStart(2, "0");

async function fetchMonthHtml(year: number, month: number): Promise<string> {
  const res = await fetch(RAT32_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `selYear=${year}&selMonth=${month}&viewCalander=View+Calander`,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${year}/${month}`);
  }
  return await res.text();
}

function grabCellPart(chunk: string, id: string): string | null {
  const m = chunk.match(new RegExp(`<div id="${id}"[^>]*>([\\s\\S]*?)</div>`));
  return m ? m[1] : null;
}

type RawDay = { n: string; e: string; t: string; f: string; h: boolean; d: number };

function parseDays(html: string): RawDay[] {
  const parts = html.split('<div class="cells"');
  const days: RawDay[] = [];
  parts.forEach((chunk, index) => {
    if (index === 0) return;
    if (!chunk.includes('id="nday"')) return;
    const colorMatch = chunk.match(/<font color=['"]([^'"]+)['"]/i);
    days.push({
      n: stripHtml(grabCellPart(chunk, "nday") ?? ""),
      e: stripHtml(grabCellPart(chunk, "eday") ?? ""),
      t: stripHtml(grabCellPart(chunk, "dashi") ?? ""),
      f: stripHtml(grabCellPart(chunk, "fest") ?? ""),
      h: (colorMatch?.[1] ?? "black").toLowerCase() === "red",
      d: ((index - 1) % 7) + 1,
    });
  });
  return days;
}

function parseHoliFest(html: string): { lines: string[]; redDays: number[] } {
  const table = html.match(/<div id="holiC">([\s\S]*?)<\/table>/i)?.[1];
  if (!table) return { lines: [], redDays: [] };
  const lines: string[] = [];
  const redDays: number[] = [];
  for (const m of table.matchAll(/<tr[^>]*class=['"]([^'"]*bigFont[^'"]*)['"][^>]*>([\s\S]*?)<\/tr>/g)) {
    const cls = m[1] ?? "";
    const tds = [...m[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((td) => stripHtml(td[1]));
    if (tds.length < 2) continue;
    const day = tds[0].replace(/\s/g, "");
    if (!npToEn(day).match(/^\d+$/)) continue;
    lines.push(`${day} गते ${tds[1]}`);
    if (/\bred\b/.test(cls)) redDays.push(Number(npToEn(day)));
  }
  return { lines, redDays };
}

function sectionText(html: string, id: string): string {
  const m = html.match(new RegExp(`<div id="${id}">([\\s\\S]*?)(?:<div id=|$)`, "i"));
  return m ? stripHtml(m[1]) : "";
}

type RawMonth = {
  metadata: { en: string; np: string };
  days: RawDay[];
  holiFest: string[];
  holiRedDays: number[];
  marriage: string[];
  bratabandha: string[];
};

function parseMonth(html: string): RawMonth {
  const metadata = {
    en: stripHtml(html.match(/<span id="entarikYr"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? ""),
    np: stripHtml(html.match(/<span id="yren"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? ""),
  };
  const { lines, redDays } = parseHoliFest(html);
  return {
    metadata,
    days: parseDays(html),
    holiFest: lines,
    holiRedDays: redDays,
    marriage: sectionText(html, "bibah").split("\n").map((s) => s.trim()).filter(Boolean),
    bratabandha: sectionText(html, "bratabandha").split("\n").map((s) => s.trim()).filter(Boolean),
  };
}

async function scrapeYear(opts: Opts): Promise<RawMonth[]> {
  const { year, force } = opts;
  mkdirSync(path.join("data", "raw", String(year)), { recursive: true });
  const months: RawMonth[] = [];
  for (let month = 1; month <= 12; month++) {
    const outPath = path.join("data", "raw", String(year), `${month}.json`);
    if (!force && existsSync(outPath)) {
      months.push(JSON.parse(readFileSync(outPath, "utf8")) as RawMonth);
      continue;
    }
    const html = await fetchMonthHtml(year, month);
    const raw = parseMonth(html);
    if (raw.days.length === 0 || raw.days.filter((d) => npToEn(d.n) !== "").length === 0) {
      throw new Error(`No daylight cells parsed for ${year}/${month} — site format may have changed`);
    }
    writeFileSync(outPath, JSON.stringify(raw, null, 2), "utf8");
    months.push(raw);
    console.log(`cached data/raw/${year}/${month}.json (${raw.days.length} cells)`);
  }
  return months;
}

type Occasion = { name: string; nameNe: string; type: "public-holiday" | "festival" | "observance" };

const OBSERVANCE_RE = /एकादशी|पूर्णिमा|पून्हि|पुन्हि|औंसी|औशी|संक्रान्ति|संक्रान्ती|संक्राति|अमावस्या/;

const EN_DICT: Array<[RegExp, string]> = [
  [/^नववर्ष २०८३ आरम्भ$/, "Nepali New Year (2083)"],
  [/^विजया दशमी$/, "Vijaya Dashami"],
  [/^दशैको टिका$/, "Dashain Tika"],
  [/^महाअष्टमी$/, "Maha Ashtami"],
  [/^महानवमी$/, "Maha Nawami"],
  [/^घटस्थापना$/, "Ghatasthapana"],
  [/^फूलपाती$/, "Fulpati"],
  [/^लक्ष्मी पूजा$/, "Laxmi Puja"],
  [/^भाइटीका$/, "Bhai Tika"],
  [/^कुकुर तिहार$/, "Kukur Tihar (Dog Tihar)"],
  [/^काग तिहार$/, "Kag Tihar (Crow Tihar)"],
  [/^गाई पूजा$/, "Gai Puja (Cow Puja)"],
  [/^गोवर्द्धन पूजा$/, "Govardhan Puja"],
  [/^म्हःपूजा$/, "Mha Puja"],
  [/^धन्तेरस$/, "Dhanteras"],
  [/^यमदीप दान$/, "Yamdeep Dan"],
  [/^नरक चतुर्दशी$/, "Narak Chaturdashi"],
  [/^छठपर्व$/, "Chhath Parva"],
  [/^कोजाग्रत पूर्णिमा$/, "Kojagrat Purnima"],
  [/^संविधान दिवस/, "Constitution Day"],
  [/^लोकतन्त्र दिवस$/, "Democracy Day"],
  [/^गणतन्त्र दिवस$/, "Republic Day"],
  [/^राष्ट्रिय प्रजातन्त्र दिवस$/, "National Democracy Day"],
  [/^सहिद दिवस$/, "Martyrs' Day"],
  [/^माघे संक्रान्ति$/, "Maghe Sankranti"],
  [/^माघी पर्व$/, "Maghi Parva"],
  [/^साउन संक्रान्ती$/, "Saun Sankranti"],
  [/^जनैपूर्णिमा$/, "Janai Purnima"],
  [/^रक्षाबन्धन$/, "Raksha Bandhan"],
  [/^गाईजात्रा/, "Gai Jatra"],
  [/^तीज/, "Teej"],
  [/^हरितालिका व्रत$/, "Hartalika Vrata"],
  [/^श्रीकृष्णजन्माष्टमी$/, "Krishna Janmashtami"],
  [/^इन्द्रजात्रा/, "Indra Jatra"],
  [/^कुमारी ईन्द्रजात्रा/, "Kumari Indra Jatra"],
  [/^विश्वकर्मा पूजा$/, "Vishwakarma Puja"],
  [/^नाग पञ्चमी/, "Naag Panchami"],
  [/^कुशे औँसी$/, "Kushe Aunsi (Father's Day)"],
  [/^बाबुको मुख हेर्ने दिन$/, "Father's Day (Babuko Mukh Herne)"],
  [/^मातातीर्थ औंसी$/, "Mata Tirtha Aunsi (Mother's Day)"],
  [/^आमाको मुख हेर्ने$/, "Mother's Day (Aamako Mukh Herne)"],
  [/^गुरू पूर्णिमा$/, "Guru Purnima"],
  [/^जितिया पर्व$/, "Jitiya Parva"],
  [/^तुलसी विवाह$/, "Tulsi Vivah"],
  [/^विवाह पञ्चमी$/, "Vivah Panchami"],
  [/^गुरूनानक जयन्ती/, "Guru Nanak Jayanti"],
  [/^क्रिसमस डे$/, "Christmas Day"],
  [/^तोल ल्होसार$/, "Tol Lhosar"],
  [/^सोनाम ल्होसार/, "Sonam Lhosar"],
  [/^तामाङ ल्होछार/, "Tamang Lhosar"],
  [/^वसन्तपञ्यमी$/, "Basant Panchami"],
  [/^सरस्वती पूजा/, "Saraswati Puja"],
  [/^होली$/, "Holi"],
  [/^रोपाइँ जात्रा$/, "Ropai Jatra (Rice Planting Festival)"],
  [/^पृथ्वी जयन्ती$/, "Prithvi Jayanti"],
  [/^राष्ट्रिय एकता दिवस$/, "National Unity Day"],
  [/^विश्व श्रमिक दिवस$/, "International Labour Day"],
  [/^विश्व जनसंख्या दिवस$/, "World Population Day"],
  [/^विश्व रेडियो दिवस$/, "World Radio Day"],
  [/^विश्व मानव अधिकार दिवस$/, "Human Rights Day"],
  [/^विश्व अपाङ्ग दिवस$/, "Intl. Day of Persons with Disabilities"],
  [/^राष्ट्रिय भूकम्प सुरक्षा दिवस$/, "National Earthquake Safety Day"],
  [/^राष्ट्रिय कृषि जैविक विविधता दिवस$/, "National Agricultural Biodiversity Day"],
  [/^राष्ट्रिय सूचना दिवस$/, "National Information Day"],
  [/^निर्वाचन दिवस$/, "Election Day"],
  [/^राष्ट्रिय कानुन दिवस$/, "National Law Day"],
  [/^शिवपार्वती विवाह$/, "Shiv-Parvati Vivah"],
  [/^अक्षय तृतीया$/, "Akshaya Tritiya"],
  [/^गौतमबुद्ध जयन्ती$/, "Buddha Jayanti"],
  [/^ईद-उल-अज्हा$/, "Eid-ul-Adha"],
  [/^पूर्णिमाव्रत$/, "Purnima Vrata"],
];

const enName = (nameNe: string): string => {
  const clean = nameNe.trim().replace(/:+$/u, "").trim();
  const hit = EN_DICT.find(([re]) => re.test(clean));
  return hit ? hit[1] : nameNe;
};

function splitNames(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  parts.push(cur);
  const merged: string[] = [];
  for (let part of parts.map((p) => p.trim())) {
    if (!part) continue;
    if (part.startsWith("(") && merged.length > 0) {
      merged[merged.length - 1] += ` ${part}`;
    } else {
      merged.push(part);
    }
  }
  return merged;
}

function coreCells(days: RawDay[]): RawDay[] {
  const seq = days.filter((c) => npToEn(c.n) !== "");
  let start = seq.findIndex((c) => Number(npToEn(c.n)) === 1);
  if (start < 0) return [];
  return seq.slice(start);
}

type Verify = {
  month: number;
  sourceDays: number;
  libraryDays: number;
  adMismatches: number;
  weekdayMismatches: number;
  satAllRed: boolean;
  redRows: string[];
};

function classify(part: string, isHoliday: boolean): Occasion["type"] {
  if (OBSERVANCE_RE.test(part)) return "observance";
  return isHoliday ? "public-holiday" : "festival";
}

function buildYear(year: number, months: RawMonth[]) {
  const events: Record<string, Occasion[]> = {};
  const notes: string[] = [];
  const verify: Verify[] = [];

  for (let mIndex = 0; mIndex < months.length; mIndex++) {
    const month = mIndex + 1;
    const raw = months[mIndex];

    const holi: Record<number, string> = {};
    for (const line of raw.holiFest) {
      const m = line.match(/^([०-९]+) गते (.*)$/);
      if (!m) continue;
      holi[Number(npToEn(m[1]))] = m[2];
    }

    const core = coreCells(raw.days);
    verify.push({
      month,
      sourceDays: core.length,
      libraryDays: getCalendarDays(year, mIndex),
      adMismatches: 0,
      weekdayMismatches: 0,
      satAllRed: true,
      redRows: [],
    });

    const saturdayCells = core.filter((c) => c.d === 7);
    const saturdayNotRed = saturdayCells.filter((c) => !c.h);
    if (saturdayNotRed.length > 0) {
      verify[mIndex].satAllRed = false;
    }

    for (const cell of core) {
      const day = Number(npToEn(cell.n));
      const bsDate = `${year}-${pad(month)}-${pad(day)}`;
      const v = verify[mIndex];

      const ad = toAD(bsDate);
      if (ad) {
        const adDay = Number(ad.split("-")[2]);
        const e = Number(cell.e);
        if (Number.isInteger(e) && adDay !== e) v.adMismatches += 1;
        const wd = bsWeekday(bsDate) + 1;
        if (wd !== cell.d) v.weekdayMismatches += 1;
      } else {
        v.adMismatches += 1;
      }

      const isRedHoliday = raw.holiRedDays.includes(day);
      const isHoliday = isRedHoliday || (cell.h && cell.d !== 7);

      const occasionText = holi[day] ?? cell.f ?? "";
      const occasionNames = splitNames(occasionText);

      if (occasionNames.length === 0) continue;
      const occasions: Occasion[] = occasionNames.map((nameNe) => ({
        name: enName(nameNe),
        nameNe,
        type: classify(nameNe, isHoliday),
      }));

      events[bsDate] = [...(events[bsDate] ?? []), ...occasions];
    }

    const redRows: string[] = [];
    for (const line of raw.holiFest) {
      const m = line.match(/^([०-९]+) गते (.*)$/);
      if (m && raw.holiRedDays.includes(Number(npToEn(m[1])))) {
        redRows.push(`${npToEn(m[1])}: ${m[2]}`);
      }
    }
    verify[mIndex].redRows = redRows;
  }

  return { events, verify, notes };
}

function sortedKeys(events: Record<string, Occasion[]>): string[] {
  return Object.keys(events).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

async function main() {
  const opts = parseOpts(process.argv.slice(2));
  const { year } = opts;

  console.log(`scraping ${year} BS from ${RAT32_URL}`);
  const months = await scrapeYear(opts);
  const { events, verify } = buildYear(year, months);
  const keys = sortedKeys(events);

  const outDir = path.join("src", "lib", "events");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${year}.ts`);

  const lines: string[] = [];
  lines.push(`/***`);
  lines.push(` * Year ${year} BS festival/holiday data — AUTO-GENERATED by scripts/generate-events.ts.`);
  lines.push(` * Source: ${RAT32_SOURCE}.`);
  lines.push(` * Regenerate with: npm run events:generate (year passed as first arg, --force to refetch).`);
  lines.push(` */`);
  lines.push(`import type { PatroEvent } from "../nepaliEvents";`);
  lines.push(``);
  lines.push(`export const PATRO_EVENTS_${year}: Record<string, PatroEvent[]> = {`);
  for (const key of keys) {
    const list = events[key]
      .map((o) => `    { name: ${JSON.stringify(o.name)}, nameNe: ${JSON.stringify(o.nameNe)}, type: "${o.type}" },`)
      .join("\n");
    lines.push(`  ${JSON.stringify(key)}: [`);
    lines.push(list);
    lines.push(`  ],`);
  }
  lines.push(`};`);
  writeFileSync(outPath, lines.join("\n"), "utf8");

  console.log(`\nwrote ${outPath} (${keys.length} dated event entries)`);
  console.log(`\n--- per-month verification (month 1-indexed: Baisakh..Chaitra) ---`);
  const monthNames = ["Baisakh", "Jestha", "Asar", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];
  const typeCounts = { "public-holiday": 0, festival: 0, observance: 0 };
  for (const list of Object.values(events)) {
    for (const o of list) typeCounts[o.type] += 1;
  }
  console.log(`type totals: holiday=${typeCounts["public-holiday"]} festival=${typeCounts.festival} observance=${typeCounts.observance}`);
  for (const v of verify) {
    const ls = v.libraryDays;
    const ds = v.sourceDays;
    console.log(
      `${pad(v.month)} ${monthNames[v.month - 1].padEnd(9)} sourceDays=${ds} libraryDays=${ls} ${ds === ls ? "OK" : "MISMATCH"} adMiss=${v.adMismatches} wdMiss=${v.weekdayMismatches} satAllRed=${v.satAllRed}`,
    );
    console.log(`  public holidays: ${v.redRows.length === 0 ? "(none)" : v.redRows.join(" | ")}`);
  }
}

await main();