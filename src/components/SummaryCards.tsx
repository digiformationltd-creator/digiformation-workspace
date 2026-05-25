import {
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Truck,
  UserCheck,
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
  const pendingDirectorVerify = companies.filter(
    (c) => c.director?.verification_status === "Pending Verification"
  ).length;

  const cards = [
    {
      title: "Total Companies",
      value: total,
      icon: Building2,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Active",
      value: active,
      icon: CheckCircle,
      color: "bg-success/10 text-success",
    },
    {
      title: "Pending Sale",
      value: pendingSale,
      icon: TrendingUp,
      color: "bg-warning/10 text-warning",
    },
    {
      title: "Sold",
      value: sold,
      icon: Truck,
      color: "bg-info/10 text-info",
    },
    {
      title: "Strike Off",
      value: strikeOff,
      icon: AlertTriangle,
      color: "bg-destructive/10 text-destructive",
    },
    {
      title: "Address Mismatch",
      value: addressMismatch,
      icon: MapPin,
      color: "bg-chart-4/10 text-chart-4",
    },
    {
      title: "Default Address",
      value: defaultAddress,
      icon: MapPin,
      color: "bg-muted/50 text-muted-foreground",
    },
    {
      title: "Pending Director Verify",
      value: pendingDirectorVerify,
      icon: UserCheck,
      color: "bg-chart-3/10 text-chart-3",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:bg-card/80"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
            <div className={`rounded-lg p-2 ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
