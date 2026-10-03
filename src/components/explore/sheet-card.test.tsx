import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mkSheet } from "@/test/fixtures/sheets";
import { SheetCard } from "./sheet-card";

describe("SheetCard", () => {
  it("shows duration, size, owner and MAANG coverage", () => {
    render(<SheetCard sheet={mkSheet()} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/app/sheets/pub1");
    expect(screen.getByText("136 days · ~19 weeks")).toBeInTheDocument();
    expect(screen.getByText("600 problems")).toBeInTheDocument();
    expect(screen.getByText("by Prathis")).toBeInTheDocument();
    expect(screen.getByText("4/5 MAANG")).toBeInTheDocument();
    expect(screen.getByTitle("Netflix: not covered")).toBeInTheDocument();
  });

  it("hides the owner when they opted out", () => {
    render(<SheetCard sheet={mkSheet({ owner_name: null })} />);
    expect(screen.getByText("Community sheet")).toBeInTheDocument();
  });
});
