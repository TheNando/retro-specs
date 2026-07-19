export const prRanges = [
  { value: "today", label: "Today" },
  { value: "last-week", label: "Last week" },
  { value: "last-month", label: "Last month" },
  { value: "last-50", label: "Last 50" },
  { value: "last-100", label: "Last 100" },
] as const;

export type PrRange = (typeof prRanges)[number]["value"];

const rangeDays: Partial<Record<PrRange, number>> = {
  today: 1,
  "last-week": 7,
  "last-month": 30,
};

const rangeLimits: Partial<Record<PrRange, number>> = {
  "last-50": 50,
  "last-100": 100,
};

export const getRangeStart = (range: PrRange) => {
  const days = rangeDays[range];
  return days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;
};

export const getRangeLimit = (range: PrRange) => rangeLimits[range];
