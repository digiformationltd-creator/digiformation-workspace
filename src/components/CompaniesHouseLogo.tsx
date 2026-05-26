import { cn } from "@/lib/utils";
import logoUrl from "@/assets/companies-house-logo.png";

/**
 * Official Companies House royal coat of arms logo.
 */
export function CompaniesHouseLogo({ className }: { className?: string }) {
  return (
    <img
      src={logoUrl}
      alt="Companies House"
      className={cn("h-4 w-4 object-contain", className)}
    />
  );
}
