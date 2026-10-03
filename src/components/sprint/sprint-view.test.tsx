import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { format, subDays } from "date-fns";
import { mkProblem, mkSprint } from "@/test/fixtures/problems";
import { renderWithProviders } from "@/test/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/app/s/s1",
  useSearchParams: () => new URLSearchParams(),
}));

const api = vi.hoisted(() => ({
  getSprint: vi.fn(),
  updateProblem: vi.fn(async () => {}),
  reschedule: vi.fn(async () => {}),
  updateSprint: vi.fn(async () => {}),
  listSavedFilters: vi.fn(async () => []),
  listSprints: vi.fn(async () => []),
  createSavedFilter: vi.fn(),
  deleteSavedFilter: vi.fn(),
  deleteSprint: vi.fn(),
}));
vi.mock("@/lib/api", () => api);

import { SprintView } from "./sprint-view";

// Day 1 was two days ago → today is Day 3.
const sprint = mkSprint({ start_date: format(subDays(new Date(), 2), "yyyy-MM-dd") });
const problems = [
  mkProblem({ id: "a", name: "Linear Search", day_no: 1, original_day_no: 1, companies: ["Zoho"], done_at: "2026-10-01T10:00:00Z" }),
  mkProblem({ id: "b", name: "Largest Element", day_no: 1, original_day_no: 1, companies: ["Google"] }),
  mkProblem({ id: "c", name: "Two Sum", day_no: 3, original_day_no: 3, companies: ["Google", "Amazon"], topics: ["Hashing"] }),
  mkProblem({ id: "d", name: "Kadane's Algorithm", day_no: 5, original_day_no: 5, companies: ["Amazon"] }),
];

beforeEach(() => {
  vi.clearAllMocks();
  api.getSprint.mockResolvedValue({ sprint, problems: structuredClone(problems) });
});

describe("SprintView", () => {
  it("renders the timeline with today and overdue state", async () => {
    renderWithProviders(<SprintView id="s1" />);
    expect(await screen.findByRole("heading", { name: "DSA Prep" })).toBeInTheDocument();
    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByText("1 overdue")).toBeInTheDocument();
    expect(screen.getAllByText("Today").length).toBeGreaterThan(0);
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("toggles done optimistically and persists", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SprintView id="s1" />);
    const box = await screen.findByRole("checkbox", { name: /Mark Two Sum done/ });
    await user.click(box);
    await waitFor(() => expect(api.updateProblem).toHaveBeenCalledWith("c", { done_at: expect.any(String) }));
    expect(screen.getByRole("checkbox", { name: /Mark Two Sum not done/ })).toBeChecked();
  });

  it("filters by search and company from the URL", async () => {
    renderWithProviders(<SprintView id="s1" />, { searchParams: "?companies=Amazon" });
    await screen.findByText("Two Sum");
    expect(screen.getByText("Kadane's Algorithm")).toBeInTheDocument();
    expect(screen.queryByText("Largest Element")).not.toBeInTheDocument();
    expect(screen.getByText("2 matches")).toBeInTheDocument();
  });

  it("shifts the backlog so the overdue day lands on today", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SprintView id="s1" />);
    await user.click(await screen.findByRole("button", { name: /Shift backlog/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/3 problems will move/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Shift plan" }));
    await waitFor(() =>
      expect(api.reschedule).toHaveBeenCalledWith([
        { id: "b", day_no: 3, sprint_no: 1 },
        { id: "c", day_no: 5, sprint_no: 1 },
        { id: "d", day_no: 7, sprint_no: 1 },
      ]),
    );
    expect(screen.getByText("On track ✓")).toBeInTheDocument();
  });

  it("supports keyboard shortcuts: j to focus, x to toggle", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SprintView id="s1" />);
    await screen.findByText("Two Sum");
    await user.keyboard("jj");
    await user.keyboard("x");
    await waitFor(() => expect(api.updateProblem).toHaveBeenCalledWith("b", { done_at: expect.any(String) }));
  });
});
