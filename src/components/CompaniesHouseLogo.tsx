import { cn } from "@/lib/utils";

/**
 * Simplified Companies House / GOV.UK style crown mark.
 * Used as a recognisable badge for links to find-and-update.company-information.service.gov.uk
 */
export function CompaniesHouseLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      {/* Crown band */}
      <path
        fill="currentColor"
        d="M3 14h18v2H3v-2zm0 3h18v1.5H3V17z"
      />
      {/* Three crown points with jewels */}
      <path
        fill="currentColor"
        d="M5 13 L3.5 7l3 2.5L8 5l1.5 4.5L12 5l2.5 4.5L16 5l1.5 4.5L20.5 7 19 13H5z"
      />
      <circle cx="12" cy="6" r="1" fill="currentColor" />
      <circle cx="6.5" cy="8" r="0.7" fill="currentColor" />
      <circle cx="17.5" cy="8" r="0.7" fill="currentColor" />
      {/* Base line */}
      <rect x="3" y="19.5" width="18" height="1" fill="currentColor" />
    </svg>
  );
}
