import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mkProblem, mkSprint } from "@/test/fixtures/problems";
import { renderWithProviders } from "@/test/render";

const api = vi.hoisted(() => ({ getSprint: vi.fn() }));
vi.mock("@/lib/api", () => api);

import { StatsDashboard } from "./stats-dashboard";

describe("StatsDashboard", () => {
  it("shows month calendars for the selected year and capitalized subjects", async () => {
    const thisYear = new Date().getFullYear();
    api.getSprint.mockResolvedValue({
      sprint: mkSprint({ start_date: `${thisYear - 1}-12-01` }),
      problems: [
        mkProblem({ subject: "dsa", done_at: new Date().toISOString() }),
        mkProblem({ subject: "computer-networks" }),
      ],
    });
    renderWithProviders(<StatsDashboard id="s1" />);

    expect(await screen.findByText(`solved in ${thisYear}`)).toBeInTheDocument();
    const header = screen.getByText(`solved in ${thisYear}`).parentElement!;
    expect(within(header).getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/Total active days:/)).toHaveTextContent("Total active days: 1");
    expect(screen.getByText(/Max streak:/)).toHaveTextContent("Max streak: 1");
    expect(screen.getByRole("combobox", { name: "Year" })).toHaveTextContent(String(thisYear));
    expect(screen.getAllByText("Jan")).not.toHaveLength(0);
    // Every day of the year gets a cell (future included), and today isn't outlined.
    expect(document.body.querySelector(`[data-date="${thisYear}-12-31"]`)).not.toBeNull();
    expect(document.body.querySelectorAll("[data-date]").length).toBeGreaterThanOrEqual(365);
    expect(document.body.querySelector("[data-date].ring-1")).toBeNull();
    expect(screen.getByText("DSA")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox", { name: "Year" }));
    await user.click(await screen.findByRole("option", { name: String(thisYear - 1) }));
    expect(await screen.findByText(`solved in ${thisYear - 1}`)).toBeInTheDocument();
    expect(screen.getByText(/Total active days:/)).toHaveTextContent("Total active days: 0");
    expect(screen.getByText("Computer Networks")).toBeInTheDocument();
  });
});
