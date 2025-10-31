export type KeywordGroup = {
  id: string;
  sop: string;
  category: string;
  subcategory?: string;
  keywords: string[];
  companies: string[];
  notes?: string;
};

export type KeywordWorkbook = {
  groups: KeywordGroup[];
};

export type TimeRange = {
  from: string;
  to: string;
  label: string;
};

export type SearchRequestPayload = {
  keywords: KeywordGroup[];
  activeKeywordIds: string[];
  companyFilters: string[];
  customUrls: string[];
  timeRange: TimeRange;
  filters: {
    authenticityThreshold: number;
    marketImpactThreshold: number;
  };
};

export type NewsSignal = "regulatory" | "legal" | "commercial" | "clinical" | "supply" | "other";

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  publishedAt: string;
  source: string;
  snippet: string;
  sopMatches: string[];
  categoryMatches: string[];
  keywordMatches: string[];
  companies: string[];
  authenticityScore: number;
  marketImpactScore: number;
  signal: NewsSignal;
  type: "web" | "company" | "ai";
};

export type NewsletterColumn = {
  id: string;
  label: string;
  description: string;
};

export type NewsletterConfig = {
  selectedColumns: string[];
  introText: string;
  outroText: string;
  includeScores: boolean;
};

export type SearchResponseMeta = {
  count: number;
  totalBeforeFilter: number;
  activeGroups: number;
  timeRange: TimeRange;
};

export type ParsedWorkbookMeta = {
  sheetName: string;
  rowCount: number;
  lastUpdated?: string;
};

export type WorkbookParseResult = {
  meta: ParsedWorkbookMeta;
  groups: KeywordGroup[];
  errors: string[];
};
