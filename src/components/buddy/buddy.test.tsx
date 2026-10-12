import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, subDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionUserProvider } from "@/components/shell/session-user";
import { mkProblem, mkSprint } from "@/test/fixtures/problems";
import { renderWithProviders } from "@/test/render";

let pathname = "/app";
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ push: vi.fn() }) }));

const api = vi.hoisted(() => ({ listMyDoneTimestamps: vi.fn(), getSprint: vi.fn() }));
vi.mock("@/lib/api", () => api);

import { Buddy } from "./buddy";
import { BuddyProvider, useBuddy } from "./buddy-context";

const me = { id: "u", email: "p@x.com", name: "Prathis W", avatar: null, accent: null };
const today = format(new Date(), "yyyy-MM-dd");
const ago = (days: number) => subDays(new Date(), days).toISOString();

function Notifier() {
  const { notify } = useBuddy();
  return (
    <>
      <button onClick={() => notify({ type: "solved" })}>solve</button>
      <button onClick={() => notify({ type: "startFocus" })}>focus</button>
    </>
  );
}

const renderBuddy = () =>
  renderWithProviders(
    <SessionUserProvider value={me}>
      <BuddyProvider>
        <Notifier />
        <Buddy />
      </BuddyProvider>
    </SessionUserProvider>,
  );
const skipGreeting = () => localStorage.setItem("sprinty:lastGreetDate", JSON.stringify(today));
const loaded = async () => {
  await waitFor(() => expect(api.listMyDoneTimestamps).toHaveBeenCalled());
  await act(async () => {});
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.spyOn(Math, "random").mockReturnValue(0);
  pathname = "/app";
  // Today 1, yesterday 3 → streak 2.
  api.listMyDoneTimestamps.mockResolvedValue([ago(0), ago(1), ago(1), ago(1)]);
  api.getSprint.mockResolvedValue({ sprint: mkSprint(), problems: [] });
});
afterEach(() => vi.restoreAllMocks());

describe("Buddy greeting", () => {
  it("greets once per day with today vs yesterday", async () => {
    const first = renderBuddy();
    expect(await screen.findByRole("status")).toHaveTextContent("Prathis! Yesterday 3 · Today 1 — 3 more to beat it.");
    first.unmount();
    renderBuddy();
    await loaded();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("starts a focus session from the greeting", async () => {
    const user = userEvent.setup();
    renderBuddy();
    await user.click(await screen.findByRole("button", { name: "Start focus" }));
    expect(await screen.findByText("25:00")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  });
});

describe("Buddy panel", () => {
  it("shows today / yesterday / streak and starts focus from the palette event", async () => {
    skipGreeting();
    const user = userEvent.setup();
    renderBuddy();
    await loaded();
    await user.click(screen.getByRole("button", { name: "Open Sprinty" }));
    expect(screen.getByLabelText("Today: 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Yesterday: 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Streak: 2 days")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "focus" }));
    expect(await screen.findByText("25:00")).toBeInTheDocument();
  });

  it("can be hidden and restored, and remembers it", async () => {
    skipGreeting();
    const user = userEvent.setup();
    renderBuddy();
    await user.click(screen.getByRole("button", { name: "Open Sprinty" }));
    await user.click(await screen.findByRole("button", { name: "Hide Sprinty" }));
    expect(screen.queryByRole("button", { name: "Open Sprinty" })).toBeNull();
    expect(JSON.parse(localStorage.getItem("sprinty:settings")!)).toMatchObject({ hidden: true });
    await user.click(screen.getByRole("button", { name: "Show Sprinty" }));
    expect(screen.getByRole("button", { name: "Open Sprinty" })).toBeInTheDocument();
  });
});

describe("Buddy celebrations", () => {
  it("celebrates a milestone with confetti", async () => {
    skipGreeting();
    api.listMyDoneTimestamps.mockResolvedValue([ago(0), ago(1), ago(1)]); // today 1, yesterday 2
    renderBuddy();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "solve" }));
    expect(await screen.findByRole("status")).toHaveTextContent("2 — tied with yesterday! One more for the win.");
    expect(screen.getByTestId("confetti")).toBeInTheDocument();
    expect(document.querySelector('[data-mood="cheer"]')).not.toBeNull();
  });

  it("rate-limits plain solves to one bubble a minute", async () => {
    skipGreeting();
    api.listMyDoneTimestamps.mockResolvedValue([ago(0)]);
    renderBuddy();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "solve" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Nice one!");
    fireEvent.click(screen.getByRole("button", { name: "solve" }));
    await act(async () => {});
    expect(screen.queryByText(/Solved/)).toBeNull();
  });

  it("stays quiet during a focus session", async () => {
    skipGreeting();
    renderBuddy();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "focus" }));
    fireEvent.click(screen.getByRole("button", { name: "solve" }));
    await act(async () => {});
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("Buddy idle nudge", () => {
  const wait = (min: number) => act(() => void vi.advanceTimersByTime(min * 60_000));

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    skipGreeting();
    pathname = "/app/s/s1";
  });
  afterEach(() => vi.useRealTimers());

  it("nudges an active user after 20 idle minutes", async () => {
    renderBuddy();
    await wait(19);
    fireEvent.keyDown(window, { key: "a" });
    await wait(2);
    expect(screen.getByRole("status")).toHaveTextContent("Stuck?");
  });

  it("leaves inactive users alone", async () => {
    renderBuddy();
    await wait(25);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("respects the nudges setting", async () => {
    localStorage.setItem("sprinty:settings", JSON.stringify({ hidden: false, nudges: false }));
    renderBuddy();
    await wait(19);
    fireEvent.keyDown(window, { key: "a" });
    await wait(2);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("only nudges on sprint pages", async () => {
    pathname = "/app";
    renderBuddy();
    await wait(19);
    fireEvent.keyDown(window, { key: "a" });
    await wait(2);
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("Buddy schedule check", () => {
  const sprint = mkSprint({ start_date: format(subDays(new Date(), 4), "yyyy-MM-dd") }); // today = day 5
  const problems = [mkProblem({ day_no: 1, done_at: ago(3) }), mkProblem({ day_no: 2 }), mkProblem({ day_no: 3 }), mkProblem({ day_no: 5 })];

  beforeEach(() => {
    pathname = "/app/s/s1";
    api.getSprint.mockResolvedValue({ sprint, problems });
  });

  it("merges into the greeting on the first sprint visit of the day", async () => {
    renderBuddy();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Plan says day 5, you're on day 2 — 2 problems to catch up."),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Prathis!");
  });

  it("only checks each sprint once a day", async () => {
    skipGreeting();
    const first = renderBuddy();
    expect(await screen.findByRole("status")).toHaveTextContent("Plan says day 5");
    first.unmount();
    renderBuddy();
    await waitFor(() => expect(api.getSprint).toHaveBeenCalledTimes(2));
    await act(async () => {});
    expect(screen.queryByRole("status")).toBeNull();
  });
});
