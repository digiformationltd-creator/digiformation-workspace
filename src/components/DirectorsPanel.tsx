import { useMemo, useState } from "react";
import { UserCircle2, ArrowUpDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Company, Director } from "@/types";

interface Props {
  companies: Company[];
  directors: Director[];
  selectedDirector: string;
  onSelectDirector: (id: string) => void;
}

type SortKey = "count" | "name";

export function DirectorsPanel({
  companies,
  directors,
  selectedDirector,
  onSelectDirector,
}: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("count");

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    let unassigned = 0;
    for (const c of companies) {
      if (c.director_id) counts.set(c.director_id, (counts.get(c.director_id) ?? 0) + 1);
      else unassigned++;
    }
    let list = directors.map((d) => ({
      id: d.id,
      name: d.name,
      count: counts.get(d.id) ?? 0,
    }));
    if (search) {
      const t = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(t));
    }
    list.sort((a, b) =>
      sortKey === "count" ? b.count - a.count : a.name.localeCompare(b.name)
    );
    return { list, unassigned };
  }, [companies, directors, search, sortKey]);

  const maxCount = rows.list.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserCircle2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Directors</h2>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {directors.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setSortKey(sortKey === "count" ? "name" : "count")}
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortKey === "count" ? "By Count" : "By Name"}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search directors..."
          className="h-8 pl-7 text-xs"
        />
      </div>

      <div className="max-h-[280px] overflow-y-auto space-y-1 -mx-1 px-1">
        <button
          onClick={() => onSelectDirector("all")}
          className={`w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
            selectedDirector === "all"
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted/50"
          }`}
        >
          <span>All Directors</span>
          <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
            {companies.length}
          </Badge>
        </button>

        {rows.unassigned > 0 && (
          <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground">
            <span className="italic">Unassigned</span>
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              {rows.unassigned}
            </Badge>
          </div>
        )}

        {rows.list.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No directors found
          </p>
        ) : (
          rows.list.map((d) => {
            const active = selectedDirector === d.id;
            return (
              <button
                key={d.id}
                onClick={() => onSelectDirector(active ? "all" : d.id)}
                className={`w-full group rounded-md px-2 py-1.5 transition-colors ${
                  active ? "bg-primary/10" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs truncate ${
                      active ? "text-primary font-medium" : ""
                    }`}
                  >
                    {d.name}
                  </span>
                  <Badge
                    variant={active ? "default" : "outline"}
                    className="h-5 px-1.5 text-[10px] shrink-0"
                  >
                    {d.count}
                  </Badge>
                </div>
                <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary/60 transition-all"
                    style={{ width: `${(d.count / maxCount) * 100}%` }}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedDirector !== "all" && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs gap-1"
          onClick={() => onSelectDirector("all")}
        >
          <X className="h-3 w-3" />
          Clear filter
        </Button>
      )}
    </div>
  );
}
