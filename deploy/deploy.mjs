// Siteyi sunucuya gönderir.
//   npm run deploy               → derle, yükle, yeniden başlat, kontrol et
//   npm run deploy -- --setup    → önce sunucuyu kur (ilk sefer; tekrar çalıştırmak güvenli)
//   npm run deploy -- --backup   → sunucudaki veritabanının yedeğini bilgisayarına indir
//
// Ayarlar: deploy/.deploy.env (git'e girmez) — örnek: deploy/.deploy.env.example
// Windows 10/11'deki yerleşik ssh, scp ve tar kullanılır.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CONF = resolve('deploy/.deploy.env');
if (!existsSync(CONF)) {
  console.error('✕ deploy/.deploy.env yok. deploy/.deploy.env.example dosyasını kopyalayıp doldur.');
  process.exit(1);
}
process.loadEnvFile(CONF);
const { SERVER, SSH_KEY, DOMAIN } = process.env;
if (!SERVER || !SSH_KEY || !DOMAIN) {
  console.error('✕ deploy/.deploy.env içinde SERVER, SSH_KEY ve DOMAIN dolu olmalı.');
  process.exit(1);
}
const args = new Set(process.argv.slice(2));
const SSH_OPTS = ['-i', SSH_KEY, '-o', 'StrictHostKeyChecking=accept-new', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15'];

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { stdio: opts.capture ? ['inherit', 'pipe', 'inherit'] : 'inherit', shell: opts.shell, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`\n✕ Başarısız: ${cmd} ${cmdArgs.join(' ')}`);
    process.exit(r.status || 1);
  }
  return r.stdout;
}
const ssh = (script, opts) => run('ssh', [...SSH_OPTS, SERVER, script], opts);
const scp = (from, to) => run('scp', [...SSH_OPTS, from, `${SERVER}:${to}`]);
const step = (t) => console.log(`\n==> ${t}`);

if (args.has('--backup')) {
  step('Sunucuda yedek alınıyor');
  const out = ssh('sudo -u kimvarorda /usr/bin/node /opt/kimvarorda/current/deploy/backup.mjs /var/lib/kimvarorda/kimvarorda.db /var/lib/kimvarorda/backups 14', { capture: true });
  const remote = out.match(/yedek: (\S+)/)?.[1];
  mkdirSync('data/sunucu-yedekleri', { recursive: true });
  run('scp', [...SSH_OPTS, `${SERVER}:${remote}`, 'data/sunucu-yedekleri/']);
  console.log(`\n✓ İndirildi: data/sunucu-yedekleri/${remote.split('/').pop()}`);
  process.exit(0);
}

if (args.has('--setup')) {
  step(`Sunucu kurulumu (${SERVER}) — birkaç dakika sürer`);
  scp('deploy/setup.sh', '/tmp/kvo-setup.sh');
  ssh(`sudo DOMAIN=${DOMAIN} bash /tmp/kvo-setup.sh`);
}

step('Derleme');
run('npm', ['run', 'build'], { shell: true });
run('npm', ['test'], { shell: true });

step('Paketleme');
mkdirSync('out', { recursive: true });
run('tar', ['-czf', 'out/release.tgz', 'dist', 'server', 'shared', 'deploy/backup.mjs', 'package.json', 'package-lock.json']);

step('Yükleme');
scp('out/release.tgz', '/tmp/kvo-release.tgz');

step('Kurulum ve yeniden başlatma');
ssh(`set -e
R=/opt/kimvarorda/releases/$(date +%Y%m%d-%H%M%S)
mkdir -p "$R" && tar -xzf /tmp/kvo-release.tgz -C "$R" && rm /tmp/kvo-release.tgz
cd "$R" && npm ci --omit=dev --no-audit --no-fund --loglevel=error
ln -sfn "$R" /opt/kimvarorda/current
sudo systemctl restart kimvarorda
for i in 1 2 3 4 5 6 7 8 9 10; do curl -fsS http://127.0.0.1:3001/api/health >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:3001/api/health >/dev/null || { sudo systemctl status kimvarorda --no-pager; exit 1; }
ls -1dt /opt/kimvarorda/releases/* | tail -n +6 | xargs -r rm -rf
echo "sürüm: $R"`);

step(`Dışarıdan kontrol: https://${DOMAIN}`);
let ok = false;
for (let i = 0; i < 12 && !ok; i++) {
  try {
    const r = await fetch(`https://${DOMAIN}/api/health`);
    const j = await r.json();
    ok = j.ok;
    console.log(`  sağlık: ${r.status}, sunucunun gördüğü IP'n: ${j.ip}`);
    if (/^(127\.|::1|::ffff:127\.)/.test(j.ip)) {
      console.log('  ⚠ IP 127.0.0.1 görünüyor: TRUST_PROXY ayarı çalışmıyor, ağ kilidi herkesi birlikte kilitler!');
    }
  } catch {
    // ilk kurulumda HTTPS sertifikası birkaç saniye sürebilir
    await new Promise((r) => setTimeout(r, 5000));
  }
}
console.log(ok ? `\n✓ Yayında: https://${DOMAIN}` : `\n⚠ https://${DOMAIN} henüz yanıt vermiyor (DNS ya da Oracle güvenlik kuralları?)`);
