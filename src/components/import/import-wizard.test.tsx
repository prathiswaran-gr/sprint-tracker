import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildWorkbook } from "@/test/fixtures/workbook";
import { renderWithProviders } from "@/test/render";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const api = vi.hoisted(() => ({ createSprint: vi.fn(async () => ({ id: "new-id" })) }));
vi.mock("@/lib/api", () => api);

import { ImportWizard } from "./import-wizard";

describe("ImportWizard", () => {
  it("parses an uploaded xlsx, previews it, and creates the sprint", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<ImportWizard />);
    const file = new File([buildWorkbook()], "DSA Prep Sheet.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });

    expect(await screen.findByText(/5 problems · 2 sprints · 3 days/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("DSA Prep Sheet")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Create sprint with 5 problems/ }));
    await waitFor(() => expect(api.createSprint).toHaveBeenCalled());
    const [input, rows] = api.createSprint.mock.calls[0] as unknown as [{ title: string }, { name: string; url: string }[]];
    expect(input.title).toBe("DSA Prep Sheet");
    expect(rows).toHaveLength(5);
    expect(rows[1]).toMatchObject({ name: "Largest Element", url: "https://takeuforward.org/practice/dsa/largest-element" });
    expect(push).toHaveBeenCalledWith("/app/s/new-id");
  });
});
