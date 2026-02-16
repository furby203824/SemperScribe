
import { FormData, AMHSReference } from '@/types';

// Constants
export const AMHS_LINE_LIMIT = 69;

/**
 * Validation error structure
 */
export interface AMHSValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates an AMHS message before copy/export.
 */
export function validateAMHSMessage(data: FormData, references: AMHSReference[] = []): AMHSValidationResult {
  const errors: string[] = [];

  // Required field checks
  if (!data.originatorCode?.trim() && !data.from?.trim()) {
    errors.push('Originator (FROM) is required');
  }

  if (!data.subj?.trim()) {
    errors.push('Subject is required');
  }

  if (!data.amhsTextBody?.trim()) {
    errors.push('Message text is required');
  }

  if (!data.amhsDtg?.trim()) {
    errors.push('Date-Time Group (DTG) is required');
  }

  // Reference validation
  references.forEach((ref, idx) => {
    const letter = String.fromCharCode(65 + idx);
    if (ref.title && !ref.docId) {
      errors.push(`Reference ${letter} has title but missing document identifier`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generates the current Date-Time Group (DTG) in Zulu time.
 * Format: DDHHMMZMMMYY (e.g., 011230ZFEB26)
 */
export function generateDTG(date: Date = new Date()): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[date.getUTCMonth()];
  const year = String(date.getUTCFullYear()).slice(-2);
  
  return `${day}${hours}${minutes}Z${month}${year}`;
}

/**
 * Wraps text to a specific character limit without breaking words.
 * Returns an array of strings (lines).
 */
export function wrapText(text: string, limit: number = AMHS_LINE_LIMIT): string[] {
  if (!text) return [];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if (currentLine.length + 1 + word.length <= limit) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  
  return lines;
}

/**
 * Generates the NARR/ block from a list of references.
 */
export function generateNarrative(references: AMHSReference[]): string {
  if (!references || references.length === 0) return '';
  
  const narrativeParts = references
    .filter(ref => ref.title && ref.title.trim().length > 0)
    .map(ref => `REF ${ref.letter} IS THE ${ref.title.toUpperCase()}`);
    
  if (narrativeParts.length === 0) return '';
  
  return narrativeParts.join('. ') + '.';
}

/**
 * Formats the entire AMHS message into a single string.
 * Strictly follows the legacy format.
 */
export function generateFullMessage(data: FormData, references: AMHSReference[] = [], pocs: string[] = []): string {
  const lines: string[] = [];
  
  const classification = data.amhsClassification || 'UNCLASSIFIED';
  const precedence = data.amhsPrecedence || 'ROUTINE';
  const dtg = data.amhsDtg || generateDTG();
  const originator = (data.originatorCode || data.from || 'ORIGINATOR').toUpperCase();
  const officeCode = data.amhsOfficeCode ? data.amhsOfficeCode.toUpperCase() : '';
  const msgType = data.amhsMessageType || 'GENADMIN';

  // 1. Header Section
  lines.push(`${classification}//`);
  lines.push(precedence);
  lines.push(dtg);
  
  let fmLine = `FM ${originator}`;
  if (officeCode) fmLine += `/${officeCode}`;
  lines.push(`${fmLine}//`);
  
  lines.push('BT');
  
  // 2. Body Section
  lines.push(`${classification}//`);
  
  let msgIdLine = `MSGID/${msgType}/${originator}`;
  if (officeCode) msgIdLine += `/${officeCode}`;
  lines.push(`${msgIdLine}//`);
  
  // SUBJ
  if (data.subj) {
    const subjLines = wrapText(`SUBJ/${data.subj.toUpperCase()}//`);
    lines.push(...subjLines);
  }
  
  // REF
  if (references.length > 0) {
    references.forEach(ref => {
      // REF/A/MSGID: DOC/MCO 1234.5//
      const refLine = `REF/${ref.letter}/${ref.type}/${ref.docId.toUpperCase()}//`;
      lines.push(...wrapText(refLine));
    });
  }
  
  // NARR (Auto-generated if not provided, or uses provided)
  // Legacy logic: if narrative is provided, use it. If not, generate it?
  // Actually legacy has a "Generate NARR" button that fills the textarea.
  // So we should rely on data.amhsNarrative.
  if (data.amhsNarrative) {
    const narrLines = wrapText(`NARR/${data.amhsNarrative.toUpperCase()}//`);
    lines.push(...narrLines);
  } else if (references.length > 0) {
      // Fallback: generate if not explicitly provided but references exist?
      // Legacy behavior: "Generate NARR" button fills the box. If box is empty, it stays empty.
      // But for safety, if user added refs but forgot NARR, maybe we shouldn't auto-add it to avoid duplication if they typed it manually.
      // We will trust the state.
  }
  
  // POC
  if (pocs.length > 0) {
    pocs.forEach(poc => {
      lines.push(...wrapText(`POC/${poc}//`));
    });
  }
  
  // GENTEXT/REMARKS
  if (data.amhsTextBody) {
    lines.push(`GENTEXT/REMARKS/`);
    
    // Split by newline to preserve paragraphs
    const paragraphs = data.amhsTextBody.split('\n');
    
    paragraphs.forEach((para: string) => {
      const trimmed = para.trimEnd(); // Don't trim start to preserve indentation
      if (trimmed === '') {
        lines.push(''); // Empty line
      } else {
        // We need to wrap lines but respect the 69 char limit.
        // wrapText splits by space, which kills indentation if we aren't careful.
        // But AMHS is usually strict. Legacy formatToAMHSLines splits by space.
        // So indentation (like 4 spaces) becomes just a word if not handled.
        // But wrapText logic: words = text.split(' '). 
        // '    A.' -> ['', '', '', '', 'A.']
        // This will preserve spaces?
        // Let's check wrapText:
        // const words = text.split(' ');
        // If text is "    A.", words is ["", "", "", "", "A."]
        // currentLine starts as ""
        // i=1: word="" -> currentLine=" "
        // It basically collapses multiple spaces into single spaces if we aren't careful?
        // Actually split(' ') preserves empty strings for multiple spaces.
        // But rejoining with ' ' adds them back.
        // So "  " -> ["", "", ""] -> joined with " " -> "  "
        // So wrapText should preserve indentation roughly.
        lines.push(...wrapText(trimmed.toUpperCase()));
      }
    });
    
    // End of remarks
    lines[lines.length - 1] = lines[lines.length - 1] + '//';
  }
  
  lines.push('BT');
  lines.push(`${classification}//`);
  
  return lines.join('\n');
}
