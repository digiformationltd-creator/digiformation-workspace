import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null | undefined;
  onSave: (val: string | null) => void;
  type?: "text" | "date";
  placeholder?: string;
  className?: string;
  mono?: boolean;
}

export function EditableCell({ value, onSave, type = "text", placeholder = "—", className, mono }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    const next = trimmed === "" ? null : trimmed;
    if (next !== (value ?? null)) onSave(next);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value ?? "");
            setEditing(false);
          }
        }}
        className={cn(
          "w-full bg-background border border-primary/60 rounded px-1 py-0.5 text-[11px] outline-none",
          mono && "font-mono text-[10px]",
        )}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={cn(
        "cursor-text truncate hover:bg-muted/40 rounded px-1 -mx-1 py-0.5 min-h-[18px]",
        mono && "font-mono text-[10px]",
        !value && "text-muted-foreground",
        className,
      )}
      title={value || "Click to edit"}
    >
      {value || placeholder}
    </div>
  );
}
