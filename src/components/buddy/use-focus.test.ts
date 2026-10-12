import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FOCUS_MS } from "@/lib/buddy/focus";
import { load, save } from "@/lib/buddy/storage";
import { useFocus } from "./use-focus";

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
  vi.setSystemTime(new Date(2026, 9, 13, 10));
});
afterEach(() => vi.useRealTimers());

describe("useFocus", () => {
  it("counts down, pauses and resumes", () => {
    const { result } = renderHook(() => useFocus(vi.fn()));
    act(() => result.current.start());
    expect(result.current.remaining).toBe(FOCUS_MS);
    tick(60_000);
    expect(result.current.remaining).toBe(FOCUS_MS - 60_000);
    act(() => result.current.pause());
    tick(120_000);
    expect(result.current.remaining).toBe(FOCUS_MS - 60_000);
    expect(result.current.running).toBe(false);
    act(() => result.current.resume());
    tick(1000);
    expect(result.current.remaining).toBe(FOCUS_MS - 61_000);
  });

  it("fires onEnd exactly once, clears state and counts the session", () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useFocus(onEnd));
    act(() => result.current.start());
    tick(FOCUS_MS + 5000);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledWith("focus");
    expect(result.current.state).toBeNull();
    expect(load("focus")).toBeNull();
    expect(load("focusDone")).toEqual({ date: "2026-10-13", count: 1 });
  });

  it("survives a reload", () => {
    const first = renderHook(() => useFocus(vi.fn()));
    act(() => first.result.current.start());
    tick(10 * 60_000);
    first.unmount();
    const { result } = renderHook(() => useFocus(vi.fn()));
    expect(result.current.running).toBe(true);
    expect(result.current.remaining).toBe(FOCUS_MS - 10 * 60_000);
  });

  it("ends a session that expired while the app was closed", () => {
    save("focus", { phase: "focus", endsAt: Date.now() - 5000, pausedRemaining: null });
    const onEnd = vi.fn();
    const { result } = renderHook(() => useFocus(onEnd));
    expect(result.current.remaining).toBe(0);
    tick(3000);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
