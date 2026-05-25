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
  const defaultAddress = companies.filter(
    (c) => c.address_status === "Default Address"
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
      color: "bg-primary/10 text-primary",
      hint: "All companies in portfolio",
    },
    {
      title: "Active",
      value: active,
      icon: CheckCircle,
      color: "bg-success/10 text-success",
      hint: "Currently trading",
    },
    {
      title: "Pending Sale",
      value: pendingSale,
      icon: TrendingUp,
      color: "bg-warning/10 text-warning",
      hint: "Awaiting transfer",
    },
    {
      title: "Sold / Transferred",
      value: sold,
      icon: Truck,
      color: "bg-info/10 text-info",
      hint: "Completed transfers",
    },
    {
      title: "Strike Off",
      value: strikeOff,
      icon: AlertTriangle,
      color: "bg-destructive/10 text-destructive",
      hint: "Pending or struck off",
    },
    {
      title: "AD01 Pending",
      value: ad01Pending,
      icon: FileText,
      color: "bg-chart-3/10 text-chart-3",
      hint: "Address filings to do",
    },
    {
      title: "Address Mismatch",
      value: addressMismatch,
      icon: MapPin,
      color: "bg-chart-4/10 text-chart-4",
      hint: "vs Companies House",
    },
    {
      title: "Not Synced",
      value: notSynced,
      icon: RefreshCw,
      color: "bg-muted/50 text-muted-foreground",
      hint: "Need CH sync",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                {card.title}
              </p>
              <p className="text-2xl font-bold mt-1 tabular-nums">{card.value}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
                {card.hint}
              </p>
            </div>
            <div className={`rounded-lg p-2 shrink-0 ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
