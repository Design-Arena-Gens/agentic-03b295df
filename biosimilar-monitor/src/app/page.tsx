"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Radar, Sparkles, ShieldCheck } from "lucide-react";
import Papa from "papaparse";
import { KeywordUploader } from "@/components/KeywordUploader";
import { KeywordHierarchy } from "@/components/KeywordHierarchy";
import { FilterPanel } from "@/components/FilterPanel";
import { ResultsTable } from "@/components/ResultsTable";
import { NewsletterConfigurator } from "@/components/NewsletterConfigurator";
import {
  KeywordGroup,
  NewsletterColumn,
  NewsItem,
  SearchResponseMeta,
  TimeRange,
  WorkbookParseResult,
} from "@/types";
import { PRESET_TIME_RANGES } from "@/lib/time";

const NEWSLETTER_COLUMNS: NewsletterColumn[] = [
  {
    id: "summary",
    label: "Summary",
    description: "Auto-generated highlight from the source snippet.",
  },
  {
    id: "sop",
    label: "SOP alignment",
    description: "List the SOP tracks the story supports for compliance documentation.",
  },
  {
    id: "categories",
    label: "Category tags",
    description: "Category hierarchy used in the workbook.",
  },
  {
    id: "keywords",
    label: "Matched keywords",
    description: "Keywords triggering this capture for auditability.",
  },
  {
    id: "companies",
    label: "Companies",
    description: "Impacted organisations extracted from the workbook mappings.",
  },
  {
    id: "signal",
    label: "Signal type",
    description: "Automated signal classification (regulatory, clinical, legal, etc.).",
  },
];

const STORAGE_KEY = "biosimilar-monitoring-settings";

const defaultTimeRange = PRESET_TIME_RANGES[1];

const initialNewsletterConfig = {
  selectedColumns: ["summary", "sop", "categories", "signal"],
  includeScores: true,
  introText:
    "Welcome to the biosimilar intelligence digest. Below are curated updates filtered through SOP-aligned signals.",
  outroText:
    "Need deeper analysis or follow-up briefing? Reply to this email and our team will triage next steps.",
};

type PersistedSettings = {
  customUrls: string[];
  thresholds: { authenticity: number; marketImpact: number };
  newsletter: typeof initialNewsletterConfig;
};

const defaultThresholds = { authenticity: 45, marketImpact: 40 };

export default function Home() {
  const [groups, setGroups] = useState<KeywordGroup[]>([]);
  const [activeKeywordIds, setActiveKeywordIds] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [customUrls, setCustomUrls] = useState<string[]>([]);
  const [companyFilters, setCompanyFilters] = useState<string[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [meta, setMeta] = useState<SearchResponseMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    initialNewsletterConfig.selectedColumns,
  );
  const [includeScores, setIncludeScores] = useState(initialNewsletterConfig.includeScores);
  const [introText, setIntroText] = useState(initialNewsletterConfig.introText);
  const [outroText, setOutroText] = useState(initialNewsletterConfig.outroText);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as PersistedSettings;
      if (parsed.customUrls) setCustomUrls(parsed.customUrls);
      if (parsed.thresholds) setThresholds(parsed.thresholds);
      if (parsed.newsletter) {
        setSelectedColumns(parsed.newsletter.selectedColumns);
        setIncludeScores(parsed.newsletter.includeScores);
        setIntroText(parsed.newsletter.introText);
        setOutroText(parsed.newsletter.outroText);
      }
    } catch (err) {
      console.error("Unable to parse stored settings", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: PersistedSettings = {
      customUrls,
      thresholds,
      newsletter: {
        selectedColumns,
        includeScores,
        introText,
        outroText,
      },
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [customUrls, thresholds, selectedColumns, includeScores, introText, outroText]);

  const availableCompanies = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((group) => group.companies.forEach((company) => set.add(company)));
    return Array.from(set);
  }, [groups]);

  const filteredNews = useMemo(() => {
    if (companyFilters.length === 0) return news;
    const normalizedFilters = companyFilters.map((company) => company.toLowerCase());
    return news.filter((item) =>
      item.companies.some((company) => normalizedFilters.includes(company.toLowerCase())),
    );
  }, [news, companyFilters]);

  const runMonitoring = async () => {
    if (activeKeywordIds.length === 0) {
      setError("Select at least one SOP collection before running monitoring.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: groups,
          activeKeywordIds,
          companyFilters,
          customUrls,
          timeRange,
          filters: {
            authenticityThreshold: thresholds.authenticity,
            marketImpactThreshold: thresholds.marketImpact,
          },
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.details ?? "Search failed");
      }

      const { news: items, meta: metaPayload } = await response.json();
      setNews(items);
      setMeta(metaPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  const onParsedWorkbook = (result: WorkbookParseResult) => {
    setGroups(result.groups);
    const ids = result.groups.map((group) => group.id);
    setActiveKeywordIds(ids);
    setCompanyFilters([]);
    setNews([]);
    setMeta(null);
  };

  const toggleGroup = (id: string) => {
    setActiveKeywordIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const toggleSop = (sop: string, enabled: boolean) => {
    const ids = groups.filter((group) => group.sop === sop).map((group) => group.id);
    setActiveKeywordIds((prev) => {
      if (enabled) {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return Array.from(next);
      }
      return prev.filter((id) => !ids.includes(id));
    });
  };

  const toggleCompany = (company: string) => {
    setCompanyFilters((prev) =>
      prev.includes(company) ? prev.filter((value) => value !== company) : [...prev, company],
    );
  };

  const handleAddUrl = (url: string) => {
    setCustomUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
  };

  const handleRemoveUrl = (url: string) => {
    setCustomUrls((prev) => prev.filter((item) => item !== url));
  };

  const handleThresholdChange = (key: "authenticity" | "marketImpact", value: number) => {
    if (Number.isNaN(value)) return;
    const clamped = Math.max(0, Math.min(100, value));
    setThresholds((prev) => ({ ...prev, [key]: clamped }));
  };

  const handleExport = (items: NewsItem[]) => {
    if (items.length === 0) return;
    const rows = items.map((item) => ({
      Title: item.title,
      Link: item.link,
      Source: item.source,
      PublishedAt: item.publishedAt,
      SOPs: item.sopMatches.join("; "),
      Categories: item.categoryMatches.join("; "),
      Keywords: item.keywordMatches.join("; "),
      Companies: item.companies.join("; "),
      AuthenticityScore: Math.round(item.authenticityScore),
      MarketImpactScore: Math.round(item.marketImpactScore),
      Signal: item.signal,
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `biosimilar-news-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onToggleColumn = (id: string) => {
    setSelectedColumns((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const resultsHeadline = useMemo(() => {
    if (isLoading) return "Running signal detection…";
    if (news.length === 0) return "No insights yet";
    return `${news.length} curated insights`;
  }, [isLoading, news.length]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_45%,_#f8fafc)] pb-16">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-6 pt-12">
        <header className="flex flex-col gap-6 rounded-3xl border border-white/40 bg-white/80 p-8 shadow-xl shadow-blue-100/40 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Biosimilar News Monitoring Workspace
              </h1>
              <p className="text-sm text-slate-600">
                Upload strategy matrices, orchestrate multi-channel discovery, and deliver SOP-ready briefings.
              </p>
            </div>
            <button
              type="button"
              onClick={runMonitoring}
              disabled={isLoading || groups.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-transparent bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200/60 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
              {isLoading ? "Scanning" : "Run monitoring"}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                <Sparkles className="h-4 w-4" /> Insights
              </div>
              <p className="mt-2 text-2xl font-semibold text-blue-900">{resultsHeadline}</p>
              <p className="text-xs text-blue-700">
                {meta ? `${meta.totalBeforeFilter} signals before score gating` : "Awaiting run"}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                <ShieldCheck className="h-4 w-4" /> Authenticity
              </div>
              <p className="mt-2 text-2xl font-semibold text-emerald-900">
                ≥ {thresholds.authenticity}
              </p>
              <p className="text-xs text-emerald-700">Score gate applied across discovery channels</p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-600">
                <Sparkles className="h-4 w-4" /> Market impact
              </div>
              <p className="mt-2 text-2xl font-semibold text-violet-900">
                ≥ {thresholds.marketImpact}
              </p>
              <p className="text-xs text-violet-700">Customisable trigger threshold by campaign</p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="flex h-full flex-col gap-4">
            <KeywordUploader onParsed={onParsedWorkbook} />

            <KeywordHierarchy
              groups={groups}
              activeGroupIds={activeKeywordIds}
              onToggle={toggleGroup}
              onToggleAllBySop={toggleSop}
            />

            <FilterPanel
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              thresholds={thresholds}
              onThresholdChange={handleThresholdChange}
              availableCompanies={availableCompanies}
              activeCompanies={companyFilters}
              onCompanyToggle={toggleCompany}
              customUrls={customUrls}
              onAddCustomUrl={handleAddUrl}
              onRemoveCustomUrl={handleRemoveUrl}
            />
          </div>

          <div className="flex flex-col gap-6">
            <ResultsTable items={filteredNews} onExport={handleExport} />
            <NewsletterConfigurator
              columns={NEWSLETTER_COLUMNS}
              selectedColumns={selectedColumns}
              onToggleColumn={onToggleColumn}
              includeScores={includeScores}
              onIncludeScoresChange={setIncludeScores}
              introText={introText}
              outroText={outroText}
              onIntroTextChange={setIntroText}
              onOutroTextChange={setOutroText}
              items={filteredNews}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
