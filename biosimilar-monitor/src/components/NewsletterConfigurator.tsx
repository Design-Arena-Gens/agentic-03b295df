"use client";

import { ChangeEvent } from "react";
import { Inbox, Columns } from "lucide-react";
import clsx from "clsx";
import { NewsletterColumn, NewsItem } from "@/types";

export type NewsletterConfiguratorProps = {
  columns: NewsletterColumn[];
  selectedColumns: string[];
  onToggleColumn: (id: string) => void;
  includeScores: boolean;
  onIncludeScoresChange: (value: boolean) => void;
  introText: string;
  outroText: string;
  onIntroTextChange: (value: string) => void;
  onOutroTextChange: (value: string) => void;
  items: NewsItem[];
};

const buildNewsletterPreview = (
  items: NewsItem[],
  columns: NewsletterColumn[],
  selectedColumns: string[],
  includeScores: boolean,
  introText: string,
  outroText: string,
): string => {
  const selected = columns.filter((column) => selectedColumns.includes(column.id));

  const header = introText ? `${introText}\n\n` : "";
  const footer = outroText ? `\n\n${outroText}` : "";

  const rows = items.map((item, index) => {
    const lines = [`${index + 1}. ${item.title} (${item.source})`, item.link];

    selected.forEach((column) => {
      switch (column.id) {
        case "sop":
          lines.push(`• SOP: ${item.sopMatches.join(", ") || "N/A"}`);
          break;
        case "categories":
          lines.push(`• Categories: ${item.categoryMatches.join(", ") || "N/A"}`);
          break;
        case "keywords":
          lines.push(`• Keywords: ${item.keywordMatches.join(", ") || "N/A"}`);
          break;
        case "companies":
          lines.push(`• Companies: ${item.companies.join(", ") || "N/A"}`);
          break;
        case "summary":
          lines.push(`• Summary: ${item.snippet}`);
          break;
        case "signal":
          lines.push(`• Signal: ${item.signal}`);
          break;
        default:
          break;
      }
    });

    if (includeScores) {
      lines.push(
        `• Authenticity ${Math.round(item.authenticityScore)} | Impact ${Math.round(item.marketImpactScore)}`,
      );
    }

    return lines.join("\n");
  });

  return `${header}${rows.join("\n\n")}${footer}`.trim();
};

export const NewsletterConfigurator = ({
  columns,
  selectedColumns,
  onToggleColumn,
  includeScores,
  onIncludeScoresChange,
  introText,
  outroText,
  onIntroTextChange,
  onOutroTextChange,
  items,
}: NewsletterConfiguratorProps) => {
  const preview = buildNewsletterPreview(
    items.slice(0, 10),
    columns,
    selectedColumns,
    includeScores,
    introText,
    outroText,
  );

  const handleTextareaChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
    updater: (value: string) => void,
  ) => {
    updater(event.target.value);
  };

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-white/95 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Columns className="h-4 w-4" /> Newsletter columns
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Select metadata to include for each story in your distributed digest.
        </p>
        <div className="mt-4 space-y-2">
          {columns.map((column) => {
            const isActive = selectedColumns.includes(column.id);
            return (
              <label
                key={column.id}
                className={clsx(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition",
                  isActive
                    ? "border-accent bg-accent-soft"
                    : "border-slate-200 bg-white hover:border-slate-300",
                )}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => onToggleColumn(column.id)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-slate-700">{column.label}</p>
                  <p className="text-xs text-slate-500">{column.description}</p>
                </div>
              </label>
            );
          })}
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={includeScores}
            onChange={(event) => onIncludeScoresChange(event.target.checked)}
          />
          Include authenticity & impact scores
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-slate-950 text-slate-100 shadow-inner">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-sm font-semibold">
          <Inbox className="h-4 w-4" /> Newsletter preview
        </div>
        <div className="grid gap-3 border-b border-white/10 p-4">
          <label className="text-xs uppercase tracking-wide text-slate-400">
            Intro
            <textarea
              value={introText}
              onChange={(event) => handleTextareaChange(event, onIntroTextChange)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-accent"
              placeholder="Welcome to this week’s biosimilar pulse…"
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-slate-400">
            Outro
            <textarea
              value={outroText}
              onChange={(event) => handleTextareaChange(event, onOutroTextChange)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-accent"
              placeholder="Let us know if your team needs a deeper dive."
            />
          </label>
        </div>
        <pre className="flex-1 overflow-y-auto whitespace-pre-wrap break-words p-4 text-[13px] leading-5 text-slate-100">
          {preview || "Preview will generate once insights are available."}
        </pre>
      </div>
    </div>
  );
};
