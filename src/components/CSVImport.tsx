import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { safeDbError } from "@/lib/safeError";
import { toast } from "sonner";

interface Props {
  onSuccess: () => void;
}


// Robust CSV parser that handles quoted fields containing commas / newlines
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        cur.push(field);
        field = "";
      } else if (c === "\n") {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((v) => v && v.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = (r[idx] ?? "").trim();
      });
      return obj;
    });
}

export function CSVImport({ onSuccess }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Please upload a CSV file (export your Excel as .csv first)");
        return;
      }

      setIsUploading(true);
      try {
        const text = await file.text();
        const rows = parseCSV(text);

        if (rows.length === 0) {
          toast.error("No valid rows found in CSV");
          return;
        }

        // map flexible header names → our column names
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const pick = (r: Record<string, string>, ...keys: string[]) => {
          for (const k of keys) {
            for (const h of Object.keys(r)) {
              if (norm(h) === norm(k)) return r[h];
            }
          }
          return "";
        };

        const payload = rows
          .map((r) => {
            const name = pick(r, "company name", "company_name", "name");
            const number = pick(r, "company number", "company_number", "number");
            if (!name || !number) return null;
            return {
              company_name: name,
              company_number: number.toUpperCase(),
              incorporation_date: pick(r, "incorporation date", "incorporation_date") || null,
              company_address: pick(r, "registered address", "company address", "address") || null,
              sic_codes: pick(r, "sic codes", "sic")
                ? pick(r, "sic codes", "sic").split(/[,;]/).map((s) => s.trim()).filter(Boolean)
                : null,
              auth_code: pick(r, "auth code", "authentication code") || null,
              utr_number: pick(r, "utr number", "utr") || null,
              status: (pick(r, "status") || "Active") as never,
              tags: pick(r, "tags")
                ? pick(r, "tags").split(/[,;]/).map((s) => s.trim()).filter(Boolean)
                : null,
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>;

        if (payload.length === 0) {
          toast.error("Need at least Company Name and Company Number columns");
          return;
        }

        const { data, error } = await supabase
          .from("companies")
          .insert(payload as never)
          .select("id");
        if (error) throw safeDbError(error, "Import failed.");

        const count = data?.length ?? 0;
        setImportedCount(count);
        toast.success(`Imported ${count} companies`);
        onSuccess();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Import failed");
      } finally {
        setIsUploading(false);
      }
    },
    [onSuccess]
  );


  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">
      {importedCount > 0 && (
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="h-5 w-5" />
          <span>Successfully imported {importedCount} companies</span>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 hover:border-muted-foreground/40"
        }`}
      >
        <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop your CSV file here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Expected columns: Company Name, Company Number, Incorporation Date,
          Director Name, Company Address, SIC Codes, Auth Code, UTR Number,
          Status, Address Status, Tags
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="hidden"
          id="csv-upload"
        />
        <Button
          variant="outline"
          className="mt-4"
          disabled={isUploading}
          onClick={() => document.getElementById("csv-upload")?.click()}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {isUploading ? "Importing..." : "Select CSV"}
        </Button>
      </div>
    </div>
  );
}
