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
