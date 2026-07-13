# POI CAPITAL GROUP — PORTAL STATE
## Хувилбар: V39.8.3 (2026-07-12)
## Хостинг: Cloudflare (poicapitalgroup.com) · GitHub push → auto deploy → Purge Everything

> **Энэ файлын зорилго:** Шинэ chat эхлүүлэхдээ энэ zip-ийг хавсаргаад
> "PORTAL_STATE.md-г уншаад эхэл" гэхэд AI assistant бүх context-ийг сэргээнэ.

---

## 1. ФАЙЛЫН БҮТЭЦ (заавал энэ байрлалаар deploy)
```
/index.html                 — SPA (нүүр, танилцуулга, туршлага, аргачлал, холбоо)
/aurora-v2.jpg              — цорын ганц фон зураг (хуучин aurora.jpg устгагдсан)
/app/calculator-mini.html   — Тооцоолуур таб (iframe)
/app/performance.html       — Гүйцэтгэл таб (iframe) — гишүүний самбар
/admin/index.html           — /admin/ redirect
/admin/calculator.html      — дотоод тооцоолуур (gate: PCG Admin)
```

## 2. ТҮГЖИГДСЭН ШИЙДВЭРҮҮД (өөрчлөхийг хориглоно — эзний зөвшөөрөлгүйгээр)

**Архитектур:**
- Фон: `.poi-bg-fixed` div (position:fixed, viewport) — 4 хуудсанд ижил.
  `background-attachment:fixed` ХЭЗЭЭ Ч БУЦААХГҮЙ (Chromium ghost bug эх үүсвэр).
- Iframe хуудсууд `poi-embedded` class-аар өөрийн фоноо унтрааж тунгалаг болдог
  (parent-ийн ганц фон нэвт харагдана). `<meta name="color-scheme" content="dark">`
  5 хуудсанд заавал байх (устгавал iframe цагаан болно).
- Iframe→parent navigation: parent.goSection → postMessage({poiGoSection}) fallback.
  `top.location` ашиглахгүй (file:// дээр чимээгүй блоклогддог).
- Canvas animation: STATIC хувилбарт бүрэн байхгүй; ADAPTIVE хувилбарт desktop дээр
  FX cache (120ms, 1/3 res) + 30fps cap + 60-frame self-monitor (>12ms/frame → өөрийгөө устгана).
  Mobile дээр аврора долгион ХААЛТТАЙ (iOS canvas filter дэмждэггүй), од+сүлжээ л үлдсэн.

**Гүйцэтгэлийн математик (performance.html):**
- Progress = АШГИЙН явц: baseline = memberCap×(1−талархал%);
  явц = (currentNet−baseline)/(targetNet−baseline). Капитал явцад тоологдохгүй!
- 4 hero card: 1·Капитал(ногоон) 2·Ашиг(cyan,#61d7ff) 3·Нийт дүн(teal) 4·Өгөөж%(gold,#ffd66b)
  Ашиг = adjustedNet − memberCap. Талархлын slider 2,3,4-ийг live шинэчилдэг.
- "Тооцооллын загвар" card: style="display:none" — УСТГАХГҮЙ, calcLabel ард нь амьд.
- 12 сарын хүснэгт: гишүүн-төвтэй (Сар | Танд хуваарилалт | Өссөн нийлбэр) +
  "урьдчилсан зураглал" disclaimer. Удирдагчийн баганууд (нийт ашиг, дансанд үлдэх) хасагдсан.

**Memo систем (performance.html):**
- Apps Script `member_memos` талбар (code-оор баталгаажсан member_no-оор сервер шүүдэг).
- Render: ЗӨВХӨН textContent (innerHTML хориотой), white-space:pre-line, олон memo дэмжинэ.
- Гарчиг: "Танд зориулсан тэмдэглэл — [display_name]". Title #ffd36a gold.
- Хоосон үед: "Танд хаяглагдсан шинэ тэмдэглэл ирмэгц энд харагдана."
- showAuth() memo-г DOM-оос ФИЗИКЭЭР арчдаг (logout/fail-login дээр residue үлдэхгүй).
- Protected snapshot cache: ЗӨВХӨН sessionStorage (tab хаагдахад устдаг). localStorage-д хувийн дата ХЭЗЭЭ Ч хадгалахгүй; хуучин localStorage түлхүүрийг boot дээр purge хийдэг.
- Cache TTL: 60 минут (PERF_CACHE_TTL_MS). Хугацаа хэтэрсэн/legacy формат cache-ийг read үед устгаж, auth төлөв харуулна. TTL = зөвхөн refresh-сэргээлтийн дүрэм, зурагдчихсан dashboard-ийг auto-lock ХИЙХГҮЙ (зориудын шийдвэр).
- clearMemberMemos() helper: showAuth, шинэ login эхлэх, failed-login catch, render(no-member) дөрвөн цэгээс дуудагддаг.
- renderMemberMemos: memo identity ЗӨВХӨН data.member-ээс (__sheetLiveMember fallback хасагдсан).
- Apps Script код өөрчлөгдвөл: Deploy → Manage deployments → New version (шинэ deployment БИШ!)

**Тооцоолуур (calculator-mini.html):**
- calcSeries: gross→ 2% зардал + 50% scale (compound) + 48% dist. Зардал НЭГ удаа.
- Гишүүний slider: MIN $5k, MAX_PER_MEMBER $100k, STEP $1000. Нийт CAP $400k, 10 гишүүн.
- stepPct (close): 1→50% 2→40% 3→30% 4→25% 5+→20%.

**Бусад:**
- Netlify гэж хэзээ ч дурсахгүй (Cloudflare only).
- Asset солиход нэрэнд version залгах (aurora-v2 → v3...) — cache busting.
- Admin gate код: poi2026 (client-side; Cloudflare Access /admin/* дээр тавих төлөвлөгөөтэй).

## 3. НЭЭЛТТЭЙ АСУУЛТУУД (эзэн шийдээгүй)
- Сарын operator % зөрүү: mini-weighted 20-25% vs admin-flex 30% (n≥4) — аль нь спек?
- Нүүрийн quick-calc: 31%/1%/15% vs бусад 30%/2%/10% — нэг мөр болгох эсэх?
- [ШИЙДЭГДСЭН] Энэ багц = ADAPTIVE хувилбар; V39.8.3-аас хойш production candidate нь эзний deploy сонголтоор тодорхойлогдоно (o1 final audit: ADAPTIVE дээр хийгдсэн).

## 4. АЖЛЫН ГОРИМ (AI assistant бүрд: Fable / Claude / o1 / Gemini)
1. Энэ файлыг уншсаны дараа асуулт асуухаасаа өмнө холбогдох файлын бодит кодыг унш.
2. Засвар бүрийн өмнө: assert-тэй string replace, дараа нь node --check syntax, jsdom тест.
3. Математикт хүрэхгүй — зөвхөн эзний тодорхой зөвшөөрлөөр.
4. Хоёр хувилбар (STATIC/ADAPTIVE) зэрэг байвал хоёуланд нь ижил patch.
5. Deploy заавар үргэлж: GitHub push → Cloudflare Purge Everything → Ctrl+Shift+R.
