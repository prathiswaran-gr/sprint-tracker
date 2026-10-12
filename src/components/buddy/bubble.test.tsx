import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Bubble } from "@/lib/buddy/bubbles";
import { BUBBLE_MS, SpeechBubble } from "./bubble";

const b: Bubble = {
  kind: "greeting",
  id: "g#0",
  text: "Hello there",
  mood: "happy",
  actions: [{ id: "startFocus", label: "Start focus" }, { id: "dismiss", label: "Later" }],
  confetti: false,
};

afterEach(() => vi.useRealTimers());

describe("SpeechBubble", () => {
  it("announces politely and routes actions", () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();
    render(<SpeechBubble bubble={b} onAction={onAction} onDismiss={onDismiss} />);
    expect(screen.getByRole("status")).toHaveTextContent("Hello there");
    fireEvent.click(screen.getByRole("button", { name: "Start focus" }));
    expect(onAction).toHaveBeenCalledWith("startFocus");
    fireEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(onDismiss).toHaveBeenCalledWith("g#0");
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("auto-dismisses unless hovered", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const onDismiss = vi.fn();
    render(<SpeechBubble bubble={b} onAction={vi.fn()} onDismiss={onDismiss} />);
    const el = screen.getByRole("status");
    fireEvent.mouseEnter(el);
    act(() => void vi.advanceTimersByTime(BUBBLE_MS * 2));
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.mouseLeave(el);
    act(() => void vi.advanceTimersByTime(BUBBLE_MS));
    expect(onDismiss).toHaveBeenCalledWith("g#0");
  });
});
