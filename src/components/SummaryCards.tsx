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
  filter?: string;
  muted?: boolean;
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
    { title: "AD01 Pending", value: COUNTERS.ad01Pending(companies), icon: Clock, filter: "ad01" },
    { title: "AD01 Processing", value: COUNTERS.ad01Processing(companies), icon: Clock, filter: "ad01-processing" },
    { title: "AD01 Complete", value: COUNTERS.ad01Complete(companies), icon: FileCheck, filter: "ad01-filed" },
    { title: "Dissolved", value: COUNTERS.dissolved(companies), icon: AlertTriangle, filter: "dissolved", muted: true },
    { title: "Sold", value: COUNTERS.sold(companies), icon: Truck, filter: "sold", muted: true },
  ];

  return (
    <div className="space-y-3">
      {/* Tier 1 — Hero Priority KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {hero.map((c, i) => {
          const t = TONE[c.tone];
          return (
            <Link
              key={c.title}
              to="/"
              search={{ filter: c.filter }}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`group relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm ring-1 ${t.ring} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg animate-fade-in`}
            >
              <div className={`kpi-glow ${t.glow}`} aria-hidden="true" />
              <div className={`absolute top-0 left-0 right-0 h-1 ${t.bar} opacity-80 kpi-bar-shimmer`} />
              <div className="relative flex items-start justify-between gap-3">

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                    {c.title}
                  </p>
                  <p className={`text-3xl sm:text-4xl font-bold mt-1.5 tabular-nums leading-none ${t.valueText}`}>
                    {c.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 mt-1.5 line-clamp-1">
                    {c.hint}
                  </p>
                </div>
                <div className={`rounded-lg p-2 shrink-0 ${t.iconBg}`}>
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tier 2 — Secondary context strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {mini.map((c, i) => {
          const inner = (
            <div className={`group h-full rounded-lg border bg-card/60 px-3 py-2.5 transition-colors hover:bg-card hover:border-border ${c.muted ? "opacity-70 hover:opacity-100" : ""}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <c.icon className="h-3 w-3 text-muted-foreground shrink-0" />
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                  {c.title}
                </p>
              </div>
              <p className="text-lg font-semibold tabular-nums leading-tight">{c.value}</p>
            </div>
          );
          return c.filter ? (
            <Link
              key={c.title}
              to="/"
              search={{ filter: c.filter }}
              style={{ animationDelay: `${(i + 4) * 30}ms` }}
              className="animate-fade-in"
            >
              {inner}
            </Link>
          ) : (
            <Link
              key={c.title}
              to="/"
              search={{}}
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
