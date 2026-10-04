import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { SessionUserProvider } from "@/components/shell/session-user";
import { mkSprint } from "@/test/fixtures/problems";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/api", () => ({ deleteSprint: vi.fn() }));

import { SettingsDialog } from "./settings-dialog";

describe("SettingsDialog sharing", () => {
  it("publishes with an owner snapshot and description", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => {});
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SessionUserProvider value={{ id: "u1", name: "Prathis", email: "p@x.com", avatar: "https://img/p.png", accent: null }}>
          <SettingsDialog sprint={mkSprint()} open onOpenChange={() => {}} onSave={onSave} />
        </SessionUserProvider>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("switch", { name: "Public sheet" }));
    await user.type(screen.getByLabelText("Description"), "My sheet");
    await user.click(screen.getByRole("switch", { name: "Show my name" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]).toEqual([
      expect.objectContaining({
        visibility: "public",
        description: "My sheet",
        show_owner: false,
        owner_name: "Prathis",
        owner_avatar: "https://img/p.png",
        published_at: expect.any(String),
      }),
    ]);
  });
});
