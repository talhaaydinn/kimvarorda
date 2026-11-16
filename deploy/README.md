# Canlıya alma (ücretsiz): Oracle Cloud + DuckDNS

Sunucu: Oracle Cloud Always Free (süresiz ücretsiz). Alan adı: DuckDNS (ücretsiz).
HTTPS: Caddy (otomatik, ücretsiz Let's Encrypt sertifikası).

## 1. Oracle Cloud hesabı ve sunucu

1. https://signup.cloud.oracle.com adresinden hesap aç. Kart yalnızca kimlik doğrulaması için istenir;
   "Always Free" kaynaklarda ücret çekilmez. **Home region** olarak **Germany Central (Frankfurt)**
   seç. Bu sonradan değiştirilemez.
2. Menü → **Compute → Instances → Create instance**
   - **Image:** Canonical **Ubuntu 24.04**
   - **Shape:** *Ampere* → **VM.Standard.A1.Flex**, 1 OCPU, 6 GB bellek ("Always Free eligible" yazmalı).
     "Out of capacity" hatası alırsan: *AMD* → **VM.Standard.E2.1.Micro** (o da ücretsiz ve yeterli).
   - **Add SSH keys:** "Generate a key pair for me" → **Save private key**. Bu dosyayı
     `C:\Users\<sen>\.ssh\kimvarorda.key` olarak sakla, kaybetme.
   - **Create**. Birkaç dakika sonra sayfada **Public IP address** görünür.
3. Aynı sayfada **Subnet** bağlantısı → **Security Lists** → **Default Security List** →
   **Add Ingress Rules**. İki kural ekle:
   - Source CIDR `0.0.0.0/0`, IP Protocol TCP, Destination Port `80`
   - Source CIDR `0.0.0.0/0`, IP Protocol TCP, Destination Port `443`

## 2. DuckDNS alan adı

1. https://www.duckdns.org → Google ya da GitHub ile giriş yap.
2. **sub domain** kutusuna `kimvarorda` yaz (alınmışsa başka bir ad dene) → **add domain**.
3. Yanındaki **current ip** kutusuna Oracle'daki Public IP'yi yaz → **update ip**.

## 3. Bilgisayarında ayar dosyası

`deploy/.deploy.env.example` dosyasını `deploy/.deploy.env` olarak kopyala ve doldur:

```
SERVER=ubuntu@<Public IP>
SSH_KEY=C:/Users/<sen>/.ssh/kimvarorda.key
DOMAIN=kimvarorda.duckdns.org
```

## 4. Kurulum ve yayın

```
npm run deploy -- --setup     # ilk sefer: sunucuyu kurar ve siteyi yayınlar (~5 dk)
npm run deploy                # sonraki her güncellemede
npm run deploy -- --backup    # sunucudaki veritabanı yedeğini data/sunucu-yedekleri/ klasörüne indirir
```

İlk kurulumun sonunda **admin şifresi** bir kez ekrana yazılır; bir yere kaydet.
Sonra https://kimvarorda.duckdns.org/admin adresinden giriş yapıp ilk vakayı oluşturabilirsin.

## Sunucuda neler var

| Ne | Nerede |
|---|---|
| Uygulama (son 5 sürüm) | `/opt/kimvarorda/releases`, çalışan sürüm: `/opt/kimvarorda/current` |
| Veritabanı | `/var/lib/kimvarorda/kimvarorda.db` |
| Günlük yedekler (03:30 UTC, son 14) | `/var/lib/kimvarorda/backups` |
| Ayarlar ve şifreler | `/etc/kimvarorda.env` |
| Loglar | `journalctl -u kimvarorda -f` |

## Sorun giderme

- **Ssh "UNPROTECTED PRIVATE KEY FILE" hatası:** PowerShell'de
  `icacls C:\Users\<sen>\.ssh\kimvarorda.key /inheritance:r /grant:r "$env:USERNAME:R"`
- **Site açılmıyor:** DuckDNS'teki IP doğru mu, Oracle'da 80 ve 443 için Ingress kuralları eklendi mi?
- **Oracle, sunucuyu "boşta" diye kapatırsa:** Always Free sunucular uzun süre çok düşük kullanımda
  kalırsa Oracle onları geri alabiliyor. Bu olursa hesabı "Pay As You Go"ya yükseltmek bunu
  engelliyor; Always Free kaynaklar yine ücretsiz kalıyor.
