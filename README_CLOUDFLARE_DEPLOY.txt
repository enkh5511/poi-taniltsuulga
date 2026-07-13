POI CAPITAL GROUP — V39.2.3 CLOUDFLARE DEPLOY

ЗААВАЛ БАРИМТЛАХ ФАЙЛЫН БҮТЭЦ (яг ийм байрлалтай upload хийнэ):

  /index.html
  /aurora-v2.jpg
  /myforexfunds_certificate.jpg
  /CNAME
  /robots.txt
  /sitemap.xml
  /app/calculator-mini.html     ← ЗААВАЛ app хавтас ДОТОР
  /app/performance.html         ← ЗААВАЛ app хавтас ДОТОР
  /admin/index.html
  /admin/calculator.html

АНХААР: calculator-mini.html болон performance.html-ийг root дээр
тавьвал Тооцоолуур, Гүйцэтгэл таб ХООСОН гарна (iframe нь
app/... замаар дууддаг тул 404 болно).

Deploy хийсний дараа: Cloudflare dashboard → Caching → Purge Everything.
