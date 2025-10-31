"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Newspaper, Share2 } from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";
import { NewsItem } from "@/types";

const formatDate = (value: string) => {
  try {
    return format(new Date(value), "MMM d, yyyy HH:mm");
  } catch {
    return value;
  }
};

export type ResultsTableProps = {
  items: NewsItem[];
  onExport: (items: NewsItem[]) => void;
};

export const ResultsTable = ({ items, onExport }: ResultsTableProps) => {
  const [sortKey, setSortKey] = useState<"authenticityScore" | "marketImpactScore">(
    "marketImpactScore",
  );

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [items, sortKey]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white/95 shadow-sm">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Newspaper className="h-5 w-5 text-accent" /> Insight stream
          </div>
          <p className="text-sm text-slate-500">
            Ranked by signal strength. Sort and explore the most relevant biosimilar updates.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className={clsx(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
              sortKey === "marketImpactScore"
                ? "border-accent bg-accent text-white"
                : "border-slate-200 bg-white text-slate-600",
            )}
            onClick={() => setSortKey("marketImpactScore")}
          >
            <ArrowUpDown className="h-4 w-4" /> Impact
          </button>
          <button
            type="button"
            className={clsx(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
              sortKey === "authenticityScore"
                ? "border-accent bg-accent text-white"
                : "border-slate-200 bg-white text-slate-600",
            )}
            onClick={() => setSortKey("authenticityScore")}
          >
            <ArrowUpDown className="h-4 w-4" /> Authenticity
          </button>
          <button
            type="button"
            onClick={() => onExport(sortedItems)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-accent hover:text-accent"
          >
            <Share2 className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left">Headline</th>
              <th className="px-6 py-3 text-left">SOP mapping</th>
              <th className="px-6 py-3 text-left">Keywords</th>
              <th className="px-6 py-3 text-left">Scores</th>
              <th className="px-6 py-3 text-left">Published</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {sortedItems.map((item) => (
              <tr key={item.id} className="align-top hover:bg-slate-50/60">
                <td className="space-y-1 px-6 py-4">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-accent outline-none hover:underline"
                  >
                    {item.title}
                  </a>
                  <p className="text-xs text-slate-500">{item.source}</p>
                  <p className="text-xs text-slate-500">{item.snippet}</p>
                </td>
                <td className="px-6 py-4 text-xs text-slate-600">
                  <p>
                    <span className="font-medium text-slate-700">SOP:</span> {item.sopMatches.join(", ")}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Categories:</span>{" "}
                    {item.categoryMatches.join(", ") || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Companies:</span>{" "}
                    {item.companies.join(", ") || "—"}
                  </p>
                </td>
                <td className="px-6 py-4 text-xs text-slate-600">
                  <div className="flex flex-wrap gap-1">
                    {item.keywordMatches.map((keyword) => (
                      <span
                        key={`${item.id}-${keyword}`}
                        className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent"
                      >
                        {keyword}
                      </span>
                    ))}
                    {item.keywordMatches.length === 0 && <span>—</span>}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Signal: {item.signal}</p>
                </td>
                <td className="px-6 py-4 text-xs">
                  <div className="flex flex-col gap-2">
                    <div className="rounded-lg bg-emerald-50 px-3 py-1 text-emerald-700">
                      Authenticity {Math.round(item.authenticityScore)}
                    </div>
                    <div className="rounded-lg bg-indigo-50 px-3 py-1 text-indigo-700">
                      Market {Math.round(item.marketImpactScore)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDate(item.publishedAt)}</td>
              </tr>
            ))}

            {sortedItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-500">
                  Upload keywords, configure filters, and click “Run monitoring” to populate results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
