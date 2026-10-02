"use client";

import { useEffect } from "react";
import { applyAccent } from "@/hooks/use-accent";

/** Apply the accent saved on the account (other devices) over the locally cached one. */
export function AccentSync({ accent }: { accent: string | null }) {
  useEffect(() => {
    if (accent) applyAccent(accent);
  }, [accent]);
  return null;
}
