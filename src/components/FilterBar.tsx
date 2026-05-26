import { Search, X, SlidersHorizontal, MapPin, KeyRound, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Director } from "@/types";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedDirector: string;
  onDirectorChange: (value: string) => void;
  directors: Director[];
  activeStatus: string;
  onStatusChange: (status: string) => void;
  addressFilter: string;
  onAddressFilterChange: (v: string) => void;
  authFilter: string;
  onAuthFilterChange: (v: string) => void;
}

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Active", value: "Active" },
  { label: "Available Company", value: "Available Company" },
  { label: "Sold/Transferred", value: "Sold/Transferred" },
  { label: "Strike Off Notice", value: "Strike Off Notice" },
];

const addressOptions = [
  { label: "All", value: "all" },
  { label: "Address Active", value: "Active" },
  { label: "Default Address", value: "Default Address" },
  { label: "Changed/Updated", value: "Changed/Updated" },
];

const authOptions = [
  { label: "All", value: "all" },
  { label: "Auth Present", value: "has" },
  { label: "Auth Missing", value: "missing" },
];

interface FilterCardProps {
  title: string;
  icon: React.ReactNode;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  accentColor: string;
  activeColor: string;
}

function FilterCard({ title, icon, options, value, onChange, accentColor, activeColor }: FilterCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card/80 backdrop-blur-sm p-3.5 shadow-sm hover:shadow-md transition-all duration-300 group">
      {/* Subtle top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor} opacity-60`} />
      {/* Hover glow */}
      <div className={`absolute -inset-px rounded-xl ${accentColor} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

      <div className="relative">
        <div className="flex items-center gap-2 mb-2.5">
          <div className={`p-1.5 rounded-lg ${accentColor} bg-opacity-10 text-opacity-80`}>
            {icon}
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt) => {
            const isActive = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`
                  relative px-3 py-1.5 rounded-lg text-[11px] font-medium
                  transition-all duration-200 ease-out
                  ${isActive
                    ? `${activeColor} text-white shadow-md shadow-black/10 scale-[1.02] font-semibold`
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm"
                  }
                `}
              >
                {opt.label}
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white/40 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  selectedDirector,
  onDirectorChange,
  directors,
  activeStatus,
  onStatusChange,
  addressFilter,
  onAddressFilterChange,
  authFilter,
  onAuthFilterChange,
}: Props) {
  const clearFilters = () => {
    onSearchChange("");
    onDirectorChange("all");
    onStatusChange("all");
    onAddressFilterChange("all");
    onAuthFilterChange("all");
  };

  const hasFilters =
    searchTerm ||
    selectedDirector !== "all" ||
    activeStatus !== "all" ||
    addressFilter !== "all" ||
    authFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Search + Director row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search name, number, director, address, UTR, auth code, SIC..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 rounded-xl border-border/60 bg-card/60 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/30 transition-all"
          />
        </div>
        <Select value={selectedDirector} onValueChange={onDirectorChange}>
          <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl border-border/60 bg-card/60 backdrop-blur-sm">
            <SelectValue placeholder="All Directors" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Directors</SelectItem>
            {directors
              .filter((d) => d.is_owner)
              .map((dir) => (
                <SelectItem key={dir.id} value={dir.id}>
                  {dir.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FilterCard
          title="Status"
          icon={<Activity className="h-3.5 w-3.5" />}
          options={statusOptions}
          value={activeStatus}
          onChange={(v) => onStatusChange(v)}
          accentColor="bg-indigo-500"
          activeColor="bg-indigo-500"
        />
        <FilterCard
          title="Address"
          icon={<MapPin className="h-3.5 w-3.5" />}
          options={addressOptions}
          value={addressFilter}
          onChange={onAddressFilterChange}
          accentColor="bg-amber-500"
          activeColor="bg-amber-500"
        />
        <FilterCard
          title="Auth Code"
          icon={<KeyRound className="h-3.5 w-3.5" />}
          options={authOptions}
          value={authFilter}
          onChange={onAuthFilterChange}
          accentColor="bg-emerald-500"
          activeColor="bg-emerald-500"
        />
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 pt-1">
          <div className="h-px flex-1 bg-border/40" />
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1.5 text-muted-foreground hover:text-destructive h-8 rounded-full px-4 text-xs font-medium"
          >
            <X className="h-3.5 w-3.5" />
            Clear all filters
          </Button>
          <div className="h-px flex-1 bg-border/40" />
        </div>
      )}
    </div>
  );
}
