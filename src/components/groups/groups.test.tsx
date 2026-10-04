import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionUserProvider } from "@/components/shell/session-user";
import { mkProblem, mkSprint } from "@/test/fixtures/problems";
import { renderWithProviders } from "@/test/render";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const api = vi.hoisted(() => ({
  getGroup: vi.fn(),
  groupProgress: vi.fn(),
  getSprint: vi.fn(),
  groupPreview: vi.fn(),
  joinGroup: vi.fn(async () => "new-sprint"),
  leaveGroup: vi.fn(),
  removeMember: vi.fn(),
  deleteGroup: vi.fn(),
}));
vi.mock("@/lib/api", () => api);

import { GroupView } from "./group-view";
import { JoinGroup } from "./join-group";

const me = { id: "me", name: "Prathis", email: "p@x.com", avatar: null, accent: null };
const withUser = (ui: React.ReactElement) => <SessionUserProvider value={me}>{ui}</SessionUserProvider>;
const member = (user_id: string, display_name: string, role: "owner" | "member" = "member") => ({
  group_id: "g1", user_id, sprint_id: `s-${user_id}`, display_name, avatar: null, role, joined_at: "2026-10-01T00:00:00Z",
});

beforeEach(() => {
  vi.clearAllMocks();
  api.getGroup.mockResolvedValue({
    group: { id: "g1", owner_id: "me", sprint_id: "s-me", name: "Prep squad", invite_code: "abc123", created_at: "" },
    members: [member("me", "Prathis", "owner"), member("e", "Eswaran"), member("k", "Kavin")],
  });
  api.groupProgress.mockResolvedValue([
    { user_id: "e", problem_key: "p1", done_at: "2026-10-02T10:00:00Z" },
    { user_id: "e", problem_key: "p2", done_at: "2026-10-03T10:00:00Z" },
    { user_id: "me", problem_key: "p1", done_at: "2026-10-03T10:00:00Z" },
  ]);
  api.getSprint.mockResolvedValue({
    sprint: mkSprint({ id: "s-me", title: "DSA Prep" }),
    problems: [mkProblem({ id: "p1", name: "Two Sum" }), mkProblem({ id: "p2", name: "3 Sum" }), mkProblem({ id: "p3", name: "4 Sum" })],
  });
});

describe("GroupView", () => {
  it("ranks members and marks who completed each problem", async () => {
    renderWithProviders(withUser(<GroupView id="g1" />));
    expect(await screen.findByRole("heading", { name: "Prep squad" })).toBeInTheDocument();

    const ranks = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(ranks.map((li) => li.textContent)).toEqual([
      expect.stringContaining("Eswaran"),
      expect.stringContaining("Prathis"),
      expect.stringContaining("Kavin"),
    ]);
    expect(within(ranks[0]).getByText("2/3")).toBeInTheDocument();

    // One stacked "Completed by" cell per problem.
    const twoSum = await screen.findByLabelText("Completed by Prathis, Eswaran");
    expect(twoSum).toHaveTextContent("2/3");
    expect(screen.getByLabelText("Completed by Eswaran")).toHaveTextContent("1/3");
    expect(screen.getByLabelText("Not completed yet")).toHaveTextContent("0/3");

    // Hovering lists who did it and who hasn't yet.
    const user = userEvent.setup();
    await user.hover(twoSum);
    const list = await screen.findByText("Completed by 2 of 3");
    const popover = list.parentElement!;
    expect(within(popover).getByText("Eswaran")).toBeInTheDocument();
    expect(within(popover).getByText("(you)")).toBeInTheDocument();
    expect(within(popover).getByText("Not yet")).toBeInTheDocument();
    expect(within(popover).getByText("Kavin")).toBeInTheDocument();
    expect((screen.getByLabelText("Invite link") as HTMLInputElement).value).toContain("/app/join/abc123");
  });

  it("shows a not-available state for non-members", async () => {
    api.getGroup.mockResolvedValue(null);
    renderWithProviders(withUser(<GroupView id="g1" />));
    expect(await screen.findByText("This group isn't available")).toBeInTheDocument();
  });
});

describe("JoinGroup", () => {
  const preview = {
    id: "g1", name: "Prep squad", owner_name: "Prathis", member_count: 2, sheet_title: "DSA Prep",
    problem_count: 600, day_count: 136, my_sprint_id: null, existing_copy_id: null,
  };

  it("joins with a fresh copy and opens the new sprint", async () => {
    api.groupPreview.mockResolvedValue(preview);
    const user = userEvent.setup();
    renderWithProviders(withUser(<JoinGroup code="abc123" />));
    expect(await screen.findByRole("heading", { name: "Prep squad" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Join group" }));
    await waitFor(() => expect(api.joinGroup).toHaveBeenCalledWith("abc123", { name: "Prathis", avatar: null }, undefined));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/s/new-sprint"));
  });

  it("offers to link an existing copy", async () => {
    api.groupPreview.mockResolvedValue({ ...preview, existing_copy_id: "copy-1" });
    const user = userEvent.setup();
    renderWithProviders(withUser(<JoinGroup code="abc123" />));
    await user.click(await screen.findByRole("button", { name: /Join with my existing copy/ }));
    await waitFor(() => expect(api.joinGroup).toHaveBeenCalledWith("abc123", { name: "Prathis", avatar: null }, "copy-1"));
  });

  it("links members straight to the group", async () => {
    api.groupPreview.mockResolvedValue({ ...preview, my_sprint_id: "s-me" });
    renderWithProviders(withUser(<JoinGroup code="abc123" />));
    expect(await screen.findByRole("link", { name: "Open group" })).toHaveAttribute("href", "/app/groups/g1");
  });

  it("handles invalid links", async () => {
    api.groupPreview.mockResolvedValue(null);
    renderWithProviders(withUser(<JoinGroup code="nope" />));
    expect(await screen.findByText("This invite link isn't valid")).toBeInTheDocument();
  });
});
