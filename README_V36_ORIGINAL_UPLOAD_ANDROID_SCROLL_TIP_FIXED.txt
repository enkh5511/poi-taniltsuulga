V36 — ORIGINAL UPLOAD MINIMAL FIX

Base files used exactly from uploaded originals:
- index(15).html -> index.html
- calculator-mini(6).html -> app/calculator-mini.html
- performance(7).html -> app/performance.html

Fixes:
1) Android/touch scroll unlocked without removing original aurora, gold network, stars, canvas effects.
2) Parent iframe containers remain scrollable on Android.
3) Performance/calculator iframe documents also unlock body/view scroll on Android.
4) MyForexFunds certificate image included at root as myforexfunds_certificate.jpg.
5) Talarhal logic formula was kept: selected 5%-15% is deducted at the final step from member total expected amount. Only confusing label text was corrected.

Deploy root contents to Netlify including /app folder, aurora.jpg, certificate image, CNAME, robots.txt, sitemap.xml.
