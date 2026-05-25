import { Search, X } from "lucide-react";
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
  "All",
  "Active",
  "Available Company",
  "Sold/Transferred",
  "Strike Off Notice",
];

const addressOptions = [
  { label: "All Addresses", value: "all" },
  { label: "Address Active", value: "Active" },
  { label: "Default Address", value: "Default Address" },
  { label: "Changed/Updated", value: "Changed/Updated" },
];

const authOptions = [
  { label: "All Auth", value: "all" },
  { label: "Auth Code Present", value: "has" },
  { label: "Auth Code Missing", value: "missing" },
];


function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(opt.value)}
          className="rounded-full text-xs h-7 px-3"
        >
          {opt.label}
        </Button>
      ))}
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
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, number, director, address, UTR, auth code, SIC..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedDirector} onValueChange={onDirectorChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Directors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Directors</SelectItem>
            {directors.map((dir) => (
              <SelectItem key={dir.id} value={dir.id}>
                {dir.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {statusOptions.map((status) => (
          <Button
            key={status}
            variant={
              status === activeStatus || (status === "All" && activeStatus === "all")
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => onStatusChange(status === "All" ? "all" : status)}
            className="rounded-full text-xs h-7 px-3"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Extra filter groups — desktop friendly, wrap on mobile */}
      <div className="hidden md:flex flex-col gap-2 pt-1 border-t">
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Address</span>
            <ChipGroup options={addressOptions} value={addressFilter} onChange={onAddressFilterChange} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Auth</span>
            <ChipGroup options={authOptions} value={authFilter} onChange={onAuthFilterChange} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">AD01</span>
            <ChipGroup options={ad01Options} value={ad01Filter} onChange={onAd01FilterChange} />
          </div>
        </div>
      </div>

      {/* Mobile: stacked compact chip groups */}
      <div className="md:hidden space-y-2 pt-1 border-t">
        <div className="pt-2">
          <ChipGroup options={addressOptions} value={addressFilter} onChange={onAddressFilterChange} />
        </div>
        <ChipGroup options={authOptions} value={authFilter} onChange={onAuthFilterChange} />
        <ChipGroup options={ad01Options} value={ad01Filter} onChange={onAd01FilterChange} />
      </div>

      {hasFilters && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground h-7"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
