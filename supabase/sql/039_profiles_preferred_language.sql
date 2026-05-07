-- 039_profiles_preferred_language.sql
-- Add persistent user language preference for ERP i18n.

alter table public.profiles
add column if not exists preferred_language text null;

update public.profiles
set preferred_language = coalesce(nullif(trim(preferred_language), ''), 'fr')
where preferred_language is null or trim(preferred_language) = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_preferred_language_check'
  ) then
    alter table public.profiles
    add constraint profiles_preferred_language_check
    check (preferred_language is null or lower(preferred_language) in ('fr', 'en', 'zh', 'pt'));
  end if;
end $$;
