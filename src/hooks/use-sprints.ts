"use client";

import { useQuery } from "@tanstack/react-query";
import { listSprints } from "@/lib/api";

export const useSprints = () => useQuery({ queryKey: ["sprints"], queryFn: listSprints });
