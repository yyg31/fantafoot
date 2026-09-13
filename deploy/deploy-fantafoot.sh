#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Fantafoot - script de deploiement pour un VPS Ubuntu (OVH ou autre)
#
# A executer SUR LE SERVEUR, avec un utilisateur ayant sudo (ex: ubuntu) :
#
#   scp deploy-fantafoot.sh ubuntu@51.79.240.69:~/
#   ssh ubuntu@51.79.240.69
#   chmod +x deploy-fantafoot.sh
#   ./deploy-fantafoot.sh
#
# Idempotent : peut etre relance sans tout casser (reclone/rebuild proprement).
# Modifiez les variables ci-dessous si besoin avant de lancer.
# ---------------------------------------------------------------------------
set -euo pipefail

REPO_URL="https://github.com/yyg31/fantafoot.git"
BRANCH="claude/fantafoot-website-tl9d59"
APP_DIR="/opt/fantafoot"
DOMAIN=""            # laissez vide pour servir directement sur l'IP du serveur
BASE_PATH="/fanta"   # sous-chemin de l'app (ex: http://IP/fanta) ; "" pour servir a la racine
APP_PORT="3000"
SERVICE_USER="${SUDO_USER:-$USER}"

log()  { echo -e "\n\033[1;32m==> $1\033[0m"; }
warn() { echo -e "\033[1;33m!! $1\033[0m"; }

if [ "$(id -u)" -eq 0 ]; then
  warn "Lance en root direct : OK, mais prefer 'sudo ./deploy-fantafoot.sh' en tant qu'utilisateur normal."
fi

log "Mise a jour du systeme et paquets de base"
sudo apt-get update -y
sudo apt-get install -y curl git nginx ufw

if ! command -v node >/dev/null 2>&1; then
  log "Installation de Node.js 20.x"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  log "Node.js deja installe: $(node -v)"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  log "Installation de PM2 (gestionnaire de process)"
  sudo npm install -g pm2
fi

HOST_PART="${DOMAIN:-$(curl -s -4 ifconfig.me)}"
PUBLIC_URL="http://${HOST_PART}${BASE_PATH}"

log "Clonage / mise a jour du depot ($BRANCH)"
if [ -d "$APP_DIR/.git" ]; then
  sudo git -C "$APP_DIR" fetch origin "$BRANCH"
  sudo git -C "$APP_DIR" checkout "$BRANCH"
  sudo git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  sudo mkdir -p "$APP_DIR"
  sudo chown "$SERVICE_USER":"$SERVICE_USER" "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
sudo chown -R "$SERVICE_USER":"$SERVICE_USER" "$APP_DIR"
cd "$APP_DIR"

log "Configuration de l'environnement (.env)"
if [ ! -f .env ]; then
  ADMIN_PASSWORD="$(openssl rand -base64 15)"
  NEXTAUTH_SECRET="$(openssl rand -base64 32)"
  cat > .env <<EOF
DATABASE_URL="file:./prod.db"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
NEXTAUTH_URL="$PUBLIC_URL"
BASE_PATH="$BASE_PATH"
NEXT_PUBLIC_BASE_PATH="$BASE_PATH"
ADMIN_EMAIL="admin@fantafoot.local"
ADMIN_PASSWORD="$ADMIN_PASSWORD"
EOF
  warn "Identifiants admin generes (notes-les, affiches une seule fois) :"
  echo "  Email    : admin@fantafoot.local"
  echo "  Mot de passe : $ADMIN_PASSWORD"
else
  log ".env existant conserve tel quel"
fi

log "Installation des dependances"
npm ci

log "Migration + seed de la base de donnees"
npx prisma migrate deploy
npx prisma db seed || true   # "|| true" : ne re-echoue pas si deja seede

log "Build de production"
npm run build

log "Demarrage / redemarrage via PM2"
pm2 delete fantafoot >/dev/null 2>&1 || true
pm2 start node_modules/.bin/next --name fantafoot -- start -p "$APP_PORT"
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$SERVICE_USER" --hp "$HOME" | tail -n1 | sudo bash || true

log "Configuration Nginx (reverse proxy)"
NGINX_SERVER_NAME="${DOMAIN:-_}"
if [ -n "$BASE_PATH" ]; then
  NGINX_LOCATIONS="
    location = / {
        return 302 ${BASE_PATH}/;
    }

    location ^~ ${BASE_PATH} {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }"
else
  NGINX_LOCATIONS="
    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }"
fi
sudo tee /etc/nginx/sites-available/fantafoot > /dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name $NGINX_SERVER_NAME;
$NGINX_LOCATIONS
}
EOF
sudo ln -sf /etc/nginx/sites-available/fantafoot /etc/nginx/sites-enabled/fantafoot
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

log "Pare-feu (ufw) - preparation des regles sans forcer l'activation"
SSH_PORT="$(sudo sshd -T 2>/dev/null | awk '/^port /{print $2; exit}')"
SSH_PORT="${SSH_PORT:-22}"
sudo ufw allow "${SSH_PORT}/tcp" comment 'SSH' >/dev/null 2>&1 || true
sudo ufw allow 'Nginx Full' >/dev/null 2>&1 || true
if sudo ufw status | grep -q "Status: active"; then
  log "ufw deja actif : regles mises a jour (SSH port $SSH_PORT, HTTP/HTTPS)."
else
  warn "ufw est INACTIF. Regles preparees (SSH port $SSH_PORT + Nginx) mais pare-feu non active"
  warn "automatiquement, pour ne pas risquer de vous couper l'acces SSH. Pour l'activer :"
  warn "  sudo ufw enable   (verifiez d'abord 'sudo ufw status' et gardez une session SSH ouverte)"
fi

if [ -n "$DOMAIN" ]; then
  log "Certificat TLS (Let's Encrypt) pour $DOMAIN"
  sudo apt-get install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" || \
    warn "Certbot a echoue - verifiez que $DOMAIN pointe bien vers ce serveur puis relancez : sudo certbot --nginx -d $DOMAIN"
fi

log "Termine ! Fantafoot est en ligne : $PUBLIC_URL"
echo "Voir les logs      : pm2 logs fantafoot"
echo "Redemarrer l'app   : pm2 restart fantafoot"
echo "Relancer ce script : ./deploy-fantafoot.sh   (met a jour le code depuis la branche $BRANCH)"
