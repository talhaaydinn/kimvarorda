// .env dosyasını diğer modüllerden ÖNCE yükler (index.js'te ilk import olmalı)
try {
  process.loadEnvFile();
} catch {
  /* .env yoksa ortam değişkenleri kullanılır */
}
