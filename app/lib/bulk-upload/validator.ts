import type { ParsedRow } from './parser';

export interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ValidationWarning {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validRows: ParsedRow[];
}

const VALID_INTAKE_TYPES = ['IRQ', 'SRRF', 'GCG Ad-Hoc'];
const VALID_AD_HOC_CHANNELS = ['In-Person', 'Email', 'Teams'];
const VALID_PROJECT_TYPES = ['Meeting', 'Follow-Up', 'Data Request', 'PCR', 'Other'];
const VALID_DEPARTMENTS = ['IAG', 'Broker-Dealer', 'Institution'];
const VALID_STATUSES = ['Pending', 'In Progress', 'Completed'];
const VALID_INTERNAL_CLIENT_DEPTS = ['IAG', 'Broker-Dealer', 'Institution'];

// Fuzzy normalize for enum matching — case-insensitive, strip spaces/hyphens
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s-_]/g, '');
}

function matchEnum(value: string, options: string[]): string | null {
  const norm = normalize(value);
  return options.find(o => normalize(o) === norm) ?? null;
}

// Alias maps for intake type normalization
const INTAKE_TYPE_ALIASES: Record<string, string> = {
  'gcgadhoc': 'GCG Ad-Hoc',
  'adhoc': 'GCG Ad-Hoc',
  'ad-hoc': 'GCG Ad-Hoc',
  'gcg': 'GCG Ad-Hoc',
  'irq': 'IRQ',
  'srrf': 'SRRF',
  'grrf': 'SRRF', // old name alias
};

function normalizeIntakeType(value: string): string | null {
  const norm = normalize(value);
  if (INTAKE_TYPE_ALIASES[norm]) return INTAKE_TYPE_ALIASES[norm];
  return matchEnum(value, VALID_INTAKE_TYPES);
}

// Alias map for ad-hoc channel
const CHANNEL_ALIASES: Record<string, string> = {
  'inperson': 'In-Person',
  'in-person': 'In-Person',
  'email': 'Email',
  'teams': 'Teams',
  'msteams': 'Teams',
  'microsoftteams': 'Teams',
};

function normalizeChannel(value: string): string | null {
  const norm = normalize(value);
  if (CHANNEL_ALIASES[norm]) return CHANNEL_ALIASES[norm];
  return matchEnum(value, VALID_AD_HOC_CHANNELS);
}

// Alias map for status
const STATUS_ALIASES: Record<string, string> = {
  'inprogress': 'In Progress',
  'in-progress': 'In Progress',
  'active': 'In Progress',
  'open': 'In Progress',
  'pending': 'Pending',
  'waiting': 'Pending',
  'completed': 'Completed',
  'done': 'Completed',
  'finished': 'Completed',
  'closed': 'Completed',
  'complete': 'Completed',
};

function normalizeStatus(value: string): string | null {
  const norm = normalize(value);
  if (STATUS_ALIASES[norm]) return STATUS_ALIASES[norm];
  return matchEnum(value, VALID_STATUSES);
}

// Alias map for departments
const DEPT_ALIASES: Record<string, string> = {
  'iag': 'IAG',
  'institutionalassetgrowth': 'IAG',
  'brokdealer': 'Broker-Dealer',
  'bd': 'Broker-Dealer',
  'brokerdealer': 'Broker-Dealer',
  'institution': 'Institution',
  'institutional': 'Institution',
};

function normalizeDept(value: string): string | null {
  const norm = normalize(value);
  if (DEPT_ALIASES[norm]) return DEPT_ALIASES[norm];
  return matchEnum(value, VALID_DEPARTMENTS);
}

function normalizeProjectType(value: string): string | null {
  const norm = normalize(value);
  // Common aliases
  const aliases: Record<string, string> = {
    'meeting': 'Meeting',
    'followup': 'Follow-Up',
    'follow-up': 'Follow-Up',
    'follow up': 'Follow-Up',
    'datarequest': 'Data Request',
    'data': 'Data Request',
    'pcr': 'PCR',
    'other': 'Other',
  };
  if (aliases[norm]) return aliases[norm];
  return matchEnum(value, VALID_PROJECT_TYPES);
}

export function validateRows(rows: ParsedRow[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const validRows: ParsedRow[] = [];

  for (const row of rows) {
    const rowErrors: ValidationError[] = [];
    const rowWarnings: ValidationWarning[] = [];

    // Required: internalClientName
    if (!row.internalClientName) {
      rowErrors.push({ rowNumber: row.rowNumber, field: 'Internal Client Name', message: 'Required field is missing.' });
    }

    // Required: internalClientDept — normalize
    const normDept = normalizeDept(row.internalClientDept);
    if (!normDept) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        field: 'Internal Client Dept',
        message: `"${row.internalClientDept}" is not valid. Use: ${VALID_INTERNAL_CLIENT_DEPTS.join(', ')}.`,
      });
    } else {
      row.internalClientDept = normDept;
    }

    // Required: intakeType — normalize
    const normIntake = normalizeIntakeType(row.intakeType);
    if (!normIntake) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        field: 'Intake Type',
        message: `"${row.intakeType}" is not valid. Use: ${VALID_INTAKE_TYPES.join(', ')}.`,
      });
    } else {
      row.intakeType = normIntake;
    }

    // Conditional: adHocChannel required for GCG Ad-Hoc
    if (normIntake === 'GCG Ad-Hoc') {
      if (!row.adHocChannel) {
        rowErrors.push({
          rowNumber: row.rowNumber,
          field: 'Ad-Hoc Channel',
          message: 'Required for GCG Ad-Hoc rows. Use: In-Person, Email, or Teams.',
        });
      } else {
        const normChannel = normalizeChannel(row.adHocChannel);
        if (!normChannel) {
          rowErrors.push({
            rowNumber: row.rowNumber,
            field: 'Ad-Hoc Channel',
            message: `"${row.adHocChannel}" is not valid. Use: ${VALID_AD_HOC_CHANNELS.join(', ')}.`,
          });
        } else {
          row.adHocChannel = normChannel;
        }
      }
    }

    // Required: type (project type) — normalize
    const normType = normalizeProjectType(row.type);
    if (!normType) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        field: 'Project Type',
        message: `"${row.type}" is not valid. Use: ${VALID_PROJECT_TYPES.join(', ')}.`,
      });
    } else {
      row.type = normType;
    }

    // Required: department — normalize (already resolved from internalClientDept if blank)
    const normResolvedDept = normalizeDept(row.department);
    if (!normResolvedDept) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        field: 'Department',
        message: `"${row.department}" is not valid. Use: ${VALID_DEPARTMENTS.join(', ')}.`,
      });
    } else {
      row.department = normResolvedDept;
    }

    // Required: dateStarted (already validated as parseable in parser)
    if (!row.dateStarted) {
      rowErrors.push({ rowNumber: row.rowNumber, field: 'Date Started', message: 'Required field is missing or unparseable.' });
    }

    // Required: status — normalize
    const normStatus = normalizeStatus(row.status);
    if (!normStatus) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        field: 'Status',
        message: `"${row.status}" is not valid. Use: ${VALID_STATUSES.join(', ')}.`,
      });
    } else {
      row.status = normStatus;
    }

    // Date logic: dateFinished must be >= dateStarted if provided
    if (row.dateFinished && row.dateStarted && row.dateFinished < row.dateStarted) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        field: 'Date Finished',
        message: 'Date Finished must be on or after Date Started.',
      });
    }

    // Logic: Completed status should have a dateFinished
    if (normStatus === 'Completed' && !row.dateFinished) {
      rowWarnings.push({
        rowNumber: row.rowNumber,
        field: 'Date Finished',
        message: 'Completed rows should have a Date Finished. Today\'s date will be used.',
      });
      row.dateFinished = new Date().toISOString().slice(0, 10);
    }

    // Logic: non-Completed should not have dateFinished (warn only)
    if (normStatus !== 'Completed' && row.dateFinished) {
      rowWarnings.push({
        rowNumber: row.rowNumber,
        field: 'Date Finished',
        message: `Status is "${normStatus}" but Date Finished is set. It will be saved as-is.`,
      });
    }

    errors.push(...rowErrors);
    warnings.push(...rowWarnings);

    if (rowErrors.length === 0) {
      validRows.push(row);
    }
  }

  return { errors, warnings, validRows };
}
