import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BuddyProvider, useBuddy, useBuddyEvents } from "./buddy-context";

function Fire() {
  const { notify } = useBuddy();
  return <button onClick={() => notify({ type: "solved" })}>go</button>;
}

describe("buddy event bus", () => {
  it("delivers events to subscribers", () => {
    const seen: string[] = [];
    function Spy() {
      useBuddyEvents((e) => {
        seen.push(e.type);
      });
      return null;
    }
    render(
      <BuddyProvider>
        <Spy />
        <Fire />
      </BuddyProvider>,
    );
    fireEvent.click(screen.getByText("go"));
    expect(seen).toEqual(["solved"]);
  });

  it("is a no-op without a provider", () => {
    cleanup();
    render(<Fire />);
    expect(() => fireEvent.click(screen.getByText("go"))).not.toThrow();
  });
});
