create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'user_role'
  ) then
    create type public.user_role as enum ('superadmin', 'coordenador', 'diretor');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'meta_categoria'
  ) then
    create type public.meta_categoria as enum ('medico', 'enfermeiro', 'odonto');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.prevent_delete_ubs_with_directors()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.perfis
    where ubs_id = old.id
      and role = 'diretor'::public.user_role
  ) then
    raise exception 'Nao e possivel excluir a UBS enquanto houver diretor vinculado a ela.';
  end if;

  return old;
end;
$$;

create or replace function public.local_today()
returns date
language sql
stable
as $$
  select (timezone('America/Fortaleza', now()))::date;
$$;

create or replace function public.is_business_day(target_date date default public.local_today())
returns boolean
language sql
stable
as $$
  select extract(dow from target_date) not in (0, 6);
$$;

create table if not exists public.ubs (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text not null,
  contato text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_completo text not null,
  role public.user_role not null,
  ubs_id uuid references public.ubs (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint perfis_diretor_requires_ubs check (
    role <> 'diretor'::public.user_role or ubs_id is not null
  )
);

create table if not exists public.configuracoes_metas (
  id uuid primary key default gen_random_uuid(),
  ubs_id uuid not null references public.ubs (id) on delete cascade,
  categoria public.meta_categoria not null,
  limite_regular integer not null check (limite_regular >= 0),
  limite_suficiente integer not null check (limite_suficiente > limite_regular),
  limite_bom integer not null check (limite_bom > limite_suficiente),
  limite_otimo integer not null check (limite_otimo > limite_bom),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint configuracoes_metas_ubs_categoria_unique unique (ubs_id, categoria)
);

create table if not exists public.producao_diaria (
  id uuid primary key default gen_random_uuid(),
  ubs_id uuid not null references public.ubs (id) on delete cascade,
  criado_por uuid not null references public.perfis (id) on delete restrict,
  data date not null,
  medico integer not null default 0 check (medico >= 0),
  enfermeiro integer not null default 0 check (enfermeiro >= 0),
  odonto integer not null default 0 check (odonto >= 0),
  receitas integer not null default 0 check (receitas >= 0),
  notificacoes integer not null default 0 check (notificacoes >= 0),
  nutri integer not null default 0 check (nutri >= 0),
  psico integer not null default 0 check (psico >= 0),
  faltas integer not null default 0 check (faltas >= 0),
  observacao text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint producao_diaria_ubs_data_unique unique (ubs_id, data)
);

create table if not exists public.global_settings (
  id integer primary key default 1 check (id = 1),
  nome_sistema text not null default 'ProdAPS',
  logo_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_ubs_updated_at on public.ubs;
create trigger set_ubs_updated_at
before update on public.ubs
for each row
execute function public.set_updated_at();

drop trigger if exists prevent_delete_ubs_with_directors on public.ubs;
create trigger prevent_delete_ubs_with_directors
before delete on public.ubs
for each row
execute function public.prevent_delete_ubs_with_directors();

drop trigger if exists set_perfis_updated_at on public.perfis;
create trigger set_perfis_updated_at
before update on public.perfis
for each row
execute function public.set_updated_at();

drop trigger if exists set_configuracoes_metas_updated_at on public.configuracoes_metas;
create trigger set_configuracoes_metas_updated_at
before update on public.configuracoes_metas
for each row
execute function public.set_updated_at();

drop trigger if exists set_producao_diaria_updated_at on public.producao_diaria;
create trigger set_producao_diaria_updated_at
before update on public.producao_diaria
for each row
execute function public.set_updated_at();

drop trigger if exists set_global_settings_updated_at on public.global_settings;
create trigger set_global_settings_updated_at
before update on public.global_settings
for each row
execute function public.set_updated_at();

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.perfis
  where id = auth.uid();
$$;

create or replace function public.current_ubs_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ubs_id
  from public.perfis
  where id = auth.uid();
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'superadmin'::public.user_role;
$$;

create or replace function public.is_coordenador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'coordenador'::public.user_role;
$$;

create or replace function public.is_diretor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'diretor'::public.user_role;
$$;

create or replace function public.can_manage_backoffice()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('superadmin'::public.user_role, 'coordenador'::public.user_role);
$$;

create or replace function public.can_director_mutate_production(target_ubs uuid, target_date date)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_diretor()
    and public.current_ubs_id() = target_ubs
    and target_date = public.local_today()
    and public.is_business_day(public.local_today());
$$;

alter table public.ubs enable row level security;
alter table public.perfis enable row level security;
alter table public.configuracoes_metas enable row level security;
alter table public.producao_diaria enable row level security;
alter table public.global_settings enable row level security;

drop policy if exists "ubs_select_policy" on public.ubs;
create policy "ubs_select_policy"
on public.ubs
for select
using (
  public.can_manage_backoffice()
  or id = public.current_ubs_id()
);

drop policy if exists "ubs_manage_policy" on public.ubs;
create policy "ubs_manage_policy"
on public.ubs
for all
using (public.can_manage_backoffice())
with check (public.can_manage_backoffice());

drop policy if exists "perfis_select_policy" on public.perfis;
create policy "perfis_select_policy"
on public.perfis
for select
using (
  auth.uid() = id
  or public.is_superadmin()
);

drop policy if exists "perfis_manage_policy" on public.perfis;
create policy "perfis_manage_policy"
on public.perfis
for all
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "metas_select_policy" on public.configuracoes_metas;
create policy "metas_select_policy"
on public.configuracoes_metas
for select
using (
  public.can_manage_backoffice()
  or ubs_id = public.current_ubs_id()
);

drop policy if exists "metas_manage_policy" on public.configuracoes_metas;
create policy "metas_manage_policy"
on public.configuracoes_metas
for all
using (public.can_manage_backoffice())
with check (public.can_manage_backoffice());

drop policy if exists "producao_select_policy" on public.producao_diaria;
create policy "producao_select_policy"
on public.producao_diaria
for select
using (
  public.can_manage_backoffice()
  or ubs_id = public.current_ubs_id()
);

drop policy if exists "producao_insert_policy" on public.producao_diaria;
create policy "producao_insert_policy"
on public.producao_diaria
for insert
with check (
  (
    public.can_manage_backoffice()
  )
  or (
    public.can_director_mutate_production(ubs_id, data)
    and criado_por = auth.uid()
  )
);

drop policy if exists "producao_update_policy" on public.producao_diaria;
create policy "producao_update_policy"
on public.producao_diaria
for update
using (
  public.can_manage_backoffice()
  or public.can_director_mutate_production(ubs_id, data)
)
with check (
  public.can_manage_backoffice()
  or public.can_director_mutate_production(ubs_id, data)
);

drop policy if exists "producao_delete_policy" on public.producao_diaria;
create policy "producao_delete_policy"
on public.producao_diaria
for delete
using (public.can_manage_backoffice());

drop policy if exists "global_settings_select_policy" on public.global_settings;
create policy "global_settings_select_policy"
on public.global_settings
for select
using (true);

drop policy if exists "global_settings_manage_policy" on public.global_settings;
create policy "global_settings_manage_policy"
on public.global_settings
for all
using (public.is_superadmin())
with check (public.is_superadmin());

insert into public.global_settings (id, nome_sistema)
values (1, 'ProdAPS')
on conflict (id) do nothing;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'branding',
  'branding',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

drop policy if exists "branding_public_read" on storage.objects;
create policy "branding_public_read"
on storage.objects
for select
using (bucket_id = 'branding');

drop policy if exists "branding_superadmin_insert" on storage.objects;
create policy "branding_superadmin_insert"
on storage.objects
for insert
with check (
  bucket_id = 'branding'
  and public.is_superadmin()
);

drop policy if exists "branding_superadmin_update" on storage.objects;
create policy "branding_superadmin_update"
on storage.objects
for update
using (
  bucket_id = 'branding'
  and public.is_superadmin()
)
with check (
  bucket_id = 'branding'
  and public.is_superadmin()
);

drop policy if exists "branding_superadmin_delete" on storage.objects;
create policy "branding_superadmin_delete"
on storage.objects
for delete
using (
  bucket_id = 'branding'
  and public.is_superadmin()
);
