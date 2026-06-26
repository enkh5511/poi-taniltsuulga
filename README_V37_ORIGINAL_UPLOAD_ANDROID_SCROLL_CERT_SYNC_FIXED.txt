V37 original upload minimal/final fix

Source files used directly from user upload:
- index(15).html -> index.html
- calculator-mini(6).html -> app/calculator-mini.html
- performance(7).html -> app/performance.html

Fixed:
1) Android calculator/performance touch scroll: parent + iframe child both get mobile scroll override, iframe height bridge, touch-action pan-y.
2) Background: parent aurora/gold network remains; embedded child pages become transparent and child #wbg is disabled only when inside iframe to reduce duplicated animation and sync lag. Standalone child pages still keep their original background.
3) Certificate button: openCertModal/closeCertModal functions added; root myforexfunds_certificate.jpg included.
4) Performance tip label: formula unchanged. Text says tip-after expected amount, because selected 5%-15% gratitude/tip is subtracted at the end from member total.

Deploy: upload all files/folders at root to Netlify.
