-- Rename enum values and consolidate strike-off statuses
UPDATE public.companies SET status = 'Strike Off Pending' WHERE status = 'Struck Off';

ALTER TYPE public.company_status RENAME VALUE 'Pending Sale' TO 'Available Company';
ALTER TYPE public.company_status RENAME VALUE 'Strike Off Pending' TO 'Strike Off Notice';