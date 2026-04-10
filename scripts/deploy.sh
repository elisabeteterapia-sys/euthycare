#!/bin/bash
# ══════════════════════════════════════════════════════════════
#  deploy.sh — EuthyCare VPS Deploy Script
#  Uso: ./scripts/deploy.sh
#  Pré-requisito: correr na pasta raiz do projeto no VPS
#  (/var/www/euthycare)
# ══════════════════════════════════════════════════════════════

set -e  # Parar em caso de erro

APP_DIR="/var/www/euthycare"
LOG_DIR="/var/log/pm2"

echo ""
echo "════════════════════════════════════════"
echo "  EuthyCare — Deploy $(date '+%Y-%m-%d %H:%M')"
echo "════════════════════════════════════════"

# ── 1. Criar pastas de log ────────────────────────────────────
echo ""
echo "→ A criar pastas de log..."
sudo mkdir -p "$LOG_DIR"
sudo chown -R "$USER":"$USER" "$LOG_DIR"

# ── 2. Build Backend ──────────────────────────────────────────
echo ""
echo "→ A instalar dependências do backend..."
cd "$APP_DIR/backend"
npm ci --omit=dev --ignore-scripts

echo "→ A compilar TypeScript..."
npm run build

# ── 3. Build Frontend ─────────────────────────────────────────
echo ""
echo "→ A instalar dependências do frontend..."
cd "$APP_DIR/frontend"
npm ci --omit=dev

echo "→ A fazer build do Next.js..."
npm run build

# Standalone: copiar ficheiros estáticos públicos para dentro do bundle
echo "→ A copiar ficheiros estáticos para standalone..."
cp -r public .next/standalone/public 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true

# ── 4. Reiniciar PM2 ─────────────────────────────────────────
echo ""
echo "→ A reiniciar processos PM2..."
cd "$APP_DIR"

if pm2 list | grep -q "euthycare"; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi

pm2 save

# ── 5. Testar health check ────────────────────────────────────
echo ""
echo "→ A testar backend health..."
sleep 3
if curl -sf http://localhost:3001/health > /dev/null; then
  echo "   ✓ Backend OK"
else
  echo "   ✗ Backend NÃO RESPONDE — verificar logs: pm2 logs euthycare-api"
  exit 1
fi

echo ""
echo "→ A testar frontend..."
if curl -sf http://localhost:3000 > /dev/null; then
  echo "   ✓ Frontend OK"
else
  echo "   ✗ Frontend NÃO RESPONDE — verificar logs: pm2 logs euthycare-web"
  exit 1
fi

echo ""
echo "════════════════════════════════════════"
echo "  ✓ Deploy concluído com sucesso!"
echo "════════════════════════════════════════"
echo ""
