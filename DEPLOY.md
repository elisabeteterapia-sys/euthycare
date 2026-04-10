# EuthyCare — Guia de Deploy VPS Hostinger

> **Stack:** Next.js 15 · Node.js/Express · Supabase (PostgreSQL) · Nginx · PM2 · SSL Let's Encrypt

---

## Visão Geral da Arquitectura

```
Internet
   │
   ▼
Nginx (443 HTTPS)
   ├── euthycare.pt     → Next.js  :3000  (PM2: euthycare-web)
   └── api.euthycare.pt → Express  :3001  (PM2: euthycare-api)
                                     │
                                     └── Supabase Cloud (PostgreSQL + Storage)
                                     └── Stripe (Pagamentos)
```

> **Nota sobre PostgreSQL:** O projecto usa **Supabase Cloud** como base de dados gerida — não é necessário instalar PostgreSQL no VPS. O Supabase é PostgreSQL hosted, com painel, backups e storage incluídos.

---

## Pré-requisitos

- VPS Hostinger Ubuntu 22.04 LTS (mínimo: 2 vCPU, 2 GB RAM, 40 GB SSD)
- Domínio configurado (ex.: `euthycare.pt`)
- Conta [Supabase](https://supabase.com) com projecto criado
- Conta [Stripe](https://stripe.com) com chaves de produção
- Acesso SSH ao servidor

---

## PASSO 1 — Configurar o VPS (uma só vez)

### 1.1 Ligar ao servidor

```bash
ssh root@IP_DO_VPS
```

### 1.2 Executar o script de setup inicial

Faz upload do script e executa:

```bash
# No teu computador local:
scp scripts/setup-vps.sh root@IP_DO_VPS:/root/

# No servidor:
bash /root/setup-vps.sh
```

O script instala automaticamente:
- Node.js 20 LTS
- PM2
- Nginx
- Certbot
- UFW (Firewall)
- Utilizador `deploy`

---

## PASSO 2 — Configurar DNS (painel Hostinger)

No painel de domínios Hostinger → **DNS Zone**:

| Tipo | Nome | Valor        | TTL  |
|------|------|--------------|------|
| A    | @    | IP_DO_VPS    | 3600 |
| A    | www  | IP_DO_VPS    | 3600 |
| A    | api  | IP_DO_VPS    | 3600 |

> Aguardar propagação DNS (até 24h, normalmente < 30 min).

Verificar: `nslookup euthycare.pt` e `nslookup api.euthycare.pt`

---

## PASSO 3 — Configurar Nginx

```bash
# Ligar como utilizador deploy
ssh deploy@IP_DO_VPS

# Copiar config (feito após upload do código — ver Passo 5)
sudo cp /var/www/euthycare/nginx/euthycare.conf /etc/nginx/sites-available/euthycare
sudo ln -s /etc/nginx/sites-available/euthycare /etc/nginx/sites-enabled/euthycare

# Substituir o domínio se for diferente de euthycare.pt
sudo sed -i 's/euthycare\.pt/SEU_DOMINIO/g' /etc/nginx/sites-available/euthycare

# Testar configuração
sudo nginx -t

# Recarregar
sudo systemctl reload nginx
```

---

## PASSO 4 — Obter Certificados SSL (Let's Encrypt)

> **Requisito:** DNS já deve estar a apontar para o VPS.

```bash
# Certificado para o frontend
sudo certbot --nginx -d euthycare.pt -d www.euthycare.pt

# Certificado para a API
sudo certbot --nginx -d api.euthycare.pt
```

Seguir as instruções interactivas do Certbot (inserir e-mail, aceitar termos).

### Renovação automática

O Certbot já configura um cron automático. Verificar:

```bash
sudo systemctl status certbot.timer
# ou testar manualmente:
sudo certbot renew --dry-run
```

---

## PASSO 5 — Enviar o Código para o Servidor

### Opção A — Git (recomendado)

```bash
# No servidor, como utilizador deploy:
cd /var/www/euthycare
git init
git remote add origin https://github.com/SEU_USER/euthycare.git
git pull origin main
```

### Opção B — rsync (upload directo do computador local)

```bash
# No teu computador local:
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='dist' \
  --exclude='.env*' \
  "c:/Claude IA/EUTHYCARE/" deploy@IP_DO_VPS:/var/www/euthycare/
```

---

## PASSO 6 — Configurar Variáveis de Ambiente

### Backend (.env)

```bash
cd /var/www/euthycare/backend
cp .env.example .env
nano .env
```

Preencher **todos** os valores:

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://euthycare.pt

SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_LOJA_WEBHOOK_SECRET=whsec_...

STORAGE_BUCKET_PRODUTOS=produtos-pdf

ADMIN_SECRET=gerar-um-valor-secreto-aleatorio
TRIAL_DAYS=30

# Price IDs do Stripe (criar no dashboard Stripe → Products)
STRIPE_PRICE_ESSENCIAL_MONTH_EUR=price_...
# ... (preencher todos os price IDs)
```

Proteger o ficheiro:
```bash
chmod 600 /var/www/euthycare/backend/.env
```

### Frontend (.env.production)

```bash
cd /var/www/euthycare/frontend
nano .env.production
```

```env
NODE_ENV=production
BACKEND_URL=https://api.euthycare.pt
NEXT_PUBLIC_API_URL=https://api.euthycare.pt
```

```bash
chmod 600 /var/www/euthycare/frontend/.env.production
```

---

## PASSO 7 — Executar Migrations da Base de Dados

As migrations ficam em `backend/supabase/migrations/`. Podem ser aplicadas de duas formas:

### Via Supabase CLI (recomendado)

```bash
# Instalar Supabase CLI (no teu computador local)
npm install -g supabase

# Ligar ao projecto
supabase link --project-ref xxxxxxxxxxxx

# Aplicar migrations
supabase db push
```

### Via SQL Editor no painel Supabase

1. Entrar em [supabase.com](https://supabase.com) → o teu projecto → **SQL Editor**
2. Abrir cada ficheiro em `backend/supabase/migrations/` por ordem numérica
3. Copiar e executar o conteúdo

Ordem das migrations:
```
001_... → 002_... → ... → 016_storage_deny_policy.sql
```

---

## PASSO 8 — Build e Arranque

```bash
cd /var/www/euthycare

# Executar o script de deploy
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

O script faz automaticamente:
1. `npm ci` no backend e frontend
2. `tsc` (build TypeScript do backend)
3. `next build` (build do frontend com `output: standalone`)
4. Copia ficheiros estáticos para `.next/standalone/`
5. `pm2 start/reload ecosystem.config.js`
6. Health check em `localhost:3001/health` e `localhost:3000`

### Arranque automático após reboot

```bash
pm2 startup
# Copiar e executar o comando que o PM2 imprime, ex:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
pm2 save
```

---

## PASSO 9 — Configurar Webhooks Stripe

No [Stripe Dashboard](https://dashboard.stripe.com) → **Developers → Webhooks**:

### Webhook de Subscriptions (billing)

- **URL:** `https://api.euthycare.pt/billing/webhook`
- **Eventos:**
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `checkout.session.completed`

### Webhook da Loja (PDFs)

- **URL:** `https://api.euthycare.pt/loja/webhook/stripe`
- **Eventos:**
  - `checkout.session.completed`
  - `payment_intent.payment_failed`

Após criar cada webhook, copiar o **Signing Secret** (`whsec_...`) para o `.env` do backend.

---

## PASSO 10 — Verificação Final

```bash
# Estado dos processos PM2
pm2 status

# Logs em tempo real
pm2 logs

# Testar endpoints
curl https://api.euthycare.pt/health
curl https://euthycare.pt
```

Checklist final:
- [ ] `https://euthycare.pt` carrega o site
- [ ] `https://api.euthycare.pt/health` retorna `{"status":"ok"}`
- [ ] SSL válido (cadeado verde no browser)
- [ ] Formulário de lista de espera funciona (`/euthy-lancamento`)
- [ ] Loja de PDFs carrega (`/loja`)
- [ ] Stripe Checkout funciona em modo live

---

## Comandos do Dia-a-Dia

```bash
# Ver estado dos processos
pm2 status

# Logs do backend
pm2 logs euthycare-api --lines 100

# Logs do frontend
pm2 logs euthycare-web --lines 100

# Reiniciar backend
pm2 restart euthycare-api

# Reiniciar frontend
pm2 restart euthycare-web

# Novo deploy (após push de código)
cd /var/www/euthycare && git pull && ./scripts/deploy.sh

# Renovar SSL manualmente
sudo certbot renew

# Testar config Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## Monitorização

```bash
# Monitorização PM2 em tempo real
pm2 monit

# Uso de recursos do servidor
htop

# Espaço em disco
df -h

# Uso de memória
free -m
```

---

## Resolução de Problemas

### Site não carrega após deploy

```bash
pm2 logs euthycare-web --lines 50
# Verificar se o build correu bem:
ls /var/www/euthycare/frontend/.next/
```

### API retorna 502 Bad Gateway

```bash
pm2 logs euthycare-api --lines 50
# Verificar se o processo está a correr:
pm2 status
# Verificar se o .env tem os valores correctos:
cat /var/www/euthycare/backend/.env | grep NODE_ENV
```

### Erro de CORS

Verificar `FRONTEND_URL` no `.env` do backend — deve ser exactamente `https://euthycare.pt` (sem trailing slash).

### Certificado SSL expirado

```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Webhook Stripe não funciona

1. Verificar que o `STRIPE_WEBHOOK_SECRET` no `.env` corresponde ao Signing Secret do Stripe Dashboard
2. Verificar logs: `pm2 logs euthycare-api | grep webhook`
3. No Stripe Dashboard → Webhooks → clicar no webhook → ver tentativas falhadas

---

## Estrutura de Ficheiros no VPS

```
/var/www/euthycare/
├── backend/
│   ├── .env                 ← variáveis de produção (600, não commitar)
│   ├── dist/                ← build TypeScript compilado
│   ├── src/
│   └── package.json
├── frontend/
│   ├── .env.production      ← variáveis de produção (600, não commitar)
│   ├── .next/               ← build Next.js
│   ├── app/
│   └── package.json
├── nginx/
│   └── euthycare.conf       ← cópia da config (o activo está em /etc/nginx/)
├── scripts/
│   ├── deploy.sh
│   └── setup-vps.sh
└── ecosystem.config.js      ← configuração PM2

/etc/nginx/sites-available/euthycare   ← config Nginx activa
/etc/letsencrypt/live/euthycare.pt/    ← certificados SSL
/var/log/pm2/                          ← logs PM2
/var/log/nginx/                        ← logs Nginx
```
