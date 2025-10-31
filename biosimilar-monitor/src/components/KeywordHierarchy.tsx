"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import clsx from "clsx";
import { KeywordGroup } from "@/types";

export type KeywordHierarchyProps = {
  groups: KeywordGroup[];
  activeGroupIds: string[];
  onToggle: (id: string) => void;
  onToggleAllBySop: (sop: string, enabled: boolean) => void;
};

export const KeywordHierarchy = ({
  groups,
  activeGroupIds,
  onToggle,
  onToggleAllBySop,
}: KeywordHierarchyProps) => {
  const [expandedSops, setExpandedSops] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const activeSet = useMemo(() => new Set(activeGroupIds), [activeGroupIds]);

  const groupedBySop = useMemo(() => {
    const filtered = groups.filter((group) => {
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        group.sop.toLowerCase().includes(term) ||
        group.category.toLowerCase().includes(term) ||
        group.subcategory?.toLowerCase().includes(term) ||
        group.keywords.some((keyword) => keyword.toLowerCase().includes(term))
      );
    });

    return filtered.reduce<Record<string, KeywordGroup[]>>((acc, group) => {
      acc[group.sop] = acc[group.sop] ? [...acc[group.sop], group] : [group];
      return acc;
    }, {});
  }, [groups, search]);

  const toggleExpand = (sop: string) => {
    setExpandedSops((prev) => {
      const next = new Set(prev);
      if (next.has(sop)) next.delete(sop);
      else next.add(sop);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-white/90 p-4 shadow-sm backdrop-blur">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter className="h-4 w-4" /> Keyword taxonomy
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Toggle SOP tracks and granular keyword collections to refine monitoring.
        </p>
      </div>

      <input
        type="search"
        placeholder="Filter by SOP, category, or keyword"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="w-full rounded-lg border border-border/90 bg-white px-3 py-2 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      />

      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {Object.entries(groupedBySop).map(([sop, sopGroups]) => {
          const isExpanded = expandedSops.has(sop);
          const total = sopGroups.length;
          const enabled = sopGroups.filter((group) => activeSet.has(group.id)).length;
          const allActive = enabled === total;

          return (
            <div key={sop} className="rounded-xl border border-slate-200 bg-slate-50/80">
              <button
                type="button"
                onClick={() => toggleExpand(sop)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{sop}</p>
                  <p className="text-xs text-slate-500">
                    {enabled}/{total} active collections
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={allActive}
                      onChange={(event) => onToggleAllBySop(sop, event.target.checked)}
                    />
                    All
                  </label>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-3 text-sm">
                  {sopGroups.map((group) => (
                    <label
                      key={group.id}
                      className={clsx(
                        "flex cursor-pointer select-none flex-col gap-1 rounded-lg border px-3 py-2 transition",
                        activeSet.has(group.id)
                          ? "border-accent bg-accent-soft"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={activeSet.has(group.id)}
                          onChange={() => onToggle(group.id)}
                        />
                        {group.category}
                        {group.subcategory ? (
                          <span className="text-xs font-normal text-slate-500">
                            · {group.subcategory}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500">
                        {group.keywords.slice(0, 6).join(", ")}
                        {group.keywords.length > 6 ? "…" : ""}
                      </p>
                      {group.companies.length > 0 && (
                        <p className="text-[11px] text-slate-400">
                          Companies: {group.companies.slice(0, 4).join(", ")}
                          {group.companies.length > 4 ? "…" : ""}
                        </p>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {groups.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
            Upload your XLSX strategy to activate the monitoring workspace.
          </p>
        )}
      </div>
    </div>
  );
};
