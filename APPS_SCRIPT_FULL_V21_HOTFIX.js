const SHEET_INPUT = 'input_tool';
const SHEET_HISTORY = 'history_log';
const SHEET_SETTINGS = 'campaign_settings';
const SHEET_MEMBERS = 'members_model';
const SHEET_MONTHLY = 'monthly_data';
const SHEET_CHART = 'chart_data';
const SHEET_DASHBOARD = 'dashboard_data';
const SHEET_WEB_CONFIG = 'web_config';
const SHEET_MARKET_BRIEF = 'market_brief';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Operator Tool')
    .addItem('7 хоногийн гүйцэтгэл хадгалах', 'saveWeeklyPerformance')
    .addItem('Тайлан дахин шинэчлэх', 'POI_REFRESH_REPORT_DATA_NOW')
    .addItem('Market brief sheet үүсгэх', 'setupMarketBriefSheet')
    .addItem('Member API test', 'showMemberApiTest')
    .addToUi();
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = String(params.action || '').trim();
  let payload;

  try {
    if (action === 'member_lookup') {
      payload = memberLookup_(e);
    } else if (action === 'campaign_status') {
      payload = { ok: false, error: 'campaign_status_disabled' };
    } else if (action === 'performance_snapshot' || action === '') {
      payload = performanceSnapshot_();
    } else {
      payload = {
        ok: true,
        message: 'POI API ажиллаж байна',
        actions: ['performance_snapshot', 'member_lookup']
      };
    }
  } catch (err) {
    payload = {
      ok: false,
      error: String(err && err.message ? err.message : err)
    };
  }

  return apiOutput_(payload, params.callback);
}

function saveWeeklyPerformance() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const input = ss.getSheetByName(SHEET_INPUT);
  const history = ss.getSheetByName(SHEET_HISTORY);

  if (!input) {
    SpreadsheetApp.getUi().alert('input_tool sheet олдсонгүй');
    return;
  }

  if (!history) {
    SpreadsheetApp.getUi().alert('history_log sheet олдсонгүй');
    return;
  }

  const rowData = {
    week_no: input.getRange('C5').getValue(),
    period_start: input.getRange('C6').getValue(),
    period_end: input.getRange('C7').getValue(),
    starting_balance: moneyNumber_(input.getRange('C8').getValue()),
    ending_balance: moneyNumber_(input.getRange('C9').getValue()),
    gross_profit: moneyNumber_(input.getRange('C10').getValue()),
    gross_loss: Math.abs(moneyNumber_(input.getRange('C11').getValue())),
    max_drawdown_usd: Math.abs(moneyNumber_(input.getRange('C12').getValue())),
    winning_trades: moneyNumber_(input.getRange('C13').getValue()),
    total_trades: moneyNumber_(input.getRange('C14').getValue()),
    statement_link: input.getRange('C15').getValue(),
    operator_note: input.getRange('C16').getValue()
  };

  if (!rowData.week_no || !rowData.period_start || !rowData.period_end) {
    SpreadsheetApp.getUi().alert('week_no, period_start, period_end гурвыг бөглө.');
    return;
  }

  if (rowData.starting_balance <= 0 || rowData.ending_balance <= 0) {
    SpreadsheetApp.getUi().alert('starting_balance болон ending_balance 0-ээс их байх ёстой.');
    return;
  }

  const headers = history
    .getRange(1, 1, 1, history.getLastColumn())
    .getValues()[0]
    .map(h => normalizeKey_(h));

  const newRow = headers.map(h => rowValueForHistoryHeader_(h, rowData));
  history.appendRow(newRow);
  const savedRow = history.getLastRow();

  POI_REFRESH_REPORT_DATA_NOW();

  SpreadsheetApp.getUi().alert('Хадгалагдлаа. history_log дээр ' + savedRow + '-р мөр үүссэн. Тайлан шинэчлэгдлээ.');
}

function POI_REFRESH_REPORT_DATA_NOW() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const input = ss.getSheetByName(SHEET_INPUT);
  const history = ss.getSheetByName(SHEET_HISTORY);
  const monthly = ss.getSheetByName(SHEET_MONTHLY);
  const chart = ss.getSheetByName(SHEET_CHART);
  const dashboard = ss.getSheetByName(SHEET_DASHBOARD);
  const members = ss.getSheetByName(SHEET_MEMBERS);
  const webConfig = ss.getSheetByName(SHEET_WEB_CONFIG);
  const oldValidation = ss.getSheetByName('VALIDATION_REPORT');

  if (!input) throw new Error('input_tool sheet олдсонгүй');
  if (!history) throw new Error('history_log sheet олдсонгүй');
  if (!monthly) throw new Error('monthly_data sheet олдсонгүй');
  if (!chart) throw new Error('chart_data sheet олдсонгүй');

  if (oldValidation) ss.deleteSheet(oldValidation);

  removeDuplicateHistoryRows_(history);
  SpreadsheetApp.flush();

  const rows = readHistoryRows_(history);

  history.getRange('B:C').setNumberFormat('yyyy-mm-dd');
  history.getRange('D:H').setNumberFormat('$#,##0');

  rebuildChartData_(chart, rows);
  rebuildMonthlyData_(monthly, rows, input);
  rebuildInputToolSummary_(input, rows);
  rebuildDashboardData_(dashboard, rows);
  cleanMembersModel_(members);
  setupMarketBriefSheet(false);

  if (webConfig) webConfig.getRange('B5').setNumberFormat('0');

  SpreadsheetApp.flush();
  ss.toast('POI report data шинэчлэгдлээ.', 'Operator Tool', 5);
}

function performanceSnapshot_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const history = ss.getSheetByName(SHEET_HISTORY);
  const input = ss.getSheetByName(SHEET_INPUT);
  const settingsSheet = ss.getSheetByName(SHEET_SETTINGS);
  const membersSheet = ss.getSheetByName(SHEET_MEMBERS);
  const webConfigSheet = ss.getSheetByName(SHEET_WEB_CONFIG);

  if (!history) throw new Error('history_log sheet олдсонгүй');

  const rows = readHistoryRows_(history);
  const latest = rows.length ? rows[rows.length - 1] : null;
  const totalCapital = settingsSheet ? moneyNumber_(settingsSheet.getRange('B5').getValue()) : 0;

  const monthly = buildMonthlySnapshot_(rows, input);
  const dashboard = buildDashboardSnapshot_(rows, monthly, totalCapital);

  return {
    ok: true,
    updated_at: new Date().toISOString(),
    dashboard_data: dashboard,
    monthly_data: monthly,
    web_config: readWebConfig_(webConfigSheet),
    members_model: readMembersForPublic_(membersSheet),
    chart_data: rows.map(r => {
      const net = r.gross_profit - r.gross_loss;
      return {
        week_no: r.week_no,
        period_start: dateKey_(r.period_start || r.group_date),
        period_end: dateKey_(r.period_end || r.group_date),
        ending_balance: r.ending_balance,
        weekly_pl_usd: net,
        weekly_pl_pct: r.starting_balance ? net / r.starting_balance : 0,
        max_drawdown_usd: r.max_dd,
        max_drawdown_pct: r.starting_balance ? r.max_dd / r.starting_balance : 0,
        statement_link: r.statement_link || ''
      };
    }),
    market_brief: readMarketBrief_(ss)
  };
}

function buildMonthlySnapshot_(rows, input) {
  const reportMonth = input
    ? (monthStart_(input.getRange('C4').getValue()) || (rows.length ? new Date(rows[rows.length - 1].group_date.getFullYear(), rows[rows.length - 1].group_date.getMonth(), 1) : null))
    : (rows.length ? new Date(rows[rows.length - 1].group_date.getFullYear(), rows[rows.length - 1].group_date.getMonth(), 1) : null);

  const monthRows = reportMonth ? rows.filter(r => sameMonth_(r.group_date, reportMonth)) : [];
  const sorted = monthRows.slice().sort((a, b) => a.group_date - b.group_date || a.sheetRow - b.sheetRow);
  const startBal = sorted.length ? sorted[0].starting_balance : 0;
  const endBal = sorted.length ? sorted[sorted.length - 1].ending_balance : 0;
  const gp = monthRows.reduce((s, r) => s + r.gross_profit, 0);
  const gl = monthRows.reduce((s, r) => s + r.gross_loss, 0);
  const net = gp - gl;
  const wins = monthRows.reduce((s, r) => s + r.wins, 0);
  const trades = monthRows.reduce((s, r) => s + r.trades, 0);
  const maxDd = monthRows.length ? Math.max.apply(null, monthRows.map(r => r.max_dd)) : 0;
  const pf = gl === 0 ? (gp === 0 ? 0 : 999) : gp / gl;

  const latestNote = sorted.length ? String(sorted[sorted.length - 1].operator_note || '') : '';

  return {
    month: reportMonth ? dateKey_(reportMonth) : '',
    report_month: reportMonth ? dateKey_(reportMonth) : '',
    monthly_start_balance: startBal,
    monthly_end_balance: endBal,
    monthly_pl_usd: net,
    monthly_roi_pct: startBal ? net / startBal : 0,
    monthly_profit_factor: pf,
    monthly_win_rate_pct: trades ? wins / trades : 0,
    monthly_max_dd_pct: startBal ? maxDd / startBal : 0,
    monthly_statement_text_1: latestNote,
    monthly_statement_text_2: '',
    monthly_statement_text_3: ''
  };
}

function buildDashboardSnapshot_(rows, monthly, totalCapital) {
  const latest = rows.length ? rows[rows.length - 1] : null;
  if (!latest) {
    return {
      update_date: '',
      current_balance: 0,
      weekly_pl_usd: 0,
      weekly_pl_pct: 0,
      total_roi_pct: 0,
      profit_factor: 0,
      win_rate_pct: 0,
      max_weekly_dd_pct: 0,
      dd_limit_usd: 0,
      operator_note: ''
    };
  }

  const latestNet = latest.gross_profit - latest.gross_loss;
  const gpAll = rows.reduce((s, r) => s + r.gross_profit, 0);
  const glAll = rows.reduce((s, r) => s + r.gross_loss, 0);
  const winsAll = rows.reduce((s, r) => s + r.wins, 0);
  const tradesAll = rows.reduce((s, r) => s + r.trades, 0);
  const pfAll = glAll === 0 ? (gpAll === 0 ? 0 : 999) : gpAll / glAll;

  return {
    update_date: dateKey_(latest.period_end || latest.group_date),
    current_balance: latest.ending_balance,
    weekly_pl_usd: latestNet,
    weekly_pl_pct: latest.starting_balance ? latestNet / latest.starting_balance : 0,
    total_roi_pct: totalCapital ? (latest.ending_balance - totalCapital) / totalCapital : 0,
    profit_factor: pfAll,
    win_rate_pct: tradesAll ? winsAll / tradesAll : 0,
    max_weekly_dd_pct: latest.starting_balance ? latest.max_dd / latest.starting_balance : 0,
    dd_limit_usd: latest.starting_balance * 0.2,
    operator_note: String(latest.operator_note || '')
  };
}

function rebuildChartData_(chart, rows) {
  chart.clearContents();

  const out = [['period_end', 'ending_balance', 'net_pl', 'weekly_roi', 'max_dd']];
  const seen = {};

  rows.forEach(r => {
    const net = r.gross_profit - r.gross_loss;
    const roi = r.starting_balance ? net / r.starting_balance : 0;
    const key = [dateKey_(r.group_date), Math.round(r.ending_balance), Math.round(net), Math.round(r.max_dd)].join('|');
    if (seen[key]) return;
    seen[key] = true;
    out.push([r.group_date, r.ending_balance, net, roi, r.max_dd]);
  });

  chart.getRange(1, 1, out.length, 5).setValues(out);
  chart.getRange('A1:E1').setFontWeight('bold').setBackground('#067a5a').setFontColor('#ffffff');
  chart.getRange('A2:A200').setNumberFormat('yyyy-mm-dd');
  chart.getRange('B2:C200').setNumberFormat('$#,##0');
  chart.getRange('D2:D200').setNumberFormat('0.00%');
  chart.getRange('E2:E200').setNumberFormat('$#,##0');
}

function rebuildMonthlyData_(monthly, rows, input) {
  monthly.getRange('A1:H1').setValues([['month','start_balance','end_balance','gross_profit','gross_loss','net_pl','roi','max_dd']]);

  const monthCells = monthly.getRange('A2:A13').getValues();
  const fallbackDate = monthStart_(input.getRange('C4').getValue()) || (rows.length ? new Date(rows[0].group_date.getFullYear(), 0, 1) : new Date(new Date().getFullYear(), 0, 1));
  const fallbackYear = fallbackDate.getFullYear();
  const monthOutA = [];

  for (let i = 0; i < 12; i++) {
    const current = monthStart_(monthCells[i][0]);
    monthOutA.push([current ? new Date(current.getFullYear(), current.getMonth(), 1) : new Date(fallbackYear, i, 1)]);
  }

  monthly.getRange('A2:A13').setValues(monthOutA);
  monthly.getRange('A2:A13').setNumberFormat('yyyy-mm');

  const monthlyOut = [];
  for (let i = 0; i < monthOutA.length; i++) {
    const m = monthOutA[i][0];
    const mRows = rows.filter(r => sameMonth_(r.group_date, m));
    if (!mRows.length) {
      monthlyOut.push(['', '', '', '', '', '', '']);
      continue;
    }
    const sorted = mRows.slice().sort((a, b) => a.group_date - b.group_date || a.sheetRow - b.sheetRow);
    const startBal = sorted[0].starting_balance;
    const endBal = sorted[sorted.length - 1].ending_balance;
    const gp = mRows.reduce((s, r) => s + r.gross_profit, 0);
    const gl = mRows.reduce((s, r) => s + r.gross_loss, 0);
    const net = gp - gl;
    const roi = startBal ? net / startBal : 0;
    const maxDd = Math.max.apply(null, mRows.map(r => r.max_dd));
    monthlyOut.push([startBal, endBal, gp, gl, net, roi, maxDd]);
  }

  monthly.getRange(2, 2, monthlyOut.length, 7).setValues(monthlyOut);
  monthly.getRange('A1:H1').setFontWeight('bold').setBackground('#067a5a').setFontColor('#ffffff');
  monthly.getRange('B2:F13').setNumberFormat('$#,##0');
  monthly.getRange('G2:G13').setNumberFormat('0.00%');
  monthly.getRange('H2:H13').setNumberFormat('$#,##0');
}

function rebuildInputToolSummary_(input, rows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = ss.getSheetByName(SHEET_SETTINGS);
  const reportMonth = monthStart_(input.getRange('C4').getValue()) || (rows.length ? new Date(rows[rows.length - 1].group_date.getFullYear(), rows[rows.length - 1].group_date.getMonth(), 1) : null);
  const totalCapital = settings ? moneyNumber_(settings.getRange('B5').getValue()) : 0;
  const monthRows = reportMonth ? rows.filter(r => sameMonth_(r.group_date, reportMonth)) : [];
  const sortedMonthRows = monthRows.slice().sort((a, b) => a.group_date - b.group_date || a.sheetRow - b.sheetRow);
  const monthStartBalance = sortedMonthRows.length ? sortedMonthRows[0].starting_balance : 0;
  const monthGp = monthRows.reduce((s, r) => s + r.gross_profit, 0);
  const monthGl = monthRows.reduce((s, r) => s + r.gross_loss, 0);
  const monthNet = monthGp - monthGl;
  const monthRoi = monthStartBalance ? monthNet / monthStartBalance : 0;
  const monthPf = monthGl === 0 ? (monthGp === 0 ? 0 : 999) : monthGp / monthGl;
  const wins = monthRows.reduce((s, r) => s + r.wins, 0);
  const trades = monthRows.reduce((s, r) => s + r.trades, 0);
  const winRate = trades ? wins / trades : 0;
  const latest = rows.length ? rows[rows.length - 1] : null;
  const campaignRoi = latest && totalCapital ? (latest.ending_balance - totalCapital) / totalCapital : 0;

  input.getRange('K5').setValue(monthNet);
  input.getRange('K6').setValue(monthRoi);
  input.getRange('K7').setValue(campaignRoi);
  input.getRange('K8').setValue(monthPf);
  input.getRange('K9').setValue(winRate);
  input.getRange('K5').setNumberFormat('$#,##0');
  input.getRange('K6:K7').setNumberFormat('0.00%');
  input.getRange('K8').setNumberFormat('0.00');
  input.getRange('K9').setNumberFormat('0.00%');

  const starting = moneyNumber_(input.getRange('C8').getValue());
  const grossProfit = moneyNumber_(input.getRange('C10').getValue());
  const grossLoss = Math.abs(moneyNumber_(input.getRange('C11').getValue()));
  const maxDd = Math.abs(moneyNumber_(input.getRange('C12').getValue()));
  const weeklyNet = grossProfit - grossLoss;
  const weeklyRoi = starting ? weeklyNet / starting : 0;
  const ddPct = starting ? maxDd / starting : 0;
  const ddLimit = starting * 0.2;

  input.getRange('H6').setValue(weeklyRoi);
  input.getRange('H8').setValue(ddPct);
  input.getRange('H9').setValue(ddLimit);
  input.getRange('H11').setValue(weeklyRoi);
  input.getRange('H6').setNumberFormat('0.00%');
  input.getRange('H8').setNumberFormat('0.00%');
  input.getRange('H9').setNumberFormat('$#,##0');
  input.getRange('H11').setNumberFormat('0.00%');
}

function rebuildDashboardData_(dashboard, rows) {
  if (!dashboard) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = ss.getSheetByName(SHEET_SETTINGS);
  const totalCapital = settings ? moneyNumber_(settings.getRange('B5').getValue()) : 0;
  const latest = rows.length ? rows[rows.length - 1] : null;
  if (!latest) return;
  const latestNet = latest.gross_profit - latest.gross_loss;
  const campaignRoi = totalCapital ? (latest.ending_balance - totalCapital) / totalCapital : 0;
  dashboard.getRange('B4').setValue(latestNet);
  dashboard.getRange('B4').setNumberFormat('$#,##0');
  dashboard.getRange('B6').setValue(campaignRoi);
  dashboard.getRange('B6').setNumberFormat('0.00%');
}

function removeDuplicateHistoryRows_(history) {
  const lastRow = history.getLastRow();
  const lastCol = history.getLastColumn();
  if (lastRow < 3) return;
  const values = history.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const seen = {};
  const deleteRows = [];
  values.forEach((row, i) => {
    const periodEnd = dateValue_(row[2]);
    const periodStart = dateValue_(row[1]);
    const groupDate = periodEnd || periodStart;
    if (!groupDate) return;
    const grossProfit = moneyNumber_(row[5]);
    const grossLoss = Math.abs(moneyNumber_(row[6]));
    const netPl = grossProfit - grossLoss;
    const key = [dateKey_(groupDate), Math.round(moneyNumber_(row[3])), Math.round(moneyNumber_(row[4])), Math.round(netPl), Math.round(Math.abs(moneyNumber_(row[7]))), Math.round(moneyNumber_(row[8])), Math.round(moneyNumber_(row[9]))].join('|');
    const sheetRow = i + 2;
    if (seen[key]) deleteRows.push(sheetRow);
    else seen[key] = true;
  });
  deleteRows.reverse().forEach(r => history.deleteRow(r));
}

function readHistoryRows_(history) {
  const values = history.getDataRange().getValues();
  return values.slice(1).map((row, i) => {
    const periodStart = dateValue_(row[1]);
    const periodEnd = dateValue_(row[2]);
    const groupDate = periodEnd || periodStart;
    return {
      sheetRow: i + 2,
      week_no: row[0],
      period_start: periodStart,
      period_end: periodEnd,
      group_date: groupDate,
      starting_balance: moneyNumber_(row[3]),
      ending_balance: moneyNumber_(row[4]),
      gross_profit: moneyNumber_(row[5]),
      gross_loss: Math.abs(moneyNumber_(row[6])),
      max_dd: Math.abs(moneyNumber_(row[7])),
      wins: moneyNumber_(row[8]),
      trades: moneyNumber_(row[9]),
      statement_link: row[10] || '',
      operator_note: row[11] || ''
    };
  }).filter(r => r.group_date).sort((a, b) => a.group_date - b.group_date || a.sheetRow - b.sheetRow);
}

function cleanMembersModel_(members) {
  if (!members || members.getLastRow() < 2) return;
  const values = members.getDataRange().getValues();
  const headers = values[0].map(h => normalizeKey_(h));
  const colName = headers.indexOf('display_name') + 1;
  const colCapital = headers.indexOf('capital') + 1;
  const colShare = headers.indexOf('share_pct') + 1;
  const colStatus = headers.indexOf('status') + 1;

  if (colName > 0) {
    const names = members.getRange(2, colName, members.getLastRow() - 1, 1).getValues();
    members.getRange(2, colName, members.getLastRow() - 1, 1).setValues(names.map(r => [String(r[0] || '').trim()]));
  }

  if (colCapital > 0 && colShare > 0 && colStatus > 0) {
    const data = members.getRange(2, 1, members.getLastRow() - 1, members.getLastColumn()).getValues();
    const activeCapital = data.reduce((sum, row) => {
      const status = String(row[colStatus - 1] || '').toLowerCase().trim();
      if (status !== 'active') return sum;
      return sum + moneyNumber_(row[colCapital - 1]);
    }, 0);
    const shares = data.map(row => {
      const status = String(row[colStatus - 1] || '').toLowerCase().trim();
      const capital = moneyNumber_(row[colCapital - 1]);
      if (status !== 'active' || activeCapital === 0) return [0];
      return [capital / activeCapital];
    });
    members.getRange(2, colShare, shares.length, 1).setValues(shares);
    members.getRange(2, colShare, shares.length, 1).setNumberFormat('0.00%');
  }
}

function memberLookup_(e) {
  const params = e && e.parameter ? e.parameter : {};
  const memberNo = String(params.member_no || '').trim();
  const code = String(params.code || '').trim();
  if (!memberNo || !code) return { ok: false, error: 'member_no_and_access_code_required' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = readSettings_(ss);
  const members = readMembers_(ss);
  const activeMembers = members.filter(m => String(m.status || '').toLowerCase().trim() === 'active');
  const found = activeMembers.find(m => String(m.member_no || '').trim() === memberNo && String(m.access_code || '').trim() === code);

  if (!found) return { ok: false, error: 'wrong_member_no_or_access_code' };

  const totalCapital = activeMembers.reduce((s, m) => s + moneyNumber_(m.capital), 0);
  const memberCapital = moneyNumber_(found.capital);
  const sharePct = totalCapital > 0 ? memberCapital / totalCapital * 100 : 0;

  return {
    ok: true,
    campaign: buildCampaign_(settings, activeMembers, totalCapital),
    member: {
      member_no: Number(found.member_no),
      display_name: String(found.display_name || ''),
      capital: memberCapital,
      share_pct: sharePct,
      status: String(found.status || 'active')
    },
    market_brief: readMarketBrief_(ss)
  };
}

function campaignStatus_() { return { ok: false, error: 'campaign_status_disabled' }; }

function buildCampaign_(settings, activeMembers, totalCapital) {
  return {
    campaign_id: String(settings.campaign_id || 'POI_CAMPAIGN'),
    model_type: String(settings.model_type || 'weighted'),
    member_count: activeMembers.length,
    total_capital: totalCapital,
    monthly_roi: percentNumber_(settings.monthly_roi, 10),
    cost_pct: percentNumber_(settings.cost_pct, 2),
    scaleup_pct: percentNumber_(settings.scaleup_pct, 50),
    incentive_pct: percentNumber_(settings.incentive_pct, 5),
    months: numberOr_(settings.months, 12),
    close_method: String(settings.close_method || 'B'),
    max_campaign_capital: numberOr_(settings.max_campaign_capital, 400000),
    max_members: numberOr_(settings.max_members, 10)
  };
}

function showMemberApiTest() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const members = readMembers_(ss).filter(m => String(m.status || '').toLowerCase().trim() === 'active');
  if (!members.length) {
    SpreadsheetApp.getUi().alert('active member олдсонгүй.');
    return;
  }
  const first = members[0];
  SpreadsheetApp.getUi().alert('Deploy хийсний дараа Web App URL-ийн араас ингэж test хийнэ:\n\n?action=member_lookup&member_no=' + first.member_no + '&code=' + first.access_code + '\n\nЖишээ: member_no=' + first.member_no + ', code=' + first.access_code);
}

function setupMarketBriefSheet(showAlert) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_MARKET_BRIEF);
  if (!sh) {
    sh = ss.insertSheet(SHEET_MARKET_BRIEF);
    sh.getRange('A1:B1').setValues([['key', 'value']]);
    sh.getRange('A2:B5').setValues([
      ['market_title', '7 хоногийн ерөнхий дүр зураг'],
      ['market_summary', 'Энд ирэх 7 хоногийн зах зээлийн тойм бичнэ.'],
      ['risk_note', 'Зах зээлийн нөхцөл өөрчлөгдвөл дараагийн шинэчлэлтээр энэ хэсэг дахин солигдоно.'],
      ['update_date', new Date()]
    ]);
    sh.getRange('A1:B1').setFontWeight('bold').setBackground('#067a5a').setFontColor('#ffffff');
    sh.setColumnWidths(1, 1, 180);
    sh.setColumnWidths(2, 1, 520);
    sh.getRange('B5').setNumberFormat('yyyy-mm-dd');
  }
  if (showAlert !== false) SpreadsheetApp.getUi().alert('market_brief sheet бэлэн. B2:B5 дээр тоймоо бичнэ.');
}

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

function readSettings_(ss) {
  const sh = ss.getSheetByName(SHEET_SETTINGS);
  if (!sh) throw new Error('campaign_settings sheet олдсонгүй');
  const values = sh.getDataRange().getValues();
  const out = {};
  for (let i = 1; i < values.length; i++) {
    const key = normalizeKey_(values[i][0]);
    const value = values[i][1];
    if (key) out[key] = value;
  }
  return out;
}

function readMembers_(ss) {
  const sh = ss.getSheetByName(SHEET_MEMBERS);
  if (!sh) throw new Error('members_model sheet олдсонгүй');
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => normalizeKey_(h));
  return values.slice(1).filter(row => row.join('').trim() !== '').map(row => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = row[i]; });
    return obj;
  });
}

function readMembersForPublic_(membersSheet) {
  if (!membersSheet || membersSheet.getLastRow() < 2) return [];
  const values = membersSheet.getDataRange().getValues();
  const headers = values[0].map(h => normalizeKey_(h));
  const colNo = headers.indexOf('member_no');
  const colName = headers.indexOf('display_name');
  const colCapital = headers.indexOf('capital');
  const colShare = headers.indexOf('share_pct');
  const colStatus = headers.indexOf('status');
  return values.slice(1).filter(row => String(row[colStatus] || '').toLowerCase().trim() === 'active').map(row => ({
    member_no: colNo >= 0 ? row[colNo] : '',
    display_name: colName >= 0 ? row[colName] : '',
    capital: colCapital >= 0 ? moneyNumber_(row[colCapital]) : 0,
    share_pct: colShare >= 0 ? row[colShare] : ''
  }));
}

function readWebConfig_(webConfigSheet) {
  const out = {
    default_member_count: { value: 2 },
    default_monthly_return_pct: { value: 0.10 },
    default_member_capital: { value: 50000 },
    default_scale_up_pct: { value: 0.50 },
    default_cost_pct: { value: 0.02 },
    default_campaign_months: { value: 12 },
    show_member_names: { value: false }
  };
  if (!webConfigSheet || webConfigSheet.getLastRow() < 2) return out;
  const values = webConfigSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const key = normalizeKey_(values[i][0]);
    if (key) out[key] = { value: values[i][1] };
  }
  return out;
}

function rowValueForHistoryHeader_(header, rowData) {
  const h = normalizeKey_(header);
  const aliases = {
    week: 'week_no', week_number: 'week_no',
    start: 'period_start', start_date: 'period_start',
    end: 'period_end', end_date: 'period_end',
    start_balance: 'starting_balance', balance_start: 'starting_balance',
    end_balance: 'ending_balance', balance_end: 'ending_balance',
    profit: 'gross_profit', gross_pnl: 'gross_profit',
    loss: 'gross_loss',
    max_dd: 'max_drawdown_usd', max_drawdown: 'max_drawdown_usd', drawdown: 'max_drawdown_usd',
    wins: 'winning_trades', win_trades: 'winning_trades',
    trades: 'total_trades',
    link: 'statement_link', statement: 'statement_link',
    note: 'operator_note', notes: 'operator_note'
  };
  const key = aliases[h] || h;
  return rowData[key] !== undefined ? rowData[key] : '';
}

function normalizeKey_(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function dateValue_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value === 'number' && value > 20000) {
    const base = new Date(1899, 11, 30);
    base.setDate(base.getDate() + Math.floor(value));
    return new Date(base.getFullYear(), base.getMonth(), base.getDate());
  }
  const s = String(value || '').trim();
  const full = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (full) return new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3]));
  return null;
}

function monthStart_(value) {
  const d = dateValue_(value);
  if (d) return new Date(d.getFullYear(), d.getMonth(), 1);
  const s = String(value || '').trim();
  const m = s.match(/^(\d{4})[-\/](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, 1);
  return null;
}

function sameMonth_(d, m) {
  return d && m && d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
}

function dateKey_(d) {
  if (!d) return '';
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function moneyNumber_(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/\$/g, '').replace(/,/g, '').replace(/%/g, '').trim();
  return Number(cleaned) || 0;
}

function numberOr_(value, fallback) {
  const n = moneyNumber_(value);
  return n || fallback;
}

function percentNumber_(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') {
    if (value > 0 && value <= 1) return value * 100;
    return value;
  }
  const raw = String(value).trim();
  const n = Number(raw.replace('%', '').replace(',', ''));
  if (!n && n !== 0) return fallback;
  if (raw.includes('%')) return n;
  if (n > 0 && n <= 1) return n * 100;
  return n;
}

function apiOutput_(obj, callback) {
  const json = JSON.stringify(obj);
  const cb = String(callback || '').trim();
  if (cb) {
    const safeCb = cb.replace(/[^a-zA-Z0-9_$\.]/g, '');
    return ContentService
      .createTextOutput(safeCb + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonOutput(obj) {
  return apiOutput_(obj, '');
}
