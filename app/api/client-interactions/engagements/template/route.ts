export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

// GET /api/client-interactions/engagements/template
// Returns a downloadable .xlsx template for bulk engagement upload
export async function GET() {
  const workbook = new ExcelJS.Workbook();

  // ── Data sheet ─────────────────────────────────────────────────────────────
  const data = workbook.addWorksheet('Engagements');

  // Column order (13 cols — Department and Portfolio Logged are auto-derived):
  // A  External Client
  // B  Internal Client Name
  // C  Internal Client Dept
  // D  Intake Type
  // E  Ad-Hoc Channel
  // F  Project Type
  // G  Team Members
  // H  Date Started
  // I  Date Finished
  // J  Status
  // K  NNA ($M)
  // L  Notes
  // M  Tickers Mentioned
  data.columns = [
    { header: 'External Client',      key: 'externalClient',     width: 24 },
    { header: 'Internal Client Name', key: 'internalClientName', width: 24 },
    { header: 'Internal Client Dept', key: 'internalClientDept', width: 22 },
    { header: 'Intake Type',          key: 'intakeType',          width: 16 },
    { header: 'Ad-Hoc Channel',       key: 'adHocChannel',        width: 16 },
    { header: 'Project Type',         key: 'type',                width: 16 },
    { header: 'Team Members',         key: 'teamMembers',         width: 30 },
    { header: 'Date Started',         key: 'dateStarted',         width: 14 },
    { header: 'Date Finished',        key: 'dateFinished',        width: 14 },
    { header: 'Status',               key: 'status',              width: 14 },
    { header: 'NNA ($M)',             key: 'nna',                 width: 12 },
    { header: 'Notes',                key: 'notes',               width: 40 },
    { header: 'Tickers Mentioned',    key: 'tickersMentioned',    width: 30 },
  ];

  // Style header row — apply fill cell-by-cell so it stops at column M
  data.getRow(1).height = 20;
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach(col => {
    const cell = data.getCell(`${col}1`);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { vertical: 'middle' };
  });

  // Dropdown validation for enum columns
  const addValidation = (col: string, formula: string) => {
    for (let i = 2; i <= 1001; i++) {
      data.getCell(`${col}${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [formula],
        showErrorMessage: true,
        errorTitle: 'Invalid value',
        error: 'Please select from the dropdown list.',
      };
    }
  };

  addValidation('C', '"IAG,Broker-Dealer,Institutional"');
  addValidation('D', '"IRQ,SRRF,GCG Ad-Hoc"');
  addValidation('E', '"In-Person,Email,Teams"');
  addValidation('F', '"Meeting,Follow-Up,Data Request,PCR,Other"');
  addValidation('J', '"Pending,In Progress,Completed"');

  // Date format for date columns
  for (let i = 2; i <= 1001; i++) {
    data.getCell(`H${i}`).numFmt = 'yyyy-mm-dd';
    data.getCell(`I${i}`).numFmt = 'yyyy-mm-dd';
  }

  // Example rows
  const examples: Record<string, unknown>[] = [
    {
      externalClient: 'Acme Pension Fund',
      internalClientName: 'Sarah K.',
      internalClientDept: 'IAG',
      intakeType: 'IRQ',
      adHocChannel: '',
      type: 'Meeting',
      teamMembers: 'Eli F., Sarah K.',
      dateStarted: '2024-06-10',
      dateFinished: '2024-06-14',
      status: 'Completed',
      nna: 120,
      notes: 'Client requested equity exposure analysis.',
      tickersMentioned: '',
    },
    {
      externalClient: 'BlueStar Wealth',
      internalClientName: 'David L.',
      internalClientDept: 'Broker-Dealer',
      intakeType: 'SRRF',
      adHocChannel: '',
      type: 'Data Request',
      teamMembers: 'David L.',
      dateStarted: '2024-09-03',
      dateFinished: '',
      status: 'In Progress',
      nna: '',
      notes: '',
      tickersMentioned: '',
    },
    {
      externalClient: '',
      internalClientName: 'Chris B.',
      internalClientDept: 'Institutional',
      intakeType: 'GCG Ad-Hoc',
      adHocChannel: 'Teams',
      type: 'Meeting',
      teamMembers: 'Chris B., Amanda P.',
      dateStarted: '2024-11-18',
      dateFinished: '2024-11-18',
      status: 'Completed',
      nna: '',
      notes: 'Discussed DFA core equity vs Vanguard.',
      tickersMentioned: 'DFAC, VTI',
    },
  ];

  examples.forEach((ex, i) => {
    const row = data.addRow(ex);
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: i % 2 === 0 ? 'FFF4F6F9' : 'FFFFFFFF' },
    };
  });

  data.views = [{ state: 'frozen', ySplit: 1 }];

  // ── Reference sheet ─────────────────────────────────────────────────────────
  const ref = workbook.addWorksheet('Reference');
  ref.getColumn(1).width = 28;
  ref.getColumn(2).width = 55;

  const refHeader = ref.addRow(['Column', 'Valid Values / Notes']);
  refHeader.font = { bold: true };
  refHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7EF' } };

  const refData: [string, string][] = [
    ['External Client', 'Name of the external client/fund. Leave blank for GCG Ad-Hoc rows.'],
    ['Internal Client Name', 'Required. Name of the internal contact (e.g. "Sarah K.")'],
    ['Internal Client Dept', 'Required. IAG | Broker-Dealer | Institutional'],
    ['Intake Type', 'Required. IRQ | SRRF | GCG Ad-Hoc'],
    ['Ad-Hoc Channel', 'Required only for GCG Ad-Hoc rows. In-Person | Email | Teams'],
    ['Project Type', 'Required. Meeting | Follow-Up | Data Request | PCR | Other'],
    ['Team Members', 'Optional. Comma-separated names, e.g. "Eli F., Sarah K."'],
    ['Date Started', 'Required. Format: YYYY-MM-DD or M/D/YYYY'],
    ['Date Finished', 'Leave blank for Pending / In Progress rows.'],
    ['Status', 'Required. Pending | In Progress | Completed'],
    ['NNA ($M)', 'Optional. Net New Assets in millions. "120" = $120M.'],
    ['Notes', 'Optional. Free text.'],
    ['Tickers Mentioned', 'Optional. Comma-separated tickers (GCG Ad-Hoc). E.g. "DFAC, VTI"'],
    ['', ''],
    ['Auto-filled by system', 'Department (from Internal Client Dept) · Portfolio Logged (always No on import)'],
  ];

  refData.forEach(([col, note]) => ref.addRow([col, note]));

  // Serialize
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="engagement-bulk-upload-template.xlsx"',
      'Content-Length': buffer.length.toString(),
    },
  });
}
