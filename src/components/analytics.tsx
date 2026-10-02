"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";

// Drop query strings so filter/search state (?q=…&companies=…) never leaves the browser.
const stripQuery: BeforeSend = (event) => {
  const url = new URL(event.url);
  url.search = "";
  return { ...event, url: url.toString() };
};

export function VisitorAnalytics() {
  return <Analytics beforeSend={stripQuery} />;
}
