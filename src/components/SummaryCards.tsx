import {
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Truck,
  Home,
  Clock,
  KeyRound,
  FileCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Company } from "@/types";
import { COUNTERS } from "@/lib/companyRules";

interface Props {
  companies: Company[];
}

interface HeroCard {
  title: string;
  value: number;
  icon: LucideIcon;
  filter: string;
  tone: "success" | "warning" | "danger" | "alert";
  hint: string;
}

interface MiniCard {
  title: string;
  value: number;
  icon: LucideIcon;
  filter: string;
  tone: "success" | "warning" | "danger" | "alert";
  hint: string;
}


const TONE: Record<HeroCard["tone"], { ring: string; iconBg: string; valueText: string; bar: string; glow: string }> = {
  success: {
    ring: "ring-emerald-500/20 hover:ring-emerald-500/60",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    valueText: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    glow: "kpi-glow-success",
  },
  warning: {
    ring: "ring-amber-500/20 hover:ring-amber-500/60",
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    valueText: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    glow: "kpi-glow-warning",
  },
  danger: {
    ring: "ring-rose-500/20 hover:ring-rose-500/60",
    iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    valueText: "text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
    glow: "kpi-glow-danger",
  },
  alert: {
    ring: "ring-orange-500/20 hover:ring-orange-500/60",
    iconBg: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    valueText: "text-orange-600 dark:text-orange-400",
    bar: "bg-orange-500",
    glow: "kpi-glow-alert",
  },
};


export function SummaryCards({ companies }: Props) {
  // Hero KPIs — the 4 things staff act on FIRST
  const hero: HeroCard[] = [
    {
      title: "Ready to Sell",
      value: COUNTERS.readyToSell(companies),
      icon: Sparkles,
      filter: "ready-to-sell",
      tone: "success",
      hint: "Clean inventory ready for transfer",
    },
    {
      title: "Auth Missing",
      value: COUNTERS.authMissing(companies),
      icon: KeyRound,
      filter: "auth-missing",
      tone: "warning",
      hint: "Active companies without auth code",
    },
    {
      title: "Default Address",
      value: COUNTERS.defaultAddress(companies),
      icon: Home,
      filter: "default-address",
      tone: "alert",
      hint: "PO Box / Cardiff registered",
    },
    {
      title: "Strike Off",
      value: COUNTERS.strikeOff(companies),
      icon: AlertTriangle,
      filter: "strike-off",
      tone: "danger",
      hint: "Notices requiring urgent action",
    },
  ];

  // Secondary stats — context, not action
  const mini: MiniCard[] = [
    { title: "Total", value: COUNTERS.total(companies), icon: Building2 },
    { title: "Active", value: COUNTERS.active(companies), icon: CheckCircle, filter: "active" },
    { title: "Available", value: COUNTERS.available(companies), icon: TrendingUp, filter: "pending-sale" },
    { title: "Dissolved", value: COUNTERS.dissolved(companies), icon: AlertTriangle, filter: "dissolved", muted: true },
    { title: "Sold", value: COUNTERS.sold(companies), icon: Truck, filter: "sold", muted: true },
  ];

  return (
    <div className="space-y-2">
      {/* Tier 1 — Hero Priority KPIs (compact, 4 across on laptop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {hero.map((c, i) => {
          const t = TONE[c.tone];
          return (
            <Link
              key={c.title}
              to="/"
              search={{ filter: c.filter }}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`group relative overflow-hidden rounded-lg border bg-card px-3 py-2.5 shadow-sm ring-1 ${t.ring} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg animate-fade-in card-glow card-glow-${c.tone === "success" ? "emerald" : c.tone === "warning" ? "amber" : c.tone === "danger" ? "rose" : "orange"}`}
            >
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${t.bar} opacity-80`} />
              <div className="relative flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                    {c.title}
                  </p>
                  <p className={`text-2xl font-bold mt-0.5 tabular-nums leading-none ${t.valueText}`}>
                    {c.value}
                  </p>
                </div>
                <div className={`rounded-md p-1.5 shrink-0 ${t.iconBg}`}>
                  <c.icon className="h-4 w-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tier 2 — Secondary context strip (8-up on laptop, single row) */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
        {mini.map((c, i) => {
          const inner = (
            <div className={`group h-full rounded-md border bg-card/60 px-2 py-1.5 transition-colors hover:bg-card hover:border-border card-glow ${c.muted ? "opacity-70 hover:opacity-100" : ""}`}>
              <div className="flex items-center gap-1 mb-0.5">
                <c.icon className="h-3 w-3 text-muted-foreground shrink-0" />
                <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                  {c.title}
                </p>
              </div>
              <p className="text-base font-semibold tabular-nums leading-tight">{c.value}</p>
            </div>
          );
          return (
            <Link
              key={c.title}
              to="/"
              search={c.filter ? { filter: c.filter } : {}}
              style={{ animationDelay: `${(i + 4) * 30}ms` }}
              className="animate-fade-in"
            >
              {inner}
            </Link>
          );
        })}
      </div>

    </div>
  );
}
