import { screen } from "@testing-library/react";
import { differenceInCalendarDays, subDays } from "date-fns";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

const api = vi.hoisted(() => ({ listMyDoneTimestamps: vi.fn() }));
vi.mock("@/lib/api", () => api);

import { useBuddyStats } from "./use-buddy-stats";

function Show() {
  const { stats } = useBuddyStats();
  return <p>{stats ? `${stats.today}/${stats.yesterday}/${stats.streak}` : "loading"}</p>;
}

describe("useBuddyStats", () => {
  it("fetches 60 days of solves and derives today / yesterday / streak", async () => {
    const now = new Date().toISOString();
    api.listMyDoneTimestamps.mockResolvedValue([now, now, subDays(new Date(), 1).toISOString()]);
    renderWithProviders(<Show />);
    expect(await screen.findByText("2/1/2")).toBeInTheDocument();
    expect(differenceInCalendarDays(new Date(), new Date(api.listMyDoneTimestamps.mock.calls[0][0]))).toBe(60);
  });
});
