/**
 * Naval letter formatting utilities
 * Handles font selection and spacing for Times New Roman vs Courier New
 */

import { FormData, ParagraphData } from '@/types';

/**
 * Gets the font name based on user selection
 *
 * @param bodyFont - The font type selection
 * @returns Full font name
 */
export function getBodyFont(bodyFont: 'times' | 'courier'): string {
  return bodyFont === 'courier' ? 'Courier New' : 'Times New Roman';
}

/**
 * Gets proper spacing for From/To labels
 *
 * @param label - "From" or "To"
 * @param bodyFont - The font type
 * @returns Formatted label with appropriate spacing
 */
export function getFromToSpacing(label: string, bodyFont: 'times' | 'courier'): string {
  if (bodyFont === 'courier') {
    if (label === 'From') return 'From:  '; // 2 spaces
    if (label === 'To') return 'To:    '; // 4 spaces
  }
  return `${label}:\t`; // Tab for Times New Roman
}

/**
 * Gets proper spacing for Via entries
 *
 * @param index - Index of the via entry
 * @param bodyFont - The font type
 * @returns Formatted via label with spacing
 */
export function getViaSpacing(index: number, bodyFont: 'times' | 'courier'): string {
  if (bodyFont === 'courier') {
    return index === 0
      ? `Via:\u00A0\u00A0\u00A0(${index + 1})\u00A0` // 3 spaces before, 1 space after
      : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${index + 1})\u00A0`; // 7 spaces before, 1 space after
  }
  return index === 0 ? `Via:\t(${index + 1})\t` : `\t(${index + 1})\t`;
}

/**
 * Gets proper spacing for Subject label
 *
 * @param bodyFont - The font type
 * @returns Formatted subject label with spacing
 */
export function getSubjSpacing(bodyFont: 'times' | 'courier'): string {
  return bodyFont === 'courier' ? 'Subj:  ' : 'Subj:\t'; // 2 spaces or tab
}

/**
 * Gets proper spacing for Reference entries
 *
 * @param letter - Reference letter (a, b, c, etc.)
 * @param index - Index of the reference
 * @param bodyFont - The font type
 * @returns Formatted reference label with spacing
 */
export function getRefSpacing(letter: string, index: number, bodyFont: 'times' | 'courier'): string {
  if (bodyFont === 'courier') {
    return index === 0
      ? `Ref:\u00A0\u00A0\u00A0(${letter})\u00A0` // 3 spaces before, 1 space after
      : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${letter})\u00A0`; // 7 spaces before, 1 space after
  }
  // Times: tab to position "(a)", then single space before text
  return index === 0 ? `Ref:\t(${letter}) ` : `\t(${letter}) `;
}

/**
 * Gets proper spacing for Enclosure entries
 *
 * @param number - Enclosure number
 * @param index - Index of the enclosure
 * @param bodyFont - The font type
 * @returns Formatted enclosure label with spacing
 */
export function getEnclSpacing(number: number, index: number, bodyFont: 'times' | 'courier'): string {
  if (bodyFont === 'courier') {
    return index === 0
      ? `Encl:\u00A0\u00A0(${number})\u00A0` // 2 spaces before, 1 space after
      : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${number})\u00A0`; // 7 spaces before, 1 space after
  }
  // Times: tab to position "(1)", then single space before text
  return index === 0 ? `Encl:\t(${number}) ` : `\t(${number}) `;
}

/**
 * Gets proper spacing for Copy To label
 *
 * @param bodyFont - The font type
 * @returns Formatted copy to label with spacing
 */
export function getCopySpacing(bodyFont: 'times' | 'courier'): string {
  return bodyFont === 'courier' ? 'Copy to:' : 'Copy to:';
}

/**
 * Alias for getCopySpacing to match consumer expectations
 */
export const getCopyToSpacing = getCopySpacing;

/**
 * Splits a subject line into multiple lines based on a character limit
 * while preserving whole words.
 * 
 * @param subject - The subject string
 * @param maxLength - Maximum characters per line
 * @returns Array of subject lines
 */
export function splitSubject(subject: string, maxLength: number = 60): string[] {
  if (!subject) return [];
  
  const words = subject.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    if (currentLine.length + 1 + words[i].length <= maxLength) {
      currentLine += ' ' + words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  
  return lines;
}

/**
 * Formats a date string for cancellation (e.g., "Jun 2025")
 * 
 * @param dateString - The date string to format
 * @returns Formatted date string or original if invalid
 */
export function formatCancellationDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${month} ${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Standard MCO Paragraphs
 */
export function getMCOParagraphs(): ParagraphData[] {
  return [
    { id: 1, level: 1, content: '', title: 'Situation' },
    { id: 2, level: 1, content: '', title: 'Mission' },
    { id: 3, level: 1, content: '', title: 'Execution' },
    { id: 4, level: 1, content: '', title: 'Administration and Logistics' },
    { id: 5, level: 1, content: '', title: 'Command and Signal' },
  ];
}

/**
 * Standard MCBul Paragraphs
 */
export function getMCBulParagraphs(): ParagraphData[] {
  return [
    { id: 1, level: 1, content: '', title: 'Purpose' },
    { id: 2, level: 1, content: '', title: 'Background' },
    { id: 3, level: 1, content: '', title: 'Action' },
    { id: 4, level: 1, content: '', title: 'Reserve Applicability' },
    { id: 5, level: 1, content: '', title: 'Cancellation' },
  ];
}

/**
 * Standard MOA/MOU Paragraphs
 */
export function getMOAParagraphs(type: 'moa' | 'mou' = 'moa'): ParagraphData[] {
  return [
    { id: 1, level: 1, content: 'To define the inter-service support agreement between [Activity A] and [Activity B] regarding', title: 'Purpose' },
    { id: 2, level: 1, content: 'The [Activity A] requires support from [Activity B] to', title: 'Problem' },
    { id: 3, level: 1, content: 'This agreement applies to', title: 'Scope' },
    { id: 4, level: 1, content: '', title: type === 'moa' ? 'Agreement' : 'Understanding' },
    { id: 5, level: 2, content: 'The [Activity A] agrees to', title: '' },
    { id: 6, level: 2, content: 'The [Activity B] agrees to', title: '' },
    { id: 7, level: 1, content: 'This agreement is effective upon signature by both parties and will remain in effect until', title: 'Effective Date' },
  ];
}

/**
 * Generates a standardized filename for exports
 */
export function getExportFilename(formData: FormData, extension: 'pdf' | 'docx' | 'txt'): string {
  const sanitize = (str: string) => (str || '').replace(/[^a-zA-Z0-9\-_ ]/g, '').trim();
  const ssic = sanitize(formData.ssic) || 'Draft';
  const subject = sanitize(formData.subj) || 'Letter';

  // Order / Directive
  if (formData.documentType === 'mco') {
    const prefix = sanitize(formData.orderPrefix) || 'MCO';
    return `${prefix} ${ssic} - ${subject}.${extension}`;
  }

  // Bulletin
  if (formData.documentType === 'bulletin') {
    return `MCBul ${ssic} - ${subject}.${extension}`;
  }

  // Endorsement
  if (formData.documentType === 'endorsement') {
    const level = formData.endorsementLevel || 'Endorsement';
    const ref = sanitize(formData.basicLetterReference) || 'Ref';
    return `${level} on ${ref}.${extension}`;
  }

  // AA Form
  if (formData.documentType === 'aa-form') {
    return `NAVMC 10274 - ${ssic}.${extension}`;
  }

  // Page 11
  if (formData.documentType === 'page11') {
    const name = sanitize(formData.name) || 'Marine';
    return `NAVMC 118(11) - ${name}.${extension}`;
  }

  // AMHS
  if (formData.documentType === 'amhs') {
    return `AMHS - ${subject}.${extension}`;
  }

  // MOA/MOU
  if (formData.documentType === 'moa' || formData.documentType === 'mou') {
    const type = formData.documentType.toUpperCase();
    return `${type} - ${subject}.${extension}`;
  }

  // Staffing Papers
  if (['point-paper', 'talking-paper', 'briefing-paper', 'position-paper', 'trip-report'].includes(formData.documentType)) {
    const type = formData.documentType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return `${type} - ${subject}.${extension}`;
  }

  // Default Basic Letter
  return `Letter ${ssic} - ${subject}.${extension}`;
}

/**
 * Merges Admin Subsections (Records Management, Privacy Act, Reports Required)
 * into the main paragraphs array for export.
 */
export function mergeAdminSubsections(
  paragraphs: ParagraphData[],
  adminSubsections?: import('@/types').AdminSubsections
): ParagraphData[] {
  if (!adminSubsections) return paragraphs;

  // Find "Administration and Logistics" paragraph
  const adminParaIndex = paragraphs.findIndex(p => 
    p.title && p.title.toLowerCase().includes('administration and logistics')
  );

  if (adminParaIndex === -1) return paragraphs;

  const adminPara = paragraphs[adminParaIndex];
  const newParagraphs = [...paragraphs];
  
  // Prepare subsections to insert
  const subsectionsToInsert: ParagraphData[] = [];
  let nextId = Math.max(...paragraphs.map(p => p.id)) + 1;

  // Helper to create subsection
  const createSubsection = (content: string) => ({
    id: nextId++,
    level: adminPara.level + 1,
    content: content || ' ', // Ensure non-empty for rendering
    title: '' // Subsections usually don't have titles in the data structure, just content
  });

  // 1. Records Management
  if (adminSubsections.recordsManagement?.show) {
    const p = createSubsection(adminSubsections.recordsManagement.content);
    // Use markdown for bold header
    p.content = `**Records Management.** ${p.content}`;
    subsectionsToInsert.push(p);
  }

  // 2. Privacy Act
  if (adminSubsections.privacyAct?.show) {
    const p = createSubsection(adminSubsections.privacyAct.content);
    p.content = `**Privacy Act.** ${p.content}`;
    subsectionsToInsert.push(p);
  }

  // 3. Reports Required
  if (adminSubsections.reportsRequired?.show) {
    const p = createSubsection(adminSubsections.reportsRequired.content);
    p.content = `**Reports Required.** ${p.content}`;
    subsectionsToInsert.push(p);
  }

  // Insert after the admin paragraph
  newParagraphs.splice(adminParaIndex + 1, 0, ...subsectionsToInsert);

  return newParagraphs;
}

export function getPointPaperParagraphs(): ParagraphData[] {
  return [
    { id: 1, level: 0, content: 'Use this section to briefly state the history or context of the issue.', title: 'Background', isMandatory: true },
    { id: 2, level: 0, content: 'State the current problem or topic requiring attention.', title: 'Issue', isMandatory: true },
    { id: 3, level: 0, content: 'State the desired outcome or the main takeaway for the reader.', title: 'Recommendation', isMandatory: true },
  ];
}

export function getTalkingPaperParagraphs(): ParagraphData[] {
  return [
    { id: 1, level: 0, content: '', title: 'Background', isMandatory: true },
    { id: 2, level: 0, content: '', title: 'Discussion', isMandatory: true },
  ];
}

export function getBriefingPaperParagraphs(): ParagraphData[] {
  return [
    { id: 1, level: 0, content: '', title: 'Background', isMandatory: true },
    { id: 2, level: 0, content: '', title: 'Discussion', isMandatory: true },
    { id: 3, level: 0, content: '', title: 'Conclusion', isMandatory: true },
  ];
}

export function getPositionPaperParagraphs(): ParagraphData[] {
  return [
    { id: 1, level: 0, content: '', title: 'Issue', isMandatory: true },
    { id: 2, level: 0, content: '', title: 'Position', isMandatory: true },
    { id: 3, level: 0, content: '', title: 'Discussion', isMandatory: true },
    { id: 4, level: 0, content: '', title: 'Recommendation', isMandatory: true },
  ];
}

export function getTripReportParagraphs(): ParagraphData[] {
  return [
    { id: 1, level: 0, content: '', title: 'Purpose', isMandatory: true },
    { id: 2, level: 0, content: '', title: 'Travelers', isMandatory: true },
    { id: 3, level: 0, content: '', title: 'Itinerary', isMandatory: true },
    { id: 4, level: 0, content: '', title: 'Discussion', isMandatory: true },
    { id: 5, level: 0, content: '', title: 'Action Items', isMandatory: true },
  ];
}
