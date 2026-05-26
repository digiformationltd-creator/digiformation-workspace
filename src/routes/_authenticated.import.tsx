import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCompanies } from "@/hooks/useCompanies";
import { CSVImport } from "@/components/CSVImport";
import { useUserRole } from "@/hooks/useUserRole";

export const Route = createFileRoute("/_authenticated/import")({
  component: ImportPage,
});

function ImportPage() {
  const { refresh } = useCompanies();
  const { isAdmin, loading } = useUserRole();

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Companies</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bulk import your companies from a CSV file
        </p>
      </div>

      <div className="bg-card rounded-xl border p-6">
        <CSVImport onSuccess={refresh} />
      </div>

      <div className="rounded-xl border bg-muted/30 p-4">
        <h3 className="text-sm font-medium mb-2">Expected CSV Format</h3>
        <p className="text-xs text-muted-foreground">
          Your CSV should have a header row with column names. Required: Company Name, Company Number.
          Optional: Incorporation Date, Registered Address, SIC Codes (comma separated),
          Auth Code, UTR Number, Status, Address Status, Tags.
        </p>
      </div>
    </div>
  );
}
