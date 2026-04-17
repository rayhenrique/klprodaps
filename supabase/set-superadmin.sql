-- Promove o usuário rayhenrique@gmail.com para superadmin.
-- Requer que o schema principal já tenha sido aplicado antes.

insert into public.perfis (id, nome_completo, role, ubs_id)
values (
  'b859d93e-7ae7-42d1-a3a4-7b64942bbedf',
  'Ray Henrique',
  'superadmin',
  null
)
on conflict (id) do update
set
  nome_completo = excluded.nome_completo,
  role = 'superadmin',
  ubs_id = null,
  updated_at = timezone('utc', now());
