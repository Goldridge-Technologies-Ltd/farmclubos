import { formatDay } from "./format";

/*
  A cohort's start date is a *day*, stored without a time. Parsed naively it
  becomes midnight UTC, and anyone west of Greenwich is shown the day before —
  an intake starting on the 1st would read as starting on the 31st.
*/
describe("formatDay", () => {
  it("shows a plain day as that day, whatever the server's timezone", () => {
    expect(formatDay("2026-09-01")).toBe("1 Sept 2026");
  });

  it("shows an instant as the day it falls on in UTC", () => {
    expect(formatDay("2026-09-22T23:30:00.000Z")).toBe("22 Sept 2026");
  });

  it("says nothing for nothing, rather than 'Invalid Date'", () => {
    expect(formatDay(null)).toBe("");
    expect(formatDay("not a date")).toBe("");
  });
});
