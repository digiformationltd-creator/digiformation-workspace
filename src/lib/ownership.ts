import type { Company, Director } from "@/types";

/**
 * A company is considered "ours" (still owned/active in our portfolio) if
 * its director is one of our owner directors. Companies under any other
 * director are treated as Sold/Transferred — even if the explicit status
 * field hasn't been updated yet.
 */
export function isOwnedCompany(c: Company): boolean {
  if (c.status === "Sold/Transferred") return false;
  if (!c.director) return false;
  return c.director.is_owner === true;
}

export function isSoldCompany(c: Company): boolean {
  return !isOwnedCompany(c);
}

export function ownerDirectors(directors: Director[]): Director[] {
  return directors.filter((d) => d.is_owner);
}
