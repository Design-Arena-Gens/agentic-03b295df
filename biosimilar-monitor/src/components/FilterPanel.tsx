"use client";

import { useMemo, useState } from "react";
import { Clock, Link2, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import { TimeRange } from "@/types";
import { PRESET_TIME_RANGES, createTimeRange } from "@/lib/time";

export type FilterPanelProps = {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  thresholds: {
    authenticity: number;
    marketImpact: number;
  };
  onThresholdChange: (key: "authenticity" | "marketImpact", value: number) => void;
  availableCompanies: string[];
  activeCompanies: string[];
  onCompanyToggle: (company: string) => void;
  customUrls: string[];
  onAddCustomUrl: (url: string) => void;
  onRemoveCustomUrl: (url: string) => void;
};

export const FilterPanel = ({
  timeRange,
  onTimeRangeChange,
  thresholds,
  onThresholdChange,
  availableCompanies,
  activeCompanies,
  onCompanyToggle,
  customUrls,
  onAddCustomUrl,
  onRemoveCustomUrl,
}: FilterPanelProps) => {
  const [customHours, setCustomHours] = useState(48);
  const [urlValue, setUrlValue] = useState("");

  const companyOptions = useMemo(() => Array.from(new Set(availableCompanies)).sort(), [
    availableCompanies,
  ]);

  const presetOptions = useMemo(
    () => {
      const presets = PRESET_TIME_RANGES.map((preset) => ({
        ...preset,
        isActive: preset.label === timeRange.label,
      }));
      const isCustomSelected = !presets.some((preset) => preset.isActive);
      if (isCustomSelected) {
        presets.push({ ...timeRange, isActive: true });
      }
      return presets;
    },
    [timeRange],
  );

  const handleCustomHoursChange = (value: number) => {
    setCustomHours(value);
    onTimeRangeChange(createTimeRange(value, `Last ${value} hours`));
  };

  const handleUrlAdd = () => {
    if (!urlValue) return;
    try {
      const validated = new URL(urlValue.trim());
      onAddCustomUrl(validated.toString());
      setUrlValue("");
    } catch (error) {
      console.error("Invalid URL", error);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <SlidersHorizontal className="h-4 w-4" /> Advanced filters
      </div>

      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
          <Clock className="h-3.5 w-3.5" /> Time window
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2">
          {presetOptions.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={clsx(
                "rounded-lg border px-3 py-2 text-left text-sm transition",
                preset.isActive
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
              onClick={() => onTimeRangeChange(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-center justify-between text-xs text-slate-600">
            Custom hours
            <span className="font-semibold text-slate-800">{customHours}h</span>
          </label>
          <input
            type="range"
            min={6}
            max={720}
            value={customHours}
            onChange={(event) => handleCustomHoursChange(Number(event.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Score gates</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-3">
            <span className="text-xs text-slate-500">Authenticity</span>
            <input
              type="number"
              value={thresholds.authenticity}
              min={0}
              max={100}
              onChange={(e) => onThresholdChange("authenticity", Number(e.target.value))}
              className="rounded border border-slate-200 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            />
          </label>
          <label className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-3">
            <span className="text-xs text-slate-500">Market impact</span>
            <input
              type="number"
              value={thresholds.marketImpact}
              min={0}
              max={100}
              onChange={(e) => onThresholdChange("marketImpact", Number(e.target.value))}
              className="rounded border border-slate-200 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Company filter</p>
        <div className="flex flex-wrap gap-2">
          {companyOptions.length === 0 && (
            <p className="text-xs text-slate-400">
              Companies will appear when present in your workbook.
            </p>
          )}
          {companyOptions.map((company) => {
            const isActive = activeCompanies.includes(company);
            return (
              <button
                key={company}
                type="button"
                onClick={() => onCompanyToggle(company)}
                className={clsx(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  isActive
                    ? "border-accent bg-accent text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                {company}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
          <Link2 className="h-3.5 w-3.5" /> Company URLs
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlValue}
            onChange={(event) => setUrlValue(event.target.value)}
            placeholder="https://example.com/newsroom"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          />
          <button
            type="button"
            onClick={handleUrlAdd}
            className="rounded-lg border border-accent bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
          >
            Add
          </button>
        </div>
        <ul className="max-h-24 space-y-1 overflow-y-auto text-sm">
          {customUrls.map((url) => (
            <li
              key={url}
              className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
            >
              <span className="truncate" title={url}>
                {url}
              </span>
              <button
                type="button"
                className="text-danger transition hover:underline"
                onClick={() => onRemoveCustomUrl(url)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
