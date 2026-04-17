insert into public.global_settings (id, nome_sistema)
values (1, 'ProdAPS')
on conflict (id) do update
set nome_sistema = excluded.nome_sistema;

insert into public.ubs (nome, endereco, contato)
values
  ('UBS Centro', 'Rua Principal, 100 - Centro', '(85) 3333-1000'),
  ('UBS Lagoa', 'Av. Lagoa, 210 - Lagoa Azul', '(85) 3333-2000'),
  ('UBS Esperanca', 'Rua das Flores, 45 - Esperanca', '(85) 3333-3000')
on conflict do nothing;

with metas as (
  select id as ubs_id
  from public.ubs
  where nome in ('UBS Centro', 'UBS Lagoa', 'UBS Esperanca')
)
insert into public.configuracoes_metas (
  ubs_id,
  categoria,
  limite_regular,
  limite_suficiente,
  limite_bom,
  limite_otimo
)
select ubs_id, categoria, 100, 150, 250, 300
from metas
cross join (
  values
    ('medico'::public.meta_categoria),
    ('enfermeiro'::public.meta_categoria),
    ('odonto'::public.meta_categoria)
) as categorias(categoria)
on conflict (ubs_id, categoria) do nothing;
