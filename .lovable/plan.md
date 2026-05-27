
# Refactor Plan — Automation-First Rule Engine

Before any code changes, here is the full migration plan, file-by-file impact, DB strategy, backward-compatibility approach, and legacy-data cleanup.

---

## A. Migration Strategy (Big Picture)

The refactor is done in **11 ordered phases**. Each phase ships independently and the app stays usable between phases.

```text
Phase 1  → Build companyRules.ts (no UI change yet)
Phase 2  → Wire SummaryCards + filters + deriveCategory to it
Phase 3  → Remove overrides (Primary Category presets, ownership.ts auto-sold, strike-off auto-clear)
Phase 4  → Rebuild Add Company form (sectioned, no presets)
Phase 5  → Rebuild AD01 UX (Required Yes/No → status sub-select)
Phase 6  → Rebuild Edit Company dialog (same sectioned shape, no presets)
Phase 7  → Centralized counters used everywhere
Phase 8  → DB migration: backfill + audit trigger + realtime publication
Phase 9  → Shared Zod schema (Add / Edit / CSV / server fn)
Phase 10 → Activate company_status_logs via trigger
Phase 11 → Final UI polish + cleanup of dead code
```

---

## B. Files That Will Change

### New files
- `src/lib/companyRules.ts` — single source of truth: predicates, counters, category derivation, legacy-status derivation, priority ordering.
- `src/lib/companySchema.ts` — shared Zod schema (Add / Edit / CSV / server fn).
- `src/lib/companies.functions.ts` — add `createCompany` + `updateCompany` server functions that use the same Zod schema (the file already exists for CH sync; we'll extend it).

### Heavily modified
- `src/components/SummaryCards.tsx` — replace all inline predicates with `COUNTERS.*` from `companyRules.ts`.
- `src/routes/_authenticated.index.tsx` — replace inline filter logic + Add Company form. Drop Primary Category preset and "Mark Ready to Sell" checkbox.
- `src/components/EditCompanyDialog.tsx` — same. Drop presets, drop auto-clear-strike-off, drop manual legacy-`status` derivation (handled in rule engine + DB).
- `src/components/CompaniesTable.tsx` — badge + section labels read from `RULES.deriveCategory`.
- `src/components/FilterBar.tsx` — filters read from `FILTERS` map.
- `src/components/CSVImport.tsx` — uses shared Zod schema for row validation.
- `src/hooks/useCompanies.ts` — add realtime subscription that invalidates the `["companies"]` query.

### Lightly modified
- `src/lib/companyCategory.ts` — keep enum + labels, **remove** `applyCategory` (no more preset overwrites). `deriveCategory` re-exported from the rule engine.
- `src/lib/ownership.ts` — keep `isOwnedCompany` as a director-info helper, but it **no longer** classifies a company as Sold. Sold is purely `availability_status === "sold"`.

### Deleted / deprecated
- Primary Category `<Select>` from Add & Edit forms.
- "Mark as Ready to Sell" checkbox from Add & Edit forms.
- `applyCategory()` function and `PRIMARY_CATEGORY_OPTIONS` (or kept only as labels for derived display).
- Manual `legacyStatus` derivation blocks in `handleAddCompany` and `EditCompanyDialog.handleSubmit`.

---

## C. Database Migration

### Migration 1 — Backfill legacy rows (data only, no schema change)
- Set `ad01_status = 'not_required'` where the company has no address/auth issue (i.e. `address_status <> 'Default Address' AND auth_code_status <> 'missing'`) AND current value is `'pending'`.
- Recompute `status` enum from atomic flags so it agrees with the new rule engine.

### Migration 2 — Audit trigger
- Create `log_company_status_change()` trigger function.
- Attach `BEFORE UPDATE` trigger on `public.companies` that inserts into `public.company_status_logs` when `status` changes.

### Migration 3 — Generated column (optional, recommended)
- Replace the editable `status` column with a `GENERATED ALWAYS AS` column derived from `lifecycle_status / availability_status / strike_off_status`. This guarantees no drift even if data is inserted from outside the app.
- **Caveat:** Postgres generated columns can't be `UPDATE`d. We have to drop the editable column and re-create. This is the only destructive change — handled carefully with `ALTER TABLE ... DROP COLUMN status; ALTER TABLE ... ADD COLUMN status ... GENERATED ALWAYS AS (...) STORED;`.
- If you prefer to defer this risk, we can keep `status` editable and rely on the rule engine + a BEFORE INSERT/UPDATE trigger instead. **I recommend the trigger route** for safety (reversible, no column drop). Default plan = trigger.

### Migration 4 — Realtime publication
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
```

### Migration 5 — Constraints
- `CHECK (ad01_status IN ('pending','processing','completed','not_required'))`.
- `CHECK (lifecycle_status IN ('active','dissolved'))`.
- `CHECK (availability_status IN ('available','sold'))`.

No new tables, no GRANT changes, no RLS changes.

---

## D. Backward Compatibility

1. **Legacy `status` enum stays writable** during Phase 1–7. It is filled by a Postgres trigger from atomic flags. Old code paths reading `status` continue to work.
2. **`applyCategory` is removed** but `deriveCategory` keeps its existing return values (`sold | strike_off | address_default | auth_missing | ready_to_sell`), so badges and section labels render identically.
3. **CSV imports** that included a `category` column are honored only as a **hint** — the rule engine still derives the real category from atomic flags after insert.
4. **Edit dialog**: existing rows that have weird combinations (e.g. `ad01_status = completed` but `address_status = Default Address`) will show a warning chip but will not be auto-mutated. User decides explicitly.
5. **Director-based sold heuristic** (`ownership.ts`) is decommissioned. Any company that was implicitly "sold" because its director wasn't an owner gets flagged in a one-time backfill report, and `availability_status` is updated to `sold` if the row also has no owner director **and** the user confirms (we'll show a one-time review banner).

---

## E. Legacy Data Cleanup Strategy

Run as a single migration after Phase 1 is merged:

```sql
-- 1. Fix AD01 over-counting
UPDATE public.companies
SET ad01_status = 'not_required'
WHERE ad01_status = 'pending'
  AND (address_status IS DISTINCT FROM 'Default Address')
  AND (auth_code_status IS DISTINCT FROM 'missing');

-- 2. Normalize legacy `status` to match atomic flags
UPDATE public.companies
SET status = CASE
  WHEN lifecycle_status = 'dissolved'        THEN 'Dissolved'
  WHEN strike_off_status = true              THEN 'Strike Off Notice'
  WHEN availability_status = 'sold'          THEN 'Sold/Transferred'
  WHEN availability_status = 'available'     THEN 'Available Company'
  ELSE 'Active'
END;

-- 3. Mark legacy non-owner-director companies as Sold (optional, user-reviewed)
--    Run only after user confirms the audit report from the banner.
```

No rows are deleted. The cleanup is fully reversible (we'll keep a `pre_refactor_status` snapshot in `company_status_logs`).

---

## F. Detailed Module Design

### `src/lib/companyRules.ts` (Phase 1)
```text
// Single source of truth
export const PRIORITY = ['sold','strike_off','address_default',
                         'auth_missing','ad01_processing','ready_to_sell'] as const;

export const RULES = {
  isSold, isStrikeOff, isDefaultAddress, isAuthMissing,
  isAd01Required, isAd01Pending, isAd01Processing,
  isAd01Complete, isAd01NotRequired,
  isReadyToSell, isActive, isDissolved,
  derivePrimaryCategory,        // returns one of PRIORITY
  deriveSecondaryTags,          // returns array of all matching issues
  deriveLegacyStatus,           // returns CompanyStatus enum value
};

export const COUNTERS = {
  total, active, dissolved, available, sold,
  strikeOff, authMissing, defaultAddress,
  ad01Pending, ad01Processing, ad01Complete,
  readyToSell,
};

export const FILTERS: Record<FilterKey, (c: Company) => boolean> = { ... };
```

### `src/lib/companySchema.ts` (Phase 9)
- One `BaseCompanySchema` (Zod) with all atomic fields, lengths, enums, and refinements.
- `AddCompanySchema = BaseCompanySchema.required({...})`.
- `EditCompanySchema = BaseCompanySchema.partial()`.
- `CSVRowSchema = BaseCompanySchema` with coercions for string-only CSV cells.

### New AD01 UX (Phase 5)
```text
[AD01 Required?]  ( ) Yes   ( ) No

If Yes  →  [AD01 Status]  Pending | Processing | Completed
If No   →  ad01_status = "not_required" (hidden)
```
Rule engine guarantees: `not_required` never increments the Complete counter.

### New Add Company form layout (Phase 4)
```text
┌── 1. Basic Info ───────────────────────┐
│ Old Name · Current Name · Number · Date│
└────────────────────────────────────────┘
┌── 2. Company Health ───────────────────┐
│ Lifecycle: Active / Dissolved          │
└────────────────────────────────────────┘
┌── 3. Sale Status ──────────────────────┐
│ Availability: Available / Sold         │
└────────────────────────────────────────┘
┌── 4. Auth Status ──────────────────────┐
│ Auth Code · Status (Available/Missing) │
└────────────────────────────────────────┘
┌── 5. Address Status ───────────────────┐
│ Old Addr · Current Addr · Status       │
└────────────────────────────────────────┘
┌── 6. Strike Off ───────────────────────┐
│ Strike Off Notice: Yes / No            │
└────────────────────────────────────────┘
┌── 7. AD01 ─────────────────────────────┐
│ Required: Yes/No  →  Status sub-select │
└────────────────────────────────────────┘
[Director · UTR · SIC stay in Basic Info or a "Misc" section]
```
No Primary Category. No "Mark Ready to Sell". Every field is atomic.

---

## G. Risks & Open Decisions

1. **Generated `status` column** vs **trigger** — I recommend the trigger (safer, reversible). Confirm if you'd prefer the generated column.
2. **Director-based sold backfill** — needs your review of affected rows before we update them. Phase 8 will surface a one-time report.
3. **CSV columns** — should we keep the old `category` / `primary_category` column in the import template for backward compat, or drop it? My default: keep it as a hint, but ignore for placement.
4. **AD01 historical data** — Phase 1 backfill changes `pending → not_required` for clean companies. If you want a "Review" mode that lets you accept/reject each change, say so now; otherwise it runs in one shot.

---

## H. Phase-by-Phase Deliverables (what you'll see)

| Phase | Visible change |
|---|---|
| 1 | Nothing visible. New `companyRules.ts` file added. |
| 2 | Dashboard counters & filters identical to today but routed through rule engine. |
| 3 | Add/Edit forms lose Primary Category preset & "Ready to Sell" checkbox. |
| 4 | Add Company form is now sectioned and atomic. |
| 5 | AD01 UX becomes Required Yes/No → sub-select. |
| 6 | Edit Company dialog matches Add Company layout. |
| 7 | All counters share one source — no more disagreements. |
| 8 | DB migration runs: backfill + trigger + realtime. Open tabs auto-refresh. |
| 9 | Zod schema enforced in forms + CSV + server fn. |
| 10 | Audit log starts recording status changes. |
| 11 | Dead code removed (`applyCategory`, ownership-sold override). |

---

## ✅ What I need from you before implementing

1. **Go-ahead on the trigger approach** (recommended) vs the generated-column approach for `status`.
2. **Approval to run the AD01 backfill in one shot** (no per-row review).
3. **Approval to drop Primary Category presets and the "Mark Ready to Sell" checkbox** entirely (they will not return).
4. **Decision on CSV `category` column** — keep as ignored hint, or drop?

Once you confirm these four, I'll start with **Phase 1** (create `companyRules.ts`) and ship the phases one by one, asking you to verify the dashboard after each visible change.
