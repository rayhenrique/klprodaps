# Deploy do ProdAPS na VPS Hostinger com CloudPanel

Este guia cobre o deploy do ProdAPS na sua VPS Hostinger `72.60.142.2`, usando CloudPanel para gerenciar o site Node.js.

Este documento foi ajustado para o seu cenário atual:

- VPS: `72.60.142.2`
- domínio: `prodaps.kltecnologia.com`
- repositório: `https://github.com/rayhenrique/klprodaps.git`
- branch de deploy: `main`
- app port no CloudPanel: `3016`
- runtime recomendado: `Node 22 LTS`

## Visão geral

Arquitetura sugerida:

- CloudPanel recebe o tráfego HTTP/HTTPS
- NGINX do CloudPanel faz o proxy reverso para a aplicação Node.js
- o ProdAPS roda com `next start`
- PM2 mantém o processo online
- Supabase continua externo, como backend

## Requisitos

Antes de começar, confirme:

- VPS Hostinger ativa com Ubuntu 24.04
- acesso SSH com usuário `root`
- domínio `prodaps.kltecnologia.com` apontando para `72.60.142.2`
- projeto Supabase já criado
- branch `main` atualizada no GitHub

Observação:

- o Next.js 16 exige Node.js `20.9+`
- no seu caso, pode usar `Node 22 LTS` no CloudPanel sem problema

## 1. Apontar o domínio

No provedor DNS do domínio `kltecnologia.com`, crie ou confirme o registro:

- tipo: `A`
- host: `prodaps`
- valor: `72.60.142.2`

Depois valide:

```bash
nslookup prodaps.kltecnologia.com
```

O retorno deve resolver para `72.60.142.2`.

## 2. Instalar o CloudPanel na VPS

Se o CloudPanel ainda não estiver instalado, conecte na VPS:

```bash
ssh root@72.60.142.2
```

Atualize o sistema:

```bash
apt update
apt -y upgrade
apt -y install curl wget sudo
```

Instale o CloudPanel.

Exemplo com MySQL 8.4:

```bash
curl -sS https://installer.cloudpanel.io/ce/v2/install.sh -o install.sh
echo "19cfa702e7936a79e47812ff57d9859175ea902c62a68b2c15ccd1ebaf36caeb install.sh" | sha256sum -c
sudo DB_ENGINE=MYSQL_8.4 bash install.sh
```

Depois acesse:

```text
https://72.60.142.2:8443
```

Complete o onboarding do painel.

## 3. Criar o site Node.js no CloudPanel

No CloudPanel:

1. Clique em `Add Site`
2. Escolha `Create a Node.js Site`
3. Preencha os campos assim:

- `Domain Name`: `prodaps.kltecnologia.com`
- `Node.js Version`: `Node 22 LTS`
- `App Port`: `3016`
- `Site User`: `kltecnologia-prodaps`
- `Site User Password`: gere uma senha forte

4. Clique em `Create`

Esse passo cria o usuário SSH do site e o diretório da aplicação.

O caminho normalmente fica assim:

```bash
/home/kltecnologia-prodaps/htdocs/prodaps.kltecnologia.com
```

## 4. Entrar no servidor com o usuário do site

Depois que o site for criado, conecte usando o usuário do site:

```bash
ssh kltecnologia-prodaps@72.60.142.2
```

Entre na pasta do projeto:

```bash
cd /home/kltecnologia-prodaps/htdocs/prodaps.kltecnologia.com
```

## 5. Publicar o código da branch main

Clone diretamente a branch `main`:

```bash
git clone --branch main https://github.com/rayhenrique/klprodaps.git .
```

Se a pasta já tiver arquivos criados automaticamente pelo CloudPanel e o clone reclamar, limpe apenas o conteúdo da pasta do site antes de clonar.

Depois confira:

```bash
ls -la
```

Você deve ver pelo menos:

- `package.json`
- `src/`
- `supabase/`
- `.env.example`
- `next.config.ts`

Observação:

- o arquivo `.env.example` faz parte do repositório e deve estar disponível logo após o `git clone`

## 6. Criar o arquivo .env de produção

Ainda na pasta do projeto:

```bash
cp .env.example .env
nano .env
```

Preencha com os valores reais do Supabase e do sistema.

Exemplo:

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

Regras importantes:

- use `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` no servidor
- nunca exponha essas chaves no client
- não suba `.env` para o GitHub

## 7. Aplicar o banco no Supabase

No SQL Editor do Supabase:

1. execute [supabase/schema.sql](./supabase/schema.sql)
2. se quiser dados iniciais, execute [supabase/seed.sql](./supabase/seed.sql)
3. se precisar restaurar o superadmin, execute [supabase/set-superadmin.sql](./supabase/set-superadmin.sql)

Faça isso antes de subir a app pela primeira vez.

## 8. Instalar dependências

No servidor:

```bash
npm ci
```

Se o `node -v` estiver diferente da versão selecionada no CloudPanel, abra uma nova sessão SSH com o usuário do site.

## 9. Build de produção

Rode:

```bash
npm run lint
npm run build
```

Se quiser validar testes:

```bash
npm run test
```

## 10. Instalar e configurar PM2

Instale o PM2 globalmente:

```bash
npm install -g pm2
```

Suba a aplicação na mesma porta configurada no CloudPanel:

```bash
pm2 start npm --name prodaps -- start -- --hostname 127.0.0.1 --port 3016
```

Salve o processo:

```bash
pm2 save
```

Ative o startup automático:

```bash
pm2 startup
```

O PM2 vai devolver um comando adicional. Execute esse comando e depois rode:

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

## 11. Confirmar a porta no CloudPanel

No CloudPanel, o site Node.js deve continuar apontando para:

- `3016`

Ou seja:

- CloudPanel escuta no domínio público
- a app Node.js responde internamente em `127.0.0.1:3016`

## 12. Ativar SSL

No CloudPanel:

1. abra o site `prodaps.kltecnologia.com`
2. vá em `SSL`
3. emita o certificado Let's Encrypt
4. confirme que o domínio já resolve para `72.60.142.2`

Depois valide no navegador:

```text
https://prodaps.kltecnologia.com
```

## 13. Checklist da instalação inicial

Depois da instalação, confirme:

1. a landing abre em `https://prodaps.kltecnologia.com`
2. `/login` responde
3. o login no Supabase funciona
4. o dashboard autenticado abre
5. o PM2 está online
6. o SSL está ativo
7. a porta usada pela app é `3016`

## Atualização de versão mantendo a branch main

Quando você publicar alterações novas no GitHub, o fluxo de atualização será sempre a partir da branch `main`.

Conecte no servidor:

```bash
ssh kltecnologia-prodaps@72.60.142.2
cd /home/kltecnologia-prodaps/htdocs/prodaps.kltecnologia.com
```

Atualize o código:

```bash
git pull origin main
```

Reinstale dependências se necessário:

```bash
npm ci
```

Rebuild:

```bash
npm run build
```

Reinicie a app:

```bash
pm2 restart prodaps
```

Se houve mudança no banco:

1. aplique o SQL no Supabase
2. só depois reinicie o PM2

## Fluxo rápido de atualização

Este é o fluxo padrão que você provavelmente vai usar no dia a dia:

```bash
ssh kltecnologia-prodaps@72.60.142.2
cd /home/kltecnologia-prodaps/htdocs/prodaps.kltecnologia.com
git pull origin main
npm ci
npm run build
pm2 restart prodaps
```

## Troubleshooting

### O site não abre

Cheque:

```bash
pm2 status
pm2 logs prodaps
```

E confirme:

- o domínio aponta para `72.60.142.2`
- a porta no CloudPanel é `3016`
- a app está rodando em PM2

### Erro de build

Rode:

```bash
npm run lint
npm run build
```

Problemas comuns:

- variável de ambiente ausente
- SQL do Supabase não aplicado
- conflito de tipagem
- dependências desatualizadas

### Login quebra

Revise:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `schema.sql` aplicado corretamente

### PM2 não sobe após reboot

Rode novamente:

```bash
pm2 startup
pm2 save
```

## Boas práticas

- mantenha o deploy sempre saindo da branch `main`
- não faça edição manual de código direto na VPS
- registre qualquer ajuste operacional no repositório
- preserve `.env` apenas no servidor
- use backups do Supabase antes de mudanças destrutivas

## Referências oficiais

- CloudPanel instalação: https://www.cloudpanel.io/docs/v2/getting-started/other/
- CloudPanel Add Site: https://www.cloudpanel.io/docs/v2/frontend-area/add-site/
- CloudPanel PM2 para Node.js: https://www.cloudpanel.io/docs/v2/nodejs/deployment/pm2/
- CloudPanel stack suportada: https://www.cloudpanel.io/docs/v2/technology-stack/
- Next.js self-hosting: https://nextjs.org/docs/pages/guides/self-hosting
- Next.js deploy: https://nextjs.org/docs/app/getting-started/deploying
