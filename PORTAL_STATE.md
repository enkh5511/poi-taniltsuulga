# POI CAPITAL GROUP — PORTAL STATE
## Хувилбар: V39.10.1_PHASE1_ADMIN (2026-07-13) — Алхам 1 + UI бүрэн МОНГОЛ, задаргаат гаралт
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
- stepPct (close): 1→50% 2→40% 3→30% 4→25% 5+→20%. [ХУУЧИРСАН: Phase 1-д 50/40/30 болно — Хэсэг 5 үз. Нүүрийн quick-calc аль хэдийн 50/40/30 + зардал 2% болсон.]

**Бусад:**
- Netlify гэж хэзээ ч дурсахгүй (Cloudflare only).
- Asset солиход нэрэнд version залгах (aurora-v2 → v3...) — cache busting.
- Admin gate код: poi2026 (client-side; Cloudflare Access /admin/* дээр тавих төлөвлөгөөтэй).

## 3. АСУУЛТУУД — [БҮГД ШИЙДЭГДСЭН, 2026-07-13 эзний баталгаа — Хэсэг 5, 5.1 үз]
- [ШИЙДЭГДСЭН] Сарын operator %: Calc2 → 50/40/30 + жин. Calc1 → сарын (n+1) тэнцүү; 50/40/30 зөвхөн хаалтад (Calc1-Б: капитал буцаах + ашиг шатлалаар). 25/20 сүүл БҮХ ГАЗАР хүчингүй.
- [ШИЙДЭГДСЭН + ЗАССАН] admin closeProfitOperatorPct → 3+ бүгд 30% + UI-ийн 4 hardcode текст зассан. Сургамж: функц засах нь UI текстийг автоматаар өөрчилдөггүй — хоёуланг нь sweep хийх.
- [ШИЙДЭГДСЭН] Quick-calc: hqTraderPct=50/40/30, cost=2%. Rate 15% зориудын sales showcase — хөндөхгүй.
- [ШИЙДЭГДСЭН] Payout Sheet логик: заавал харуулах албагүй — өгүүлэмжийн залруулга (Хэсэг 5).
- [ШИЙДЭГДСЭН] Энэ багц = ADAPTIVE хувилбар; production candidate эзний deploy сонголтоор.

### 3.2 ИРЭЭДҮЙН ШИЙДВЭРИЙН ЦЭГ (Phase 1-д ХӨНДӨӨГҮЙ — DO NOT TOUCH жагсаалтад байсан)
- **app/performance.html-д хуучин 25/20 шатлал 3 газар амьд:** мөр ~2693 (if n===4 return 0.25 / return 0.20), ~2844 (мөн адил), ~3183 (sheetTraderPct: n===4→.25, 5+→.20). Спекийн "25/20 бүх газар хүчингүй" дүрэмтэй зөрчилтэй боловч performance.html эмзэг (memo/TTL/seamless) тул эзний тусгай зөвшөөрөлтэй, тусдаа болгоомжтой pass-аар засагдана. Гишүүдийн бодит тоо энэ файлаас гардаг тул засварын өмнө Apps Script талын тоотой нийцүүлэх шаардлагатай.

## 4. АЖЛЫН ГОРИМ (AI assistant бүрд: Fable / Claude / o1 / Gemini)
1. Энэ файлыг уншсаны дараа асуулт асуухаасаа өмнө холбогдох файлын бодит кодыг унш.
2. Засвар бүрийн өмнө: assert-тэй string replace, дараа нь node --check syntax, jsdom тест.
3. Математикт хүрэхгүй — зөвхөн эзний тодорхой зөвшөөрлөөр.
4. Хоёр хувилбар (STATIC/ADAPTIVE) зэрэг байвал хоёуланд нь ижил patch.
5. Deploy заавар үргэлж: GitHub push → Cloudflare Purge Everything → Ctrl+Shift+R.
6. Deliverable ҮРГЭЛЖ нэг бүтэн zip багц — салангид файл ХЭЗЭЭ Ч өгөхгүй. Файл үүсгэхийн өмнө эзний зөвшөөрөл. Token хэмнэ — зөвшөөрөгдөөгүй нэмэлт ажил хийхгүй. Математикийн шийдвэр гарвал ЗОГСООД эзнээс асуу.

---

## 5. ШИНЭ ЗАГВАРЫН СПЕК — 2026-07-13 хөлдсөн (Phase 1-ийн суурь)

### MODEL_A_12_MONTH_REAL_PERFORMANCE (үндсэн public campaign)
- 12 сар · сарын хуримтлал default виртуал ledger (compound хамгаалагдана) · ROI default 10% · зардал 2% (lock)
- **PAYOUT ӨГҮҮЛЭМЖ (LOCKED):** "payout OFF" гэсэн хатуу үг ХОРИОТОЙ. Зөв: "Сар бүр тогтмол payout амлахгүй. Хуримтлагдсан үр дүн campaign-ийн зорилтот түвшинд хугацаанаасаа өмнө хүрвэл ашгийн хуваарилалт хийх боломж нээгдэнэ. Хуваарилалтын хувь, дүн Google Sheet дээрээс удирдагдана." "Амласан" гэсэн үг investor-facing дээр ХОРИОТОЙ — admin/internal дээр "зорилтот тооцоо".
- Settlement campaign төгсгөлд НЭГ удаа: total_profit = нийт campaign үнэ цэн − анхны капитал
- Operator дүрэм (LOCKED, бүх горимд): 1 гишүүн→50%, 2→40%, 3+→30%. Хуучин 25%/20% сүүл ХҮЧИНГҮЙ.
- Хуваарилалтын матриц:
  | | Сарын виртуал | Данс хаах |
  | Calc1-А (бүгд тэнцүү) | (n+1) тэнцүү | (n+1) тэнцүү |
  | Calc1-Б | (n+1) тэнцүү — operator нэг гишүүн шиг | капитал буцаах + ашгийг 50/40/30 |
  | Calc2 (өөр дүн) | 50/40/30, үлдсэнийг капиталын жингээр | 50/40/30 + жингээр |
- Хамгаалалтын нөөц — ГУРВАН БҮС (hybrid):
  Бүс1: 0 → 30% зорилт: ашгийн 100% нөөц рүү, БОЛЗОЛГҮЙ ("үндсэн нөөц бүрдлээ" badge)
  Бүс2: 30% → 50% зорилт: ашгийн 30% нөөц рүү, ЗӨВХӨН ROI хүчтэй сард (болзол: тухайн сар ≥15% эсвэл 3 сарын дундаж ≥12-13%)
  Бүс3: 50%-аас цааш: юүлэлт зогсоно, бүрэн compound
- 12 сард "100% капитал хамгаалалт" гэж ХЭЗЭЭ Ч амлахгүй — зөвхөн "хамгаалалтын нөөц 30%/50%"
- Capacity зөвлөмж (admin-only, зөөлөн): дансны зөвлөмжит ажлын хэмжээ давбал ROI хүлээлт бууруулах/нөөц рүү идэвхтэй юүлэх сануулга
- Surprise хил (LOCKED): active данс = surprise БИШ. Surprise = НИЙТ ЗОРИЛТ (капитал буцаалт + сарын виртуал хуримтлал + хаалтын хуваарилалт + нөөцийн зорилт) БҮРЭН бүрдсэнээс хойшхи илүүдэл л. Тогтмол тоон тааз (238k г.м.) ХЭРЭГЛЭХГҮЙ — зорилт нөхцөлөөс өөрөө бодогдоно.
- Surprise хуваарилалт: мөн л 50/40/30 (operator хувиа авна), investor хэсэг жингээр
- Fund (нөөцөөс гадуурх freedom мөнгө): гишүүдэд ЮУ Ч АМЛАХГҮЙ, operator-ийн удирдлагад (богино хугацааны хувьцаа г.м. байршил зөвшөөрөгдөнө), үр дүн нь зөвхөн surprise давхаргад; гишүүний амласан тоонд fund-ийн өгөөж ХЭЗЭЭ Ч орохгүй
- Double counting ХОРИОТОЙ: сарын виртуал хуримтлал бол settlement-ийн preview, тусдаа нэмэгдэх мөнгө биш

### MODEL_B_24_MONTH_CAPITAL_PROTECTION_WATERFALL (ирээдүйн scenario, public default БИШ)
- 24 сар · payout OFF · active дансыг хэт томруулахгүй (milestone дээр skim)
- Waterfall: ашиг → 100% капитал хамгаалалт → expected return давхарга → admin-only surprise/freedom
- Мөн 50/40/30 + жин. Admin-д зөвхөн scenario хэлбэрээр.

### 5.1 LOCKED ШИЙДВЭРҮҮД — Fund Simulator (2026-07-13, эзний 5 lock + build)
- Нөөцийн 30%/50% зорилт = анхны нийт investor capital-ийн хувь (C0). DD buffer / risk reserve утгатай — 100% капитал хамгаалалт БИШ.
- Дараалал: gross → 2% cost → net → Бүс1: нөөц<30%C0 бол net 100% нөөц рүү, 30%-д CAP (давсан хэсэг campaign value-д үлдэнэ). Нөөц = locked, ROI авахгүй; active л өснө. Виртуал хуримтлал хэвийн бичигдэнэ (settlement preview, cash биш). Settlement = total campaign value (active+нөөц) дээр НЭГ удаа.
- Бүс2 болзол (LOCK): 30% бүрдсэн + сүүлийн 3 ХААГДСАН сарын дундаж net ROI ≥12% + major DD warning байхгүй → net×30% нөөц рүү, 50% cap. Net ROI = cost-ийн дараах бодит сарын ROI. Тогтмол scenario-д зөвхөн 15% Бүс2-ийг асаана (7%→6.86%, 10%→9.8% босго хүрэхгүй) — САНААТАЙ дизайн; бодит датан дээр бодит 3 сарын дундажаар ажиллана.
- "Зорилтот тооцоо" = ижил хөдөлгүүр 10% default ROI, 2% cost, 12 сар, одоогийн жин + operator дүрэм. 7% scenario: дутууг улаанаар; 15%: илүүг ногооноор.
- Surprise (LOCKED томьёо): surprise = totalValue − C0 − зорилтот settlement − reserveNeed − activeBase. ≤0 бол харуулахгүй. Admin-only — public-д ХЭЗЭЭ Ч харагдахгүй. Active данс surprise БИШ. Хуваалт: operator 50/40/30, investor pool жингээр.
- Reserve need сонгогч (admin): default 30%, сонголт 30%/50%. Active base slider (admin): default $0, хүрээ 0→C0, preset $0 / 50%C0 / 100%C0.
- Model B (24 сар): fixed promise ХОРИОТОЙ — бүгд admin scenario slider. Default: cap multiple 2.0×, skim rate 100%, protection 100%C0, expected 20%C0, surprise threshold 0. Waterfall: protection → expected → surprise/freedom.
- operatorPct(n) helper: ≤1→50%, 2→40%, 3+→30% — шинэ кодын нэгдсэн эх сурвалж.

### PHASE 1 ЯВЦ
- **UI ДҮРЭМ (эзний шаардлага, V39.10.1):** Бүх харагдах текст МОНГОЛООР. Англи нэршил (Fund Simulator, waterfall, surprise, milestone, lock/deployable, scenario г.м.) UI-д ХОРИОТОЙ — монгол нэршил: Сангийн тооцооллын загварчлал, шат дараалсан хуваарилалт, зорилтоос давсан илүүдэл, босго цэг, түгжигдсэн/идэвхтэй, хувилбар. Эзний өөрийн нэршил (payout, Google Sheet, compound, C0 тэмдэглэгээ) хэвээр. Англи хувилбар хожим, тусдаа. Гаралт бүр тооцооллоо ӨӨРӨӨ тайлбарлана: сар бүрийн урсгал мөр мөрөөр, данс хаах хуваарилалт алхам алхмаар, илүүдэл суутгалын хүснэгтээр.
- **Алхам 1 [ДУУССАН — V39.10.1]:** admin/calculator.html — таб бүтэц (Model A / Model B), Fund Simulator (амьд уншилт, debounce 200ms, 7/10/15 scenario, lock/deployable бар + 12 сарын мини chart, 4 зорилтын progress, admin-only surprise блок, гишүүн бүрийн хүснэгт), Model B (5 slider, 3 давхаргын дүүргэлт, milestone timeline, 7/10/15 харьцуулалт, сарын хураангуй). Одоогийн Calc1/Calc2 хөдөлгүүрт НЭГ Ч мөр өөрчлөлт ороогүй — add-on script блок. Тест: node --check OK; хөдөлгүүр n=1..10 × 7/10/15 (консерваци, нөөцийн cap, Бүс2 идэвхжилт, settlement нийлбэр, surprise=0@10%) БҮГД PASS.
- **Алхам 2 [ХҮЛЭЭГДЭЖ БАЙНА]:** app/calculator-mini.html — stepPct 25/20 → 50/40/30, Model A default өгүүлэмж (зөвшөөрөгдсөн payout wording), нөөцийн зорилтын харагдац, settlement projection.

### PHASE 1 ДААЛГАВАР (шинэ chat-аас эхлүүлнэ)
- Файлууд: PORTAL_STATE.md ✓(энэ), app/calculator-mini.html, admin/calculator.html
- performance.html-д Phase 1-д ХҮРЭХГҮЙ (memo/TTL/progress/seamless эмзэг логик)
- calculator-mini: Model A default — payout OFF өгүүлэмж, нөөцийн зорилт харагдац, settlement projection; хуучин stepPct 25/20 сүүлийг 50/40/30 болгох
- admin: хоёр таб (12 сар / 24 сар scenario), Fund Simulator: 3 давхаргат waterfall (данс→нөөц→deployable), 7/10/15% scenario, зорилт бүрдэлтийн progress (нөөц→нийт зорилт→freedom), lock/deployable задаргаа, гишүүн бүрийн "амласан + surprise" хүснэгт
- Гишүүнд ХАРУУЛАХГҮЙ: operator нийт дүн, surprise fund, нөөцийн дотоод задаргаа
- Хэв маяг: одоогийн premium dark хэвээр, хүнд animation ХОРИОТОЙ (mobile)
