"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "./user-menu";

const Ctx = createContext<SessionUser | null>(null);
export const SessionUserProvider = Ctx.Provider;

/** The signed-in user (available anywhere under /app). */
export const useSessionUser = () => useContext(Ctx);
