"use client";

import { format } from "date-fns";
import { useEffect } from "react";
import { useSprint } from "@/hooks/use-sprint";
import { scheduleBubble, type Bubble } from "@/lib/buddy/bubbles";
import { load, save } from "@/lib/buddy/storage";
import { scheduleStatus } from "@/lib/buddy/triggers";

/** Once per sprint per day, tell the user how they stand against the plan. Shares the sprint page's query cache. */
export function ScheduleWatch({ sprintId, onStatus }: { sprintId: string; onStatus: (b: Bubble) => void }) {
  const { data } = useSprint(sprintId);

  useEffect(() => {
    if (!data) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const seen = load("scheduleSeen");
    if (seen[sprintId] === today) return;
    save("scheduleSeen", { ...seen, [sprintId]: today });
    const { sprint, problems } = data;
    const cfg = { startDate: sprint.start_date, skipWeekends: sprint.skip_weekends, restDays: sprint.rest_days };
    const status = scheduleStatus(cfg, problems, today);
    if (status) onStatus(scheduleBubble(status, { lastId: load("lastMsgId") }));
  }, [data, sprintId, onStatus]);

  return null;
}
