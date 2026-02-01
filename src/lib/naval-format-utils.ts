/**
 * Naval letter formatting utilities
 * Handles font selection and spacing for Times New Roman vs Courier New
 */

import { ParagraphData } from '@/types';

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
export function getCopyToSpacing(bodyFont: 'times' | 'courier'): string {
  return bodyFont === 'courier' ? 'Copy to:  ' : 'Copy to:'; // 2 spaces for Courier
}

/**
 * Splits a string into chunks without breaking words
 * Used for subject line wrapping
 *
 * @param str - The string to split
 * @param chunkSize - Maximum characters per chunk
 * @returns Array of string chunks
 */
export function splitSubject(str: string, chunkSize: number = 60): string[] {
  const chunks: string[] = [];
  if (!str) return chunks;

  let i = 0;
  while (i < str.length) {
    let chunk = str.substring(i, i + chunkSize);

    // Don't break words - find last space if we're not at the end
    if (i + chunkSize < str.length && str[i + chunkSize] !== ' ' && chunk.includes(' ')) {
      const lastSpaceIndex = chunk.lastIndexOf(' ');
      if (lastSpaceIndex > -1) {
        chunk = chunk.substring(0, lastSpaceIndex);
        i += chunk.length + 1; // +1 to skip the space
      } else {
        i += chunkSize;
      }
    } else {
      i += chunkSize;
    }

    chunks.push(chunk.trim());
  }

  return chunks;
}

/**
 * Calculates the precise alignment position for header elements based on character length and font.
 * Simulates right-alignment in a left-aligned tab system.
 * 
 * @param maxCharLength - The length of the longest string in the block
 * @param font - 'times' or 'courier'
 * @returns Twip position for the tab stop
 */
export const getPreciseAlignmentPosition = (maxCharLength: number, font: string = 'times'): number => {
  const isCourier = font.toLowerCase().includes('courier');
  if (isCourier) {
    if (maxCharLength >= 23) return 5184; // 3.6 inches
    else if (maxCharLength >= 21) return 5472;
    else if (maxCharLength >= 19) return 5760;
    else if (maxCharLength >= 17) return 6048;
    else if (maxCharLength >= 15) return 6336;
    else if (maxCharLength >= 13) return 6624;
    else if (maxCharLength >= 11) return 6912;
    else if (maxCharLength >= 9) return 7200;
    else return 7488;
  } else {
    if (maxCharLength >= 23) return 6480; // 4.5 inches
    else if (maxCharLength >= 21) return 6624;
    else if (maxCharLength >= 19) return 6768;
    else if (maxCharLength >= 17) return 6912;
    else if (maxCharLength >= 15) return 7056;
    else if (maxCharLength >= 13) return 7200;
    else if (maxCharLength >= 11) return 7344;
    else if (maxCharLength >= 9) return 7488;
    else return 7632;
  }
};

/**
 * Helper function to format MCBul cancellation date
 */
export const formatCancellationDate = (date: string): string => {
  if (!date) return '';
  try {
    const dateObj = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${month} ${year}`;
  } catch {
    return date;
  }
};

/**
 * Helper function to get cancellation line position
 */
export const getCancellationLinePosition = (cancText: string, font: string = 'times'): number => {
  const textLength = cancText.length;
  return getPreciseAlignmentPosition(textLength, font);
};

/**
 * Returns the default paragraph structure for an MCO
 */
export const getMCOParagraphs = (): ParagraphData[] => {
  return [
    { id: 1, level: 1, content: '', isMandatory: true, title: 'Situation' },
    { id: 2, level: 1, content: '', isMandatory: true, title: 'Cancellation' },
    { id: 3, level: 1, content: '', isMandatory: true, title: 'Mission' },
    { id: 4, level: 1, content: '', isMandatory: true, title: 'Execution' },
    { id: 5, level: 1, content: '', isMandatory: true, title: 'Administration and Logistics' },
    { id: 6, level: 1, content: '', isMandatory: true, title: 'Command and Signal' }
  ];
};

/**
 * Returns the default paragraph structure for a MCBul
 */
export const getMCBulParagraphs = (isContingent: boolean = false): ParagraphData[] => {
  const baseParagraphs: ParagraphData[] = [
    { id: 1, level: 1, content: '', isMandatory: true, title: 'Purpose' },
    { id: 2, level: 1, content: '', isMandatory: true, title: 'Cancellation' },
    { id: 3, level: 1, content: '', isMandatory: true, title: 'Background' },
    { id: 4, level: 1, content: '', isMandatory: true, title: 'Action' },
    { id: 5, level: 1, content: '', isMandatory: true, title: 'Reserve Applicability' }
  ];

  if (isContingent) {
    baseParagraphs.push({
      id: 6,
      level: 1,
      content: '',
      isMandatory: true,
      title: 'Cancellation Contingency'
    });
  }

  return baseParagraphs;
};


