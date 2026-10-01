"use client";

import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { SORTS, STATUSES, type Filters } from "@/lib/filters";

const list = parseAsArrayOf(parseAsString, ",").withDefault([]);

export const filterParsers = {
  q: parseAsString.withDefault(""),
  subjects: list,
  difficulties: list,
  companies: list,
  topics: list,
  status: parseAsStringLiteral(STATUSES).withDefault("all"),
  sort: parseAsStringLiteral(SORTS).withDefault("day"),
  dir: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
};

export function useFilters() {
  const [filters, setFilters] = useQueryStates(filterParsers, { history: "replace" });
  return [filters as Filters, setFilters] as const;
}

export const useView = () =>
  useQueryStates({ view: parseAsStringLiteral(["timeline", "table"] as const).withDefault("timeline") }, { history: "replace" });
