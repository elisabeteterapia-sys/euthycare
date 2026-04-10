#!/bin/bash
# ══════════════════════════════════════════════════════════════
#  setup-vps.sh — Configuração inicial do VPS Hostinger
#  Correr como root (ou com sudo) UMA SÓ VEZ no servidor novo
#  Uso: bash setup-vps.sh
# ══════════════════════════════════════════════════════════════

set -e

DOMAIN="euthycare.pt"
API_DOMAIN="api.euthycare.pt"
APP_USER="deploy"          # utilizador não-root para correr a app
APP_DIR="/var/www/euthycare"

echo ""
echo "════════════════════════════════════════"
echo "  EuthyCare — Configuração Inicial VPS"
echo "════════════════════════════════════════"

# ── 1. Atualizar sistema ──────────────────────────────────────
echo ""
echo "→ A atualizar pacotes do sistema..."
apt-get update -y && apt-get upgrade -y

# ── 2. Instalar dependências base ─────────────────────────────
echo ""
echo "→ A instalar dependências..."
apt-get install -y curl git unzip ufw nginx certbot python3-certbot-nginx

# ── 3. Instalar Node.js 20 LTS via nvm ───────────────────────
echo ""
echo "→ A instalar Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v && npm -v

# ── 4. Instalar PM2 globalmente ────────────────────────────────
echo ""
echo "→ A instalar PM2..."
npm install -g pm2

# ── 5. Criar utilizador deploy (se não existir) ───────────────
echo ""
echo "→ A criar utilizador '$APP_USER'..."
if ! id "$APP_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$APP_USER"
  usermod -aG sudo "$APP_USER"
fi

# ── 6. Criar pasta da aplicação ───────────────────────────────
echo ""
echo "→ A criar pasta $APP_DIR..."
mkdir -p "$APP_DIR"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
mkdir -p /var/log/pm2
chown -R "$APP_USER":"$APP_USER" /var/log/pm2

# ── 7. Firewall (UFW) ─────────────────────────────────────────
echo ""
echo "→ A configurar firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
# Não abrir 3000 nem 3001 ao público — apenas via Nginx interno
ufw --force enable
ufw status

# ── 8. Configurar Nginx ───────────────────────────────────────
echo ""
echo "→ A configurar Nginx..."
# Remover default
rm -f /etc/nginx/sites-enabled/default

echo ""
echo "════════════════════════════════════════"
echo "  PRÓXIMOS PASSOS MANUAIS:"
echo "════════════════════════════════════════"
echo ""
echo "  1. Copiar ficheiro Nginx:"
echo "     cp $APP_DIR/nginx/euthycare.conf /etc/nginx/sites-available/euthycare"
echo "     ln -s /etc/nginx/sites-available/euthycare /etc/nginx/sites-enabled/"
echo "     nginx -t && systemctl reload nginx"
echo ""
echo "  2. Apontar DNS do domínio no painel Hostinger:"
echo "     A  $DOMAIN      → IP_DO_VPS"
echo "     A  $API_DOMAIN  → IP_DO_VPS"
echo ""
echo "  3. Obter certificados SSL:"
echo "     certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "     certbot --nginx -d $API_DOMAIN"
echo ""
echo "  4. Copiar código para o servidor:"
echo "     Ver DEPLOY.md — Passo 5"
echo ""
echo "════════════════════════════════════════"
