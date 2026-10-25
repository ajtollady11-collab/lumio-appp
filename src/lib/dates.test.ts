import { describe, expect, it } from "vitest";

import {
  addDays,
  dateInZone,
  daysBetween,
  formatMinutes,
  friendlyDate,
  greetingForHour,
  shortTime,
  todayInZone,
} from "./dates";

describe("dates", () => {
  it("works out today in the student's time zone", () => {
    const lateEvening = new Date("2026-10-25T23:30:00Z");
    expect(todayInZone("Europe/London", lateEvening)).toBe("2026-10-25");
    expect(todayInZone("Asia/Tokyo", lateEvening)).toBe("2026-10-26");
    expect(dateInZone(lateEvening, "America/New_York")).toBe("2026-10-25");
  });

  it("adds days across month and clock-change boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(daysBetween("2026-10-25", "2026-11-01")).toBe(7);
  });

  it("describes dates relative to today", () => {
    expect(friendlyDate("2026-10-25", "2026-10-25")).toBe("Today");
    expect(friendlyDate("2026-10-26", "2026-10-25")).toBe("Tomorrow");
    expect(friendlyDate("2026-10-24", "2026-10-25")).toBe("Yesterday");
  });

  it("formats times, durations and greetings", () => {
    expect(shortTime("09:05:00")).toBe("09:05");
    expect(shortTime(null)).toBeNull();
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(60)).toBe("1 h");
    expect(formatMinutes(90)).toBe("1 h 30 min");
    expect(greetingForHour(4)).toBe("Good evening");
    expect(greetingForHour(5)).toBe("Good morning");
    expect(greetingForHour(12)).toBe("Good afternoon");
    expect(greetingForHour(18)).toBe("Good evening");
  });
});
