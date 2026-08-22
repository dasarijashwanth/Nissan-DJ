"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import type { MonthlyReport } from "@/lib/types";

export interface ExportMenuProps {
  month: number;
  year: number;
  userEmail: string;
}

export function ExportMenu({ month, year, userEmail }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleExport(format: "pdf" | "xlsx") {
    setOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}&year=${year}`);
      if (!res.ok) return;
      const report: MonthlyReport = await res.json();

      if (format === "pdf") {
        const { generatePdfReport } = await import("@/lib/exportPdf");
        generatePdfReport(report, userEmail);
      } else {
        const { generateXlsxReport } = await import("@/lib/exportXlsx");
        generateXlsxReport(report);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/[0.08] px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-black/[0.04] disabled:opacity-50"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-lg border border-black/[0.08] bg-surface-card shadow-lg">
          <button
            onClick={() => handleExport("pdf")}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-black/[0.04]"
          >
            <FileText className="size-4" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport("xlsx")}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-black/[0.04]"
          >
            <FileSpreadsheet className="size-4" />
            Export XLSX
          </button>
        </div>
      )}
    </div>
  );
}
