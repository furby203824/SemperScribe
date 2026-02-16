/**
 * Mail Merge Utilities
 *
 * Detects {{FIELD}} merge tokens in form data and paragraph content,
 * exports CSV templates, imports filled CSVs, and substitutes values.
 */

import { FormData, ParagraphData } from '@/types';

// ─── Merge Token Detection ─────────────────────────────────────────────────

/** Regex that matches {{FIELD_NAME}} tokens (case-insensitive contents). */
const MERGE_TOKEN_RE = /\{\{([A-Za-z0-9_ ]+?)\}\}/g;

/** Extract all unique merge field names from a single string. */
export function extractTokens(text: string): string[] {
  const tokens = new Set<string>();
  let match;
  while ((match = MERGE_TOKEN_RE.exec(text)) !== null) {
    tokens.add(match[1].trim().toUpperCase());
  }
  MERGE_TOKEN_RE.lastIndex = 0; // reset global regex
  return Array.from(tokens);
}

/** Well-known top-level form fields that can be used as merge columns. */
export const MERGEABLE_FORM_FIELDS: { key: string; label: string; description: string }[] = [
  { key: 'to', label: 'TO', description: 'Addressee (To line)' },
  { key: 'from', label: 'FROM', description: 'Originator (From line)' },
  { key: 'subj', label: 'SUBJECT', description: 'Subject line' },
  { key: 'date', label: 'DATE', description: 'Letter date (DD Mmm YY)' },
  { key: 'sig', label: 'SIGNATURE', description: 'Signature block name' },
  { key: 'sigTitle', label: 'SIG_TITLE', description: 'Signer title / rank' },
  { key: 'name', label: 'NAME', description: 'Service member name (Page 11)' },
  { key: 'edipi', label: 'EDIPI', description: 'DoD ID Number (Page 11)' },
];

export interface MergeField {
  name: string;       // e.g. "RANK_NAME"
  source: 'form' | 'paragraph' | 'custom';
  formKey?: string;    // e.g. "to" — only for form-level fields
  description?: string;
}

/**
 * Scan the entire document (form data + paragraphs) and return all detected
 * merge fields — both from {{TOKEN}} patterns and selected form fields.
 */
export function detectMergeFields(
  formData: FormData,
  paragraphs: ParagraphData[],
  selectedFormFields: string[] = []
): MergeField[] {
  const fields: MergeField[] = [];
  const seen = new Set<string>();

  // 1. Add selected top-level form fields
  for (const key of selectedFormFields) {
    const def = MERGEABLE_FORM_FIELDS.find(f => f.key === key);
    if (def && !seen.has(def.label)) {
      seen.add(def.label);
      fields.push({ name: def.label, source: 'form', formKey: key, description: def.description });
    }
  }

  // 2. Scan all string values in formData for {{TOKEN}} patterns
  for (const [, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      for (const token of extractTokens(value)) {
        if (!seen.has(token)) {
          seen.add(token);
          fields.push({ name: token, source: 'form' });
        }
      }
    }
  }

  // 3. Scan all paragraph content
  for (const para of paragraphs) {
    if (para.content) {
      for (const token of extractTokens(para.content)) {
        if (!seen.has(token)) {
          seen.add(token);
          fields.push({ name: token, source: 'paragraph' });
        }
      }
    }
  }

  return fields;
}

// ─── CSV Template Export ────────────────────────────────────────────────────

/** Escape a value for CSV (wrap in quotes if it contains commas, quotes, or newlines). */
function csvEscape(val: string): string {
  if (/[",\n\r]/.test(val)) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Generate a CSV template string with column headers for the given merge fields.
 * Includes an example row showing expected format.
 */
export function generateCsvTemplate(fields: MergeField[]): string {
  if (fields.length === 0) return '';

  const headers = fields.map(f => csvEscape(f.name));
  const examples = fields.map(f => {
    // Provide sensible example values
    const name = f.name.toUpperCase();
    if (name === 'TO') return csvEscape('Commanding Officer, 1st Bn 5th Mar');
    if (name === 'FROM') return csvEscape('Commanding General, 1st Marine Division');
    if (name === 'SUBJECT') return csvEscape('EXAMPLE SUBJECT LINE IN ALL CAPS');
    if (name === 'DATE') return csvEscape('01 Mar 26');
    if (name === 'SIGNATURE') return csvEscape('I. M. MARINE');
    if (name === 'SIG_TITLE') return csvEscape('Colonel, U.S. Marine Corps');
    if (name === 'NAME') return csvEscape('DOE, JOHN M.');
    if (name === 'EDIPI') return csvEscape('1234567890');
    if (name.includes('RANK')) return csvEscape('Cpl');
    if (name.includes('UNIT')) return csvEscape('1st Bn 5th Mar');
    if (name.includes('DATE')) return csvEscape('01 Mar 26');
    return csvEscape('(enter value)');
  });

  return [headers.join(','), examples.join(','), ''].join('\n');
}

// ─── CSV Import & Parsing ──────────────────────────────────────────────────

export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

/**
 * Parse a CSV string into rows of key-value records.
 * Handles quoted fields, commas within quotes, and escaped quotes.
 */
export function parseCsv(csvText: string): CsvParseResult {
  const errors: string[] = [];
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    return { headers: [], rows: [], errors: ['CSV must have at least a header row and one data row.'] };
  }

  const headers = parseCsvLine(lines[0]).map(h => h.trim().toUpperCase());

  if (headers.length === 0) {
    return { headers: [], rows: [], errors: ['No column headers found in CSV.'] };
  }

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: expected ${headers.length} columns, got ${values.length}. Skipping.`);
      continue;
    }
    const record: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j];
    }
    rows.push(record);
  }

  return { headers, rows, errors };
}

/** Parse a single CSV line respecting quoted fields. */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

/**
 * Validate that the imported CSV columns match the expected merge fields.
 * Returns list of missing columns (if any).
 */
export function validateCsvColumns(
  csvHeaders: string[],
  expectedFields: MergeField[]
): { valid: boolean; missing: string[]; extra: string[] } {
  const expected = new Set(expectedFields.map(f => f.name.toUpperCase()));
  const actual = new Set(csvHeaders.map(h => h.toUpperCase()));

  const missing = [...expected].filter(e => !actual.has(e));
  const extra = [...actual].filter(a => !expected.has(a));

  return { valid: missing.length === 0, missing, extra };
}

// ─── Substitution Engine ────────────────────────────────────────────────────

/** Replace all {{TOKEN}} occurrences in a string with values from the record. */
function substituteString(template: string, record: Record<string, string>): string {
  return template.replace(MERGE_TOKEN_RE, (match, token) => {
    const key = token.trim().toUpperCase();
    return record[key] ?? match; // leave unreplaced if not in record
  });
}

/**
 * Apply a merge record to form data — returns a new FormData with all
 * {{TOKEN}} patterns replaced and form-level fields overridden.
 */
export function applyMergeRecord(
  templateFormData: FormData,
  templateParagraphs: ParagraphData[],
  record: Record<string, string>,
  mergeFields: MergeField[]
): { formData: FormData; paragraphs: ParagraphData[] } {
  // Deep clone
  const formData: FormData = JSON.parse(JSON.stringify(templateFormData));
  const paragraphs: ParagraphData[] = JSON.parse(JSON.stringify(templateParagraphs));

  // 1. Override top-level form fields
  for (const field of mergeFields) {
    if (field.source === 'form' && field.formKey && record[field.name] !== undefined) {
      (formData as Record<string, unknown>)[field.formKey] = record[field.name];
    }
  }

  // 2. Substitute {{TOKEN}} in all string form fields
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      (formData as Record<string, unknown>)[key] = substituteString(value, record);
    }
  }

  // 3. Substitute {{TOKEN}} in all paragraph content
  for (const para of paragraphs) {
    if (para.content) {
      para.content = substituteString(para.content, record);
    }
  }

  return { formData, paragraphs };
}
