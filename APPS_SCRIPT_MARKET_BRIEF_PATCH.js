// 1) Top const хэсэгт нэмнэ:
const SHEET_MARKET_BRIEF = 'market_brief';

// 2) memberLookup_(e) return object дотор market_brief нэмж өгнө:
// return {
//   ok: true,
//   campaign: buildCampaign_(settings, activeMembers, totalCapital),
//   member: {...},
//   market_brief: readMarketBrief_(ss)
// };

// 3) Доорх function-ийг Apps Script-ийн доод хэсэгт нэмнэ:
function readMarketBrief_(ss) {
  const sh = ss.getSheetByName(SHEET_MARKET_BRIEF);
  if (!sh) return {};

  const values = sh.getDataRange().getValues();
  const out = {};

  for (let i = 1; i < values.length; i++) {
    const key = normalizeKey_(values[i][0]);
    const value = values[i][1];
    if (key) out[key] = value;
  }

  return out;
}
