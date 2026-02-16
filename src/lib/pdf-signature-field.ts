/**
 * PDF Signature Field Utility
 *
 * Adds an empty digital signature field to a PDF for CAC/PKI signing in Adobe Reader.
 * The field is positioned above the signature block, aligned with the signer's name.
 */

import { PDFDocument, rgb, PDFPage, PDFDict, PDFArray, PDFRawStream, decodePDFRawStream, PDFName, PDFString, PDFNumber, PDFRef } from 'pdf-lib';
import { PDF_INDENTS, PDF_MARGINS } from './pdf-settings';

// Signature field dimensions in points (1 inch = 72 points)
const SIGNATURE_FIELD = {
  width: 108,          // 1.5 inches
  height: 36,          // ~0.5 inches (2 lines at ~18pt)
  xOffset: PDF_MARGINS.left + PDF_INDENTS.signature,  // Page margin + signature indent (aligned with signature block)
  yAboveName: 24,      // Points to shift up from the signature name position
};

// Text appearance constants for the placeholder
const PLACEHOLDER_TEXT = {
  content: 'SIGN HERE',
  size: 10,
  hPadding: 25,
  vOffset: 4,
  color: rgb(0.4, 0.4, 0.6),
};

// Default Y position as percentage from bottom if text search fails
const DEFAULT_Y_RATIO = 0.35;

/**
 * Configuration for signature field placement
 */
export interface SignatureFieldConfig {
  /** Y position from bottom of page in points (if known) */
  yPosition?: number;
  /** Signer's name to search for in the PDF to determine positioning */
  signerName?: string;
}

/**
 * User-specified signature position from the placement modal
 */
export interface ManualSignaturePosition {
  /** Page number (1-indexed) */
  page: number;
  /** X position from left edge in points */
  x: number;
  /** Y position from bottom edge in points */
  y: number;
  /** Width in points */
  width: number;
  /** Height in points */
  height: number;
  /** Name of the signer (for display and tooltip) */
  signerName?: string;
  /** Reason for signing */
  reason?: string;
  /** Contact info for the signer */
  contactInfo?: string;
}

/**
 * Gets the decoded content stream from a PDF page.
 * Handles compressed streams (FlateDecode) used by React-PDF.
 */
function getDecodedContent(page: PDFPage): string | undefined {
  try {
    const rawContent = page.node.Contents();
    if (!rawContent) return undefined;

    let contentBytes: Uint8Array | undefined;

    if (rawContent instanceof PDFRawStream) {
      contentBytes = decodePDFRawStream(rawContent).decode();
    } else if (rawContent instanceof PDFArray) {
      const chunks: Uint8Array[] = [];
      for (let i = 0; i < rawContent.size(); i++) {
        const stream = rawContent.lookup(i);
        if (stream instanceof PDFRawStream) {
          chunks.push(decodePDFRawStream(stream).decode());
        }
      }
      if (chunks.length > 0) {
        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
        contentBytes = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          contentBytes.set(chunk, offset);
          offset += chunk.length;
        }
      }
    }

    if (!contentBytes || contentBytes.length === 0) return undefined;
    return new TextDecoder('latin1').decode(contentBytes);
  } catch {
    return undefined;
  }
}

/**
 * Finds text positioned at the signature X coordinate.
 * The signature block has a unique X position (PDF_MARGINS.left + PDF_INDENTS.signature),
 * so we can find it by looking for text at that position.
 *
 * Strategy: Collect all text positions, then find the lowest one in the signature X range.
 * The signature is typically the last (lowest) content on the page in that column.
 *
 * @param page - The PDF page to search
 * @returns Y position if signature-positioned text is found, undefined otherwise
 */
function findSignatureYPosition(page: PDFPage): number | undefined {
  try {
    const contentStr = getDecodedContent(page);
    if (!contentStr) return undefined;

    // The signature X position range (generous tolerance for different renderers)
    const signatureX = SIGNATURE_FIELD.xOffset;
    const minX = signatureX - 20;
    const maxX = signatureX + 50;

    // Track current position - handle both Tm (absolute) and Td (relative)
    let currentX = 0;
    let currentY = 0;

    // Collect all positions that could be signature text
    const signaturePositions: number[] = [];

    // Combined regex to match Tm and Td operators
    const posRegex = /(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+Tm|(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+T[dD]/g;

    let match;
    while ((match = posRegex.exec(contentStr)) !== null) {
      if (match[6] !== undefined) {
        // Tm operator - absolute positioning
        currentX = parseFloat(match[5]);
        currentY = parseFloat(match[6]);
      } else if (match[8] !== undefined) {
        // Td/TD operator - relative positioning
        currentX += parseFloat(match[7]);
        currentY += parseFloat(match[8]);
      }

      // Check if this position is in the signature X range
      if (currentX >= minX && currentX <= maxX && currentY > 0 && currentY < 700) {
        signaturePositions.push(currentY);
      }
    }

    // Return the lowest Y position in the signature range (lowest on page = smallest Y)
    if (signaturePositions.length > 0) {
      return Math.min(...signaturePositions);
    }

    return undefined;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error finding signature position:', error);
    }
    return undefined;
  }
}

/**
 * Attempts to find text in a PDF page and return its Y position.
 * Searches through the page's content stream for text operations.
 * Handles compressed streams (FlateDecode) used by React-PDF.
 *
 * @param page - The PDF page to search
 * @param searchText - Text to search for (case-insensitive)
 * @returns Y position if found, undefined otherwise
 */
function findTextYPosition(page: PDFPage, searchText: string): number | undefined {
  try {
    const contentStr = getDecodedContent(page);
    if (!contentStr) return undefined;

    const searchUpper = searchText.toUpperCase();

    // Track current Y position from positioning operators
    let currentY = 0;
    let foundY: number | undefined;

    // Combined regex to match operators in order
    const operatorRegex = /(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+Tm|(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+T[dD]|\(([^)]*)\)\s*Tj|\[([^\]]*)\]\s*TJ/g;

    let match;
    while ((match = operatorRegex.exec(contentStr)) !== null) {
      if (match[6] !== undefined) {
        currentY = parseFloat(match[6]);
      } else if (match[8] !== undefined) {
        currentY += parseFloat(match[8]);
      } else if (match[9] !== undefined) {
        if (currentY > 0 && match[9].toUpperCase().includes(searchUpper)) {
          foundY = currentY;
        }
      } else if (match[10] !== undefined) {
        const tjText = match[10].replace(/\([^)]*\)/g, (m) => m.slice(1, -1)).toUpperCase();
        if (currentY > 0 && tjText.includes(searchUpper)) {
          foundY = currentY;
        }
      }
    }

    return foundY;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error parsing PDF content to find text position:', error);
    }
    return undefined;
  }
}

/**
 * Adds a visual signature placeholder to the PDF on the page containing the signature.
 * Users can click this area in Adobe Reader and use Tools > Certificates > Digitally Sign
 * to add their CAC/PKI signature.
 *
 * @param pdfBytes - The PDF as a Uint8Array or ArrayBuffer
 * @param config - Optional configuration for field placement
 * @returns The modified PDF as Uint8Array
 */
export async function addSignatureField(
  pdfBytes: Uint8Array | ArrayBuffer,
  config: SignatureFieldConfig = {}
): Promise<Uint8Array> {
  // Load the PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  // Find the page containing the signature and its Y position
  let targetPage = pages[pages.length - 1]; // Default to last page
  let yPosition = config.yPosition;

  // Search all pages for signature (starting from last page, most likely location)
  if (yPosition === undefined) {
    for (let i = pages.length - 1; i >= 0; i--) {
      // Primary method: find text at the signature X coordinate
      let textY = findSignatureYPosition(pages[i]);

      // Fallback: search for signer's name in text content
      if (textY === undefined && config.signerName) {
        textY = findTextYPosition(pages[i], config.signerName);
      }

      if (textY !== undefined) {
        // Found the signature on this page
        targetPage = pages[i];
        // Position the signature box directly above the signer's name
        yPosition = textY + SIGNATURE_FIELD.yAboveName;
        break;
      }
    }
  }

  const { height } = targetPage.getSize();

  // Fall back to default position if text search didn't work
  if (yPosition === undefined) {
    yPosition = height * DEFAULT_Y_RATIO;
  }

  // Draw a visual indicator for the signature box (visible placeholder)
  targetPage.drawRectangle({
    x: SIGNATURE_FIELD.xOffset,
    y: yPosition,
    width: SIGNATURE_FIELD.width,
    height: SIGNATURE_FIELD.height,
    borderColor: rgb(0.6, 0.6, 0.8),
    borderWidth: 1,
    color: rgb(0.95, 0.97, 1.0),
    opacity: 0.5,
  });

  // Add "SIGN HERE" text inside the box
  targetPage.drawText(PLACEHOLDER_TEXT.content, {
    x: SIGNATURE_FIELD.xOffset + PLACEHOLDER_TEXT.hPadding,
    y: yPosition + SIGNATURE_FIELD.height / 2 - PLACEHOLDER_TEXT.vOffset,
    size: PLACEHOLDER_TEXT.size,
    color: PLACEHOLDER_TEXT.color,
  });

  // Save and return the modified PDF
  return pdfDoc.save();
}

/**
 * Creates a PDF AcroForm signature field that can be signed with PKI/CAC.
 * This creates an actual interactive signature field, not just a visual placeholder.
 *
 * @param pdfDoc - The PDF document
 * @param targetPage - The page to add the field to
 * @param position - Position and dimensions for the field
 * @param fieldName - Name for the signature field
 * @returns The signature field widget annotation reference
 */
function createSignatureField(
  pdfDoc: PDFDocument,
  targetPage: PDFPage,
  position: ManualSignaturePosition,
  fieldName: string = 'Signature1'
): PDFRef {
  const context = pdfDoc.context;

  // Create the signature field dictionary
  const sigFieldDict = context.obj({
    FT: PDFName.of('Sig'),           // Field Type: Signature
    T: PDFString.of(fieldName),      // Field name
    TU: position.signerName ? PDFString.of(`Signer: ${position.signerName}`) : undefined, // Tooltip
    Ff: PDFNumber.of(0),             // Field flags
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Widget'),
    Rect: [
      PDFNumber.of(position.x),
      PDFNumber.of(position.y),
      PDFNumber.of(position.x + position.width),
      PDFNumber.of(position.y + position.height),
    ],
    F: PDFNumber.of(4),              // Print flag
    P: targetPage.ref,               // Page reference
  });

  // Register the signature field
  const sigFieldRef = context.register(sigFieldDict);

  // Get or create the AcroForm - use get() to safely check existence
  const acroFormRef = pdfDoc.catalog.get(PDFName.of('AcroForm'));

  if (acroFormRef) {
    // AcroForm exists - get it and add the field
    const acroForm = context.lookup(acroFormRef) as PDFDict;
    const fieldsRef = acroForm.get(PDFName.of('Fields'));
    if (fieldsRef) {
      const fields = context.lookup(fieldsRef) as PDFArray;
      fields.push(sigFieldRef);
    } else {
      acroForm.set(PDFName.of('Fields'), context.obj([sigFieldRef]));
    }
    // Set SigFlags to indicate signature field exists (1 = SignaturesExist, 2 = AppendOnly)
    acroForm.set(PDFName.of('SigFlags'), PDFNumber.of(3));
  } else {
    // Create new AcroForm
    const newAcroForm = context.obj({
      Fields: [sigFieldRef],
      SigFlags: PDFNumber.of(3),
    });
    pdfDoc.catalog.set(PDFName.of('AcroForm'), newAcroForm);
  }

  // Add the widget annotation to the page - use get() to safely check existence
  const annotsRef = targetPage.node.get(PDFName.of('Annots'));
  if (annotsRef) {
    const annots = context.lookup(annotsRef) as PDFArray;
    annots.push(sigFieldRef);
  } else {
    targetPage.node.set(PDFName.of('Annots'), context.obj([sigFieldRef]));
  }

  return sigFieldRef;
}

/**
 * Adds a signature field at a user-specified position.
 * Creates both a visual placeholder and an interactive PKI signature field.
 *
 * @param pdfBytes - The PDF as a Uint8Array or ArrayBuffer
 * @param position - The user-specified position and dimensions
 * @returns The modified PDF as Uint8Array
 */
export async function addSignatureFieldAtPosition(
  pdfBytes: Uint8Array | ArrayBuffer,
  position: ManualSignaturePosition
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  // Get the target page (1-indexed to 0-indexed)
  const pageIndex = Math.max(0, Math.min(position.page - 1, pages.length - 1));
  const targetPage = pages[pageIndex];

  // Draw the visual signature box at the specified position
  console.log('Drawing signature rectangle at:', { x: position.x, y: position.y, width: position.width, height: position.height });
  targetPage.drawRectangle({
    x: position.x,
    y: position.y,
    width: position.width,
    height: position.height,
    borderColor: rgb(0.3, 0.3, 0.8),
    borderWidth: 1,
    color: rgb(0.95, 0.97, 1.0),
    opacity: 0.3,
  });

  // Draw signer name if available
  if (position.signerName) {
    targetPage.drawText(position.signerName, {
      x: position.x + 2,
      y: position.y + position.height - 10, // Top-left of box
      size: 8,
      color: rgb(0.2, 0.2, 0.6),
    });
  } else {
     targetPage.drawText('Sign Here', {
      x: position.x + 2,
      y: position.y + position.height - 10,
      size: 8,
      color: rgb(0.2, 0.2, 0.6),
    });
  }

  // Create the interactive PKI signature field
  createSignatureField(pdfDoc, targetPage, position, 'Signature1');

  return pdfDoc.save();
}

/**
 * Adds multiple signature fields at user-specified positions.
 * Creates both visual placeholders and interactive PKI signature fields.
 *
 * @param pdfBytes - The PDF as a Uint8Array or ArrayBuffer
 * @param positions - Array of user-specified positions and dimensions
 * @returns The modified PDF as Uint8Array
 */
export async function addMultipleSignatureFields(
  pdfBytes: Uint8Array | ArrayBuffer,
  positions: ManualSignaturePosition[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  positions.forEach((position, index) => {
    // Get the target page (1-indexed to 0-indexed)
    const pageIndex = Math.max(0, Math.min(position.page - 1, pages.length - 1));
    const targetPage = pages[pageIndex];

    // Draw the visual signature box at the specified position
    console.log(`Drawing signature rectangle ${index + 1} at:`, { x: position.x, y: position.y, width: position.width, height: position.height });
    targetPage.drawRectangle({
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      borderColor: rgb(0.3, 0.3, 0.8),
      borderWidth: 1,
      color: rgb(0.95, 0.97, 1.0),
      opacity: 0.3,
    });

    // Draw signer name if available
    if (position.signerName) {
      targetPage.drawText(position.signerName, {
        x: position.x + 2,
        y: position.y + position.height - 10,
        size: 8,
        color: rgb(0.2, 0.2, 0.6),
      });
    }

    // Create the interactive PKI signature field with unique name
    createSignatureField(pdfDoc, targetPage, position, `Signature${index + 1}`);
  });

  return pdfDoc.save();
}
