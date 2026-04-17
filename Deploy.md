# Deploy do ProdAPS

Este guia cobre o deploy do ProdAPS em uma VPS da Hostinger usando CloudPanel como painel de gerenciamento.

O cenário assumido aqui é:

- VPS Ubuntu 24.04
- CloudPanel já instalado
- domínio apontando para a VPS
- aplicação Next.js rodando como Node.js app atrás do NGINX do CloudPanel
- Supabase hospedando banco, auth e storage

## Arquitetura recomendada

- CloudPanel recebe o tráfego HTTPS
- NGINX do CloudPanel faz reverse proxy para a app Node.js
- ProdAPS roda com `next start`
- PM2 mantém o processo online
- Supabase fica externo à VPS

## Pré-requisitos

- VPS ativa na Hostinger
- acesso SSH
- CloudPanel funcionando
- domínio ou subdomínio configurado
- projeto Supabase criado
- Node.js `20.9+`

Observação:

O Next.js 16 exige Node.js `20.9+`. Se o CloudPanel oferecer Node 22 LTS, pode usar sem problema.

## 1. Preparar a VPS

Na Hostinger:

1. Crie a VPS com Ubuntu 24.04.
2. Instale o CloudPanel.
3. Aponte o domínio para o IP da VPS.
4. Acesse o CloudPanel em `https://IP-DA-VPS:8443`.

## 2. Criar o site Node.js no CloudPanel

No CloudPanel:

1. Clique em `Add Site`.
2. Escolha `Create a Node.js Site`.
3. Informe:
   - domínio: ex. `prodaps.seudominio.com`
   - versão do Node.js: `20` ou `22`
   - app port: `3000`
4. Conclua a criação.

O CloudPanel cria um usuário do site e um diretório parecido com:

```bash
/home/<site-user>/htdocs/<dominio>/
```

## 3. Acessar via SSH

Entre por SSH com o usuário do site criado no CloudPanel.

Exemplo:

```bash
ssh <site-user>@IP-DA-VPS
```

Entre na pasta do site:

```bash
cd /home/<site-user>/htdocs/<dominio>
```

## 4. Publicar o código

Opção recomendada com Git:

```bash
git clone https://github.com/seu-usuario/seu-repo.git .
```

Se a pasta já tiver conteúdo do CloudPanel e o clone reclamar, limpe apenas o conteúdo dessa pasta do site antes do clone.

Depois confira:

```bash
ls -la
```

Você deve ver arquivos como:

- `package.json`
- `src/`
- `supabase/`
- `.env.example`

## 5. Configurar variáveis de ambiente

Crie o arquivo `.env` de produção:

```bash
cp .env.example .env
```

Edite:

```bash
nano .env
```

Preencha no mínimo:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SYSTEM_NAME=ProdAPS
NEXT_PUBLIC_SYSTEM_TAGLINE=Governanca quantitativa em tempo real para UBS
NEXT_PUBLIC_WHATSAPP_NUMBER=5585999999999
NEXT_PUBLIC_WHATSAPP_MESSAGE=Ola! Gostaria de conhecer o ProdAPS.
```

Importante:

- `SUPABASE_SECRET_KEY` e `SUPABASE_SERVICE_ROLE_KEY` devem ficar apenas no servidor.
- nunca exponha essa chave em código client-side.

## 6. Instalar dependências

```bash
npm ci
```

Se o `node -v` mostrar uma versão errada após trocar a versão no CloudPanel, faça logout e login novamente no SSH.

## 7. Aplicar banco no Supabase

No painel do Supabase:

1. Abra o SQL Editor.
2. Execute [supabase/schema.sql](./supabase/schema.sql).
3. Se desejar, execute [supabase/seed.sql](./supabase/seed.sql).

Faça isso antes de colocar a app em produção para evitar erro de tabela/política ausente.

## 8. Build da aplicação

Ainda na pasta do projeto:

```bash
npm run build
```

Se quiser validar antes de subir:

```bash
npm run lint
npm run test
```

## 9. Rodar com PM2

Instale o PM2 globalmente:

```bash
npm install -g pm2
```

Suba a aplicação:

```bash
pm2 start npm --name prodaps -- start -- --hostname 127.0.0.1 --port 3000
```

Salve a configuração:

```bash
pm2 save
```

Configure o start automático:

```bash
pm2 startup
```

O comando acima vai devolver outro comando. Execute exatamente o comando retornado e depois rode de novo:

```bash
pm2 save
```

Comandos úteis:

```bash
pm2 status
pm2 logs prodaps
pm2 restart prodaps
pm2 stop prodaps
```

## 10. Confirmar porta no CloudPanel

No CloudPanel, confirme que o site Node.js está apontando para a mesma porta usada no PM2:

- `3000`

Essa é a porta interna da app. O acesso público continua pelo domínio no NGINX do CloudPanel.

## 11. Ativar SSL

No CloudPanel:

1. Abra o site.
2. Vá em SSL.
3. Emita o certificado Let's Encrypt.
4. Ative o redirecionamento para HTTPS.

## 12. Checklist de validação

Depois do deploy, valide:

1. Landing abre normalmente.
2. `/login` responde.
3. As variáveis públicas carregam corretamente.
4. O login no Supabase funciona.
5. O dashboard autenticado abre sem erro.
6. A VPS responde em HTTPS.
7. O PM2 mantém o processo online após reboot.

## Fluxo de atualização

Quando publicar uma nova versão:

```bash
cd /home/<site-user>/htdocs/<dominio>
git pull origin main
npm ci
npm run build
pm2 restart prodaps
```

Se houver mudança no banco:

1. aplique o SQL no Supabase;
2. depois faça o restart da aplicação.

## Troubleshooting

### App não abre no domínio

Cheque:

```bash
pm2 status
pm2 logs prodaps
```

Confirme também:

- o domínio aponta para a VPS;
- a porta configurada no CloudPanel é `3000`;
- a app iniciou sem erro de ambiente.

### Erro de build

Rode:

```bash
npm run lint
npm run build
```

Erros comuns:

- variável de ambiente ausente;
- versão incorreta do Node.js;
- falha de tipagem TypeScript;
- schema do Supabase ainda não aplicado.

### Login quebra ou dashboard não carrega

Revise:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- tabelas e policies do `schema.sql`

### Processo cai após reinício da VPS

Confirme:

```bash
pm2 save
pm2 startup
```

E execute o comando de `startup` que o PM2 mostrar.

## Boas práticas para produção

- use SSH key, não apenas senha;
- mantenha o Ubuntu atualizado;
- não exponha a porta `3000` publicamente;
- deixe o tráfego passar pelo NGINX do CloudPanel;
- faça backup das credenciais e do projeto Supabase;
- documente qualquer alteração manual feita no painel.

## Referências oficiais

- Next.js deploying: https://nextjs.org/docs/app/getting-started/deploying
- Next.js self-hosting: https://nextjs.org/docs/pages/guides/self-hosting
- Next.js 16 e requisito de Node.js: https://nextjs.org/docs/app/guides/upgrading/version-16
- Supabase SSR para Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- CloudPanel Node.js com PM2: https://www.cloudpanel.io/docs/v2/nodejs/deployment/pm2/
- CloudPanel settings e app port: https://www.cloudpanel.io/docs/v2/frontend-area/settings/
- Hostinger VPS Ubuntu: https://www.hostinger.com/vps/ubuntu-hosting
