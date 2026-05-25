import { cn } from "@/lib/utils";

interface Props {
  value: string | null | undefined;
  onSave?: (val: string | null) => void;
  type?: "text" | "date";
  placeholder?: string;
  className?: string;
  mono?: boolean;
}

/**
 * Display-only cell. Editing is performed exclusively through the pencil
 * button (EditCompanyDialog) — direct/double click no longer opens an
 * inline editor. `onSave` is kept in the API for backwards compatibility.
 */
export function EditableCell({ value, type = "text", placeholder = "—", className, mono }: Props) {
  const display =
    type === "date" && value
      ? new Date(value).toLocaleDateString("en-GB")
      : value;

  return (
    <div
      className={cn(
        "truncate px-1 -mx-1 py-0.5 min-h-[18px]",
        mono && "font-mono text-[10px]",
        !value && "text-muted-foreground",
        className,
      )}
      title={value || ""}
    >
      {display || placeholder}
    </div>
  );
}
