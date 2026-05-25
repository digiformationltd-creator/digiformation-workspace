import {
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Truck,
  FileText,
  RefreshCw,
} from "lucide-react";
import type { Company } from "@/types";

interface Props {
  companies: Company[];
}

export function SummaryCards({ companies }: Props) {
  const total = companies.length;
  const active = companies.filter((c) => c.status === "Active").length;
  const sold = companies.filter((c) => c.status === "Sold/Transferred").length;
  const pendingSale = companies.filter((c) => c.status === "Pending Sale").length;
  const strikeOff = companies.filter(
    (c) => c.status === "Strike Off Pending" || c.status === "Struck Off"
  ).length;
  const addressMismatch = companies.filter(
    (c) => c.address_match_status === "Mismatched"
  ).length;
  const ad01Pending = companies.filter((c) => !c.ad01_filing_date).length;
  const notSynced = companies.filter((c) => !c.ch_company_status).length;

  const cards = [
    {
      title: "Total Companies",
      value: total,
      icon: Building2,
      accent: "from-indigo-500/20 to-violet-500/10",
      ring: "group-hover:ring-indigo-500/40",
      iconBg: "bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white",
      hint: "All companies in portfolio",
    },
    {
      title: "Active",
      value: active,
      icon: CheckCircle,
      accent: "from-emerald-500/20 to-teal-500/10",
      ring: "group-hover:ring-emerald-500/40",
      iconBg: "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white",
      hint: "Currently trading",
    },
    {
      title: "Pending Sale",
      value: pendingSale,
      icon: TrendingUp,
      accent: "from-amber-500/20 to-orange-500/10",
      ring: "group-hover:ring-amber-500/40",
      iconBg: "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white",
      hint: "Awaiting transfer",
    },
    {
      title: "Sold / Transferred",
      value: sold,
      icon: Truck,
      accent: "from-sky-500/20 to-cyan-500/10",
      ring: "group-hover:ring-sky-500/40",
      iconBg: "bg-sky-500/10 text-sky-500 group-hover:bg-sky-500 group-hover:text-white",
      hint: "Completed transfers",
    },
    {
      title: "Strike Off",
      value: strikeOff,
      icon: AlertTriangle,
      accent: "from-rose-500/20 to-red-500/10",
      ring: "group-hover:ring-rose-500/40",
      iconBg: "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white",
      hint: "Pending or struck off",
    },
    {
      title: "AD01 Pending",
      value: ad01Pending,
      icon: FileText,
      accent: "from-fuchsia-500/20 to-purple-500/10",
      ring: "group-hover:ring-fuchsia-500/40",
      iconBg: "bg-fuchsia-500/10 text-fuchsia-500 group-hover:bg-fuchsia-500 group-hover:text-white",
      hint: "Address filings to do",
    },
    {
      title: "Address Mismatch",
      value: addressMismatch,
      icon: MapPin,
      accent: "from-orange-500/20 to-pink-500/10",
      ring: "group-hover:ring-orange-500/40",
      iconBg: "bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white",
      hint: "vs Companies House",
    },
    {
      title: "Not Synced",
      value: notSynced,
      icon: RefreshCw,
      accent: "from-slate-500/20 to-zinc-500/10",
      ring: "group-hover:ring-slate-500/40",
      iconBg: "bg-slate-500/10 text-slate-500 group-hover:bg-slate-500 group-hover:text-white",
      hint: "Need CH sync",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <div
          key={card.title}
          style={{ animationDelay: `${i * 60}ms` }}
          className={`group relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm
            ring-1 ring-transparent transition-all duration-300 ease-out
            hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] cursor-default
            animate-fade-in ${card.ring}`}
        >
          {/* gradient wash on hover */}
          <div
            className={`pointer-events-none absolute inset-0 opacity-0 bg-gradient-to-br ${card.accent}
              transition-opacity duration-300 group-hover:opacity-100`}
          />
          {/* shine sweep */}
          <div
            className="pointer-events-none absolute -inset-x-10 -top-10 h-32 rotate-12
              bg-gradient-to-r from-transparent via-white/10 to-transparent
              translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-out"
          />
          <div className="relative flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                {card.title}
              </p>
              <p className="text-2xl font-bold mt-1 tabular-nums transition-transform duration-300 group-hover:scale-110 origin-left">
                {card.value}
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
                {card.hint}
              </p>
            </div>
            <div
              className={`rounded-lg p-2 shrink-0 transition-all duration-300
                group-hover:rotate-6 group-hover:scale-110 ${card.iconBg}`}
            >
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
