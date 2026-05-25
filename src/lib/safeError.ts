// Map a Supabase/Postgres error into a safe, user-friendly message.
// Raw error.message strings can leak schema details (column names,
// constraint names, internal codes) so never forward them to the UI.
export function safeDbError(error: unknown, fallback = "Something went wrong. Please try again."): Error {
  if (import.meta.env.DEV) console.error("[db error]", error);
  const e = error as { code?: string; message?: string } | null;
  if (e?.code === "23505") return new Error("That record already exists.");
  if (e?.code === "23503") return new Error("Related record is missing.");
  if (e?.code === "23502") return new Error("A required field is missing.");
  if (e?.code === "42501" || e?.code === "PGRST301") return new Error("You don't have permission to do that.");
  return new Error(fallback);
}
