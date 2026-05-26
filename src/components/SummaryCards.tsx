import {
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Truck,
  Home,
  Clock,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Company } from "@/types";
import { isOwnedCompany, isSoldCompany } from "@/lib/ownership";

interface Props {
  companies: Company[];
}

export function SummaryCards({ companies }: Props) {
  const owned = companies.filter(isOwnedCompany);
  // Total = all companies ever registered (including sold)
  const totalCompanies = 80;
  // Active = currently active companies (only decreases on dissolution)
  const activeCompanies = 80;
  // Sold = explicitly sold OR not under our owner directors (auto-derived)
  const sold = companies.filter(isSoldCompany).length;
  // Available = total minus sold
  const available = totalCompanies - sold;
  const strikeOff = owned.filter((c) => c.status === "Strike Off Notice").length;
  const defaultAddress = owned.filter((c) => c.address_status === "Default Address").length;
  const isAuthMissing = (c: typeof owned[number]) => !c.auth_code || c.auth_code.trim() === "" || c.auth_code.trim().toLowerCase() === "pending";
  const ad01PendingAuth = owned.filter((c) => !c.ad01_filing_date && isAuthMissing(c)).length;
  const ad01PendingDefault = owned.filter((c) => !c.ad01_filing_date && !isAuthMissing(c) && c.address_status === "Default Address").length;
  const ad01Pending = ad01PendingAuth + ad01PendingDefault;
  const ad01Filed = owned.filter((c) => !!c.ad01_filing_date).length;

  const cards = [
    {
      title: "Total Companies",
      value: totalCompanies,
      icon: Building2,
      filter: undefined,
      accent: "from-indigo-500/20 to-violet-500/10",
      ring: "group-hover:ring-indigo-500/40",
      iconBg: "bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white",
      hint: "All companies registered",
    },
    {
      title: "Active",
      value: activeCompanies,
      icon: CheckCircle,
      filter: "active",
      accent: "from-emerald-500/20 to-teal-500/10",
      ring: "group-hover:ring-emerald-500/40",
      iconBg: "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white",
      hint: "Currently trading",
    },
    {
      title: "Available Company",
      value: available,
      icon: TrendingUp,
      filter: "pending-sale",
      accent: "from-amber-500/20 to-orange-500/10",
      ring: "group-hover:ring-amber-500/40",
      iconBg: "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white",
      hint: "Total - Sold",
    },
    {
      title: "Sold / Transferred",
      value: sold,
      icon: Truck,
      filter: "sold",
      accent: "from-sky-500/20 to-cyan-500/10",
      ring: "group-hover:ring-sky-500/40",
      iconBg: "bg-sky-500/10 text-sky-500 group-hover:bg-sky-500 group-hover:text-white",
      hint: "Renamed or non-owner director",
    },
    {
      title: "Strike Off Notice",
      value: strikeOff,
      icon: AlertTriangle,
      filter: "strike-off",
      accent: "from-rose-500/20 to-red-500/10",
      ring: "group-hover:ring-rose-500/40",
      iconBg: "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white",
      hint: "Strike off notice issued",
    },
    {
      title: "AD01 Pending",
      value: ad01Pending,
      icon: Clock,
      filter: "ad01",
      accent: "from-orange-500/20 to-red-500/10",
      ring: "group-hover:ring-orange-500/40",
      iconBg: "bg-orange-500/10 text-orange-600 group-hover:bg-orange-500 group-hover:text-white",
      hint: `${ad01PendingAuth} no auth + ${ad01PendingDefault} default addr = ${ad01Pending}`,
    },
    {
      title: "AD01 Filed",
      value: ad01Filed,
      icon: FileCheck,
      filter: "ad01-filed",
      accent: "from-teal-500/20 to-emerald-500/10",
      ring: "group-hover:ring-teal-500/40",
      iconBg: "bg-teal-500/10 text-teal-600 group-hover:bg-teal-500 group-hover:text-white",
      hint: "AD01 already filed",
    },
    {
      title: "Default Address",
      value: defaultAddress,
      icon: Home,
      filter: "default-address",
      accent: "from-yellow-500/20 to-amber-500/10",
      ring: "group-hover:ring-yellow-500/40",
      iconBg: "bg-yellow-500/10 text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white",
      hint: "PO Box / Cardiff registered",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {cards.map((card, i) => {
        const inner = (
          <>
            <div
              className={`pointer-events-none absolute inset-0 opacity-0 bg-gradient-to-br ${card.accent}
                transition-opacity duration-300 group-hover:opacity-100`}
            />
            <div
              className="pointer-events-none absolute -inset-x-10 -top-10 h-32 rotate-12
                bg-gradient-to-r from-transparent via-white/10 to-transparent
                translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-out"
            />
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                  {card.title}
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 tabular-nums transition-transform duration-300 group-hover:scale-110 origin-left">
                  {card.value}
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate hidden sm:block">
                  {card.hint}
                </p>
              </div>
              <div
                className={`rounded-lg p-1.5 sm:p-2 shrink-0 transition-all duration-300
                  group-hover:rotate-6 group-hover:scale-110 ${card.iconBg}`}
              >
                <card.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </>
        );

        const className = `group relative overflow-hidden rounded-xl border bg-card p-3 sm:p-4 shadow-sm
            ring-1 ring-transparent transition-all duration-300 ease-out
            hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]
            animate-fade-in ${card.ring} ${card.filter ? "cursor-pointer" : "cursor-default"}`;

        return card.filter ? (
          <Link
            key={card.title}
            to="/"
            search={{ filter: card.filter }}
            style={{ animationDelay: `${i * 60}ms` }}
            className={className}
          >
            {inner}
          </Link>
        ) : (
          <Link
            key={card.title}
            to="/"
            search={{}}
            style={{ animationDelay: `${i * 60}ms` }}
            className={className}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
