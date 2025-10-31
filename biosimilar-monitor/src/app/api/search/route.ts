import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchKeywordNews, mergeNewsByLink } from "@/lib/rss";
import { fetchCompanySources } from "@/lib/companySources";
import { KeywordGroup, SearchRequestPayload } from "@/types";

const payloadSchema = z.object({
  keywords: z.array(
    z.object({
      id: z.string(),
      sop: z.string(),
      category: z.string(),
      subcategory: z.string().optional(),
      keywords: z.array(z.string()),
      companies: z.array(z.string()),
      notes: z.string().optional(),
    }),
  ),
  activeKeywordIds: z.array(z.string()),
  companyFilters: z.array(z.string()),
  customUrls: z.array(z.string().url().or(z.string().min(1))).default([]),
  timeRange: z.object({
    from: z.string(),
    to: z.string(),
    label: z.string(),
  }),
  filters: z.object({
    authenticityThreshold: z.number().min(0).max(100),
    marketImpactThreshold: z.number().min(0).max(100),
  }),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = payloadSchema.parse(json) as SearchRequestPayload;

    const groupById = new Map(parsed.keywords.map((group) => [group.id, group]));
    const activeGroups: KeywordGroup[] = parsed.activeKeywordIds
      .map((id) => groupById.get(id))
      .filter((group): group is KeywordGroup => Boolean(group));

    if (activeGroups.length === 0) {
      return NextResponse.json({ news: [], meta: { count: 0 } });
    }

    const keywordNews = await Promise.all(
      activeGroups.map((group) => fetchKeywordNews(group, parsed.timeRange)),
    );

    const companyTargets = parsed.customUrls.filter(Boolean);
    const companyNews = await fetchCompanySources(companyTargets, activeGroups, parsed.timeRange);

    const merged = mergeNewsByLink([...keywordNews.flat(), ...companyNews]);

    const filtered = merged.filter(
      (item) =>
        item.authenticityScore >= parsed.filters.authenticityThreshold &&
        item.marketImpactScore >= parsed.filters.marketImpactThreshold,
    );

    return NextResponse.json({
      news: filtered,
      meta: {
        count: filtered.length,
        totalBeforeFilter: merged.length,
        activeGroups: activeGroups.length,
        timeRange: parsed.timeRange,
      },
    });
  } catch (error) {
    console.error("Search API error", error);
    return NextResponse.json(
      {
        error: "Failed to process search request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
