import { useSyncExternalStore } from "react";

// Shared across every table on the page so one click hides/shows all auth codes.
let hidden = false;
const listeners = new Set<() => void>();

export function toggleAuthCodes() {
  hidden = !hidden;
  listeners.forEach((l) => l());
}

export function useAuthCodesHidden() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => hidden,
    () => false,
  );
}
