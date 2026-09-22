"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CsvImportExport() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const result = await res.json();
      if (result.imported) {
        toast.success(`Imported ${result.imported} trade${result.imported === 1 ? "" : "s"}`);
      }
      if (result.errors?.length) {
        toast.error(`${result.errors.length} row(s) skipped — see console for details`);
        console.warn("CSV import issues:", result.errors);
      }
      router.refresh();
    } catch {
      toast.error("Import failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="h-3.5 w-3.5" /> {uploading ? "Importing..." : "Import CSV"}
        </Button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a href="/api/export?type=journal">
            <Download className="h-3.5 w-3.5" /> Export Journal CSV
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a href="/api/export?type=report">
            <Download className="h-3.5 w-3.5" /> Export Performance Report
          </a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        CSV import expects columns: Date, Account, Symbol, Side, Setup, Entry, Exit, Quantity, StopLoss, TakeProfit, Fees,
        Mistake, Emotion, Notes. P&L, Risk, and R:R are always recalculated automatically — they are never trusted from the
        file. The account name must already exist.
      </p>
    </div>
  );
}
