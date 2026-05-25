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
}

const statusOptions = [
  "All",
  "Active",
  "Available Company",
  "Sold/Transferred",
  "Strike Off Notice",
];

export function FilterBar({
  searchTerm,
  onSearchChange,
  selectedDirector,
  onDirectorChange,
  directors,
  activeStatus,
  onStatusChange,
}: Props) {
  const clearFilters = () => {
    onSearchChange("");
    onDirectorChange("all");
    onStatusChange("all");
  };

  const hasFilters = searchTerm || selectedDirector !== "all" || activeStatus !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, number, or UTR..."
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

      <div className="flex flex-wrap items-center gap-2">
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
            className="rounded-full text-xs"
          >
            {status}
          </Button>
        ))}

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
