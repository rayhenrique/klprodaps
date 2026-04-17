# ProdAPS

ProdAPS é um SaaS de governança em saúde para Atenção Primária, criado para substituir planilhas de produtividade por uma operação com visibilidade em tempo real.

O produto foi pensado para Secretarias Municipais de Saúde, coordenações e diretorias de UBS, com foco em:

- lançamento rápido da produção diária pelo celular;
- acompanhamento quantitativo de metas por UBS;
- painel de pendências do dia;
- observações de campo para contextualizar quedas de produção;
- isolamento de acesso por perfil com Supabase + RLS.

## Stack

- Next.js 16 + App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Lucide Icons
- Framer Motion
- Recharts
- Supabase SSR + PostgreSQL + RLS
- Vitest

## Perfis de acesso

- `superadmin`: gerencia branding, usuários e visão global do sistema
- `coordenador`: acompanha todas as UBS, metas, pendências e histórico
- `diretor`: registra e consulta dados da própria UBS

## Principais módulos

- Landing page pública
- Login
- Dashboard do diretor
- Painel da coordenação
- Área administrativa
- Formulário de produção diária
- Gauge de performance mensal
- Políticas de segurança com RLS

## Estrutura do projeto

```text
src/
  app/
    (marketing)/
    (auth)/
    (app)/
  actions/
  components/
  lib/
  types/
supabase/
  schema.sql
  seed.sql
proxy.ts
```

## Variáveis de ambiente

Use o arquivo `.env.example` como base:

```bash
cp .env.example .env.local
```

Variáveis principais:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SYSTEM_NAME`
- `NEXT_PUBLIC_SYSTEM_TAGLINE`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_WHATSAPP_MESSAGE`

## Rodando localmente

Pré-requisitos:

- Node.js `20.9+`
- npm
- projeto Supabase configurado

Instalação:

```bash
npm ci
cp .env.example .env.local
```

Depois preencha o `.env.local` e rode:

```bash
npm run dev
```

App local:

- Landing: `http://localhost:3000`
- Login: `http://localhost:3000/login`

## Banco e Supabase

Os arquivos principais estão em:

- [supabase/schema.sql](./supabase/schema.sql)
- [supabase/seed.sql](./supabase/seed.sql)

Fluxo sugerido:

1. Crie um projeto no Supabase.
2. Execute `schema.sql` no SQL Editor.
3. Execute `seed.sql` se quiser dados iniciais.
4. Configure as chaves no `.env.local`.

## Scripts úteis

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

## Build de produção

```bash
npm ci
npm run build
npm run start
```

## Regras de negócio importantes

- bloqueio de lançamento em finais de semana;
- edição restrita para diretor apenas no dia corrente;
- edição retroativa para coordenador e superadmin;
- metas quantitativas absolutas por categoria;
- cores por faixa de desempenho;
- isolamento por `ubs_id` via RLS.

## Deploy

O guia de deploy para VPS Hostinger com CloudPanel está em:

- [Deploy.md](./Deploy.md)

## Qualidade

Antes de publicar, rode:

```bash
npm run lint
npm run test
npm run build
```

## Referências

- Next.js self-hosting: https://nextjs.org/docs/pages/guides/self-hosting
- Next.js deploying: https://nextjs.org/docs/app/getting-started/deploying
- Supabase SSR para Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
