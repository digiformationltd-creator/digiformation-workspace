// Authentication has been removed — the dashboard is fully open.
// Everyone gets full (admin) access.
export function useUserRole() {
  return { email: null as string | null, isAdmin: true, isClient: false, loading: false };
}
