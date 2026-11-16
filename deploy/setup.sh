#!/usr/bin/env bash
# kimvarorda sunucu kurulumu — Ubuntu 22.04 / 24.04 (Oracle Cloud Always Free).
# Bilgisayarından çalıştırılır:  npm run deploy -- --setup
# Tekrar çalıştırmak güvenlidir: var olan şifreyi, veritabanını ve yedekleri korur.
set -euo pipefail

DOMAIN="${DOMAIN:?DOMAIN gerekli, ör. kimvarorda.duckdns.org}"
APP_USER=kimvarorda
APP_DIR=/opt/kimvarorda
DATA_DIR=/var/lib/kimvarorda
ENV_FILE=/etc/kimvarorda.env
DEPLOY_USER="${SUDO_USER:-ubuntu}"
export DEBIAN_FRONTEND=noninteractive

step() { echo; echo "==> $*"; }

step "Paketler"
echo iptables-persistent iptables-persistent/autosave_v4 boolean true | debconf-set-selections
echo iptables-persistent iptables-persistent/autosave_v6 boolean true | debconf-set-selections
apt-get update -y
apt-get install -y curl ca-certificates gnupg openssl debian-keyring debian-archive-keyring apt-transport-https iptables-persistent

# Küçük (1 GB RAM) sunucularda npm kurulumu için takas alanı
if [ "$(awk '/MemTotal/ {print $2}' /proc/meminfo)" -lt 2000000 ] && ! swapon --show | grep -q /swapfile; then
  step "1 GB takas alanı"
  fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q /swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

step "Node.js 22"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

step "Caddy (otomatik HTTPS)"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' -o /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

step "Güvenlik duvarı: 80 ve 443 (Oracle imajı varsayılan olarak yalnızca SSH'a izin verir)"
for p in 80 443; do
  iptables -C INPUT -p tcp --dport "$p" -m state --state NEW -j ACCEPT 2>/dev/null \
    || iptables -I INPUT 1 -p tcp --dport "$p" -m state --state NEW -j ACCEPT
done
netfilter-persistent save

step "Kullanıcı ve klasörler"
id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --home "$DATA_DIR" --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$APP_DIR/releases" "$DATA_DIR/backups"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$DATA_DIR"
chmod 750 "$DATA_DIR"

NEW_PASSWORD=""
if [ ! -f "$ENV_FILE" ]; then
  step "Ayarlar ($ENV_FILE)"
  NEW_PASSWORD="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | cut -c1-16)"
  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=3001
DB_PATH=$DATA_DIR/kimvarorda.db
# Caddy aynı sunucuda, tek proxy adımı
TRUST_PROXY=1
ADMIN_PASSWORD=$NEW_PASSWORD
SESSION_SECRET=$(openssl rand -hex 32)
BURST_LIMIT=5
BURST_WINDOW_MIN=10
BURST_COOLDOWN_MIN=15
EOF
  chown "root:$APP_USER" "$ENV_FILE"
  chmod 640 "$ENV_FILE"
fi

step "Servis (systemd)"
cat > /etc/systemd/system/kimvarorda.service <<EOF
[Unit]
Description=kimvarorda.ai
After=network.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR/current
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=2
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=$DATA_DIR

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable kimvarorda >/dev/null
# deploy betiği servisi şifresiz yeniden başlatabilsin
echo "$DEPLOY_USER ALL=(root) NOPASSWD: /usr/bin/systemctl restart kimvarorda, /usr/bin/systemctl status kimvarorda" > /etc/sudoers.d/kimvarorda
chmod 440 /etc/sudoers.d/kimvarorda

step "Caddy → $DOMAIN"
cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3001
}
EOF
systemctl reload caddy 2>/dev/null || systemctl restart caddy

step "Günlük yedek (03:30, son 14 gün)"
cat > /etc/cron.d/kimvarorda-backup <<EOF
30 3 * * * $APP_USER /usr/bin/node $APP_DIR/current/deploy/backup.mjs $DATA_DIR/kimvarorda.db $DATA_DIR/backups 14 >> $DATA_DIR/backups/backup.log 2>&1
EOF

echo
echo "✓ Sunucu hazır: https://$DOMAIN"
if [ -n "$NEW_PASSWORD" ]; then
  echo "ADMIN_SIFRESI=$NEW_PASSWORD"
  echo "(Bu şifre bir daha gösterilmez; sunucuda $ENV_FILE dosyasında durur.)"
fi
