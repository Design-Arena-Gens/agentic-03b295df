"use client";

import { useRef, useState } from "react";
import { Upload, FileDown, AlertCircle } from "lucide-react";
import { parseKeywordWorkbook } from "@/lib/keywordParser";
import { WorkbookParseResult } from "@/types";

export type KeywordUploaderProps = {
  onParsed: (result: WorkbookParseResult) => void;
};

export const KeywordUploader = ({ onParsed }: KeywordUploaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("Upload keyword matrix (.xlsx)");
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const [file] = files;
    if (!file.name.endsWith(".xlsx")) {
      setError("Unsupported file type. Please upload an .xlsx workbook.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await parseKeywordWorkbook(file);
      onParsed(result);
      setStatus(
        `${file.name} · ${result.meta.rowCount} rows · ${result.meta.sheetName}`,
      );
    } catch (err) {
      console.error(err);
      setError("Failed to parse workbook. Confirm the template format.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-border bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Keyword strategy workbook</h2>
            <p className="text-sm text-slate-600">
              Map SOPs, categories, and keywords to drive automated monitoring flows.
            </p>
          </div>
        </div>

        <button
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          type="button"
          disabled={isLoading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isLoading ? "Processing…" : "Upload .xlsx"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <p className="text-sm text-foreground/80">
          {status}
        </p>

        <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-sm text-slate-600">
          <FileDown className="mt-0.5 h-4 w-4 text-accent" />
          <p>
            Columns supported: <strong>SOP</strong>, <strong>Category</strong>,
            <strong> Subcategory</strong>, <strong>Keywords</strong>, and <strong>Companies</strong>.
            Multiple keywords or companies can be comma or semicolon separated.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
