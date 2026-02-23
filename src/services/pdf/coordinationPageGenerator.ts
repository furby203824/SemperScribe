import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';

interface CoordinatingOffice {
  office: string;
  concurrence: 'concur' | 'concur-comment' | 'nonconcur' | 'nonconcur-comment' | 'no-response' | 'pending';
  aoName?: string;
  date?: string;
  initials?: string;
  comments?: string;
  datePosition?: string;
  staffingComment?: string;
  concurrenceCommentText?: string;
  noResponseDate?: string;
}

export interface CoordinationPageData {
  documentType: string;
  subj: string;
  coordinatingOffices?: CoordinatingOffice[];
  bodyFont?: 'times' | 'courier';
  [key: string]: unknown;
}

// Helper to wrap text within a given width
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

export async function createCoordinationPagePdf(data: CoordinationPageData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]); // Letter size

  // Select font based on bodyFont setting
  const isCourier = data.bodyFont === 'courier';
  const font = await pdfDoc.embedFont(isCourier ? StandardFonts.Courier : StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(isCourier ? StandardFonts.CourierBold : StandardFonts.TimesRomanBold);

  const margin = 72; // 1 inch margins
  const pageWidth = 612;
  const contentWidth = pageWidth - margin * 2;
  let y = 792 - margin;

  const black = rgb(0, 0, 0);

  // Helper to add a new page if needed
  function ensureSpace(needed: number): PDFPage {
    if (y - needed < margin) {
      page = pdfDoc.addPage([612, 792]);
      y = 792 - margin;
    }
    return page;
  }

  // === TITLE ===
  const title = 'COORDINATION PAGE';
  const titleWidth = boldFont.widthOfTextAtSize(title, 14);
  page.drawText(title, {
    x: (pageWidth - titleWidth) / 2,
    y,
    font: boldFont,
    size: 14,
    color: black,
  });
  y -= 30;

  // === SUBJECT ===
  page.drawText('Subj:', { x: margin, y, font: boldFont, size: 11, color: black });
  const subjLines = wrapText(data.subj || '', font, 11, contentWidth - 40);
  for (let i = 0; i < subjLines.length; i++) {
    page.drawText(subjLines[i], {
      x: margin + 40,
      y: y - (i * 14),
      font,
      size: 11,
      color: black,
    });
  }
  y -= subjLines.length * 14 + 10;

  // === COORDINATION LIST ===
  // Per MCO 5216.20B: 3 columns (no borders, plain list)
  //   1. STAFF/EXTERNAL AGENCY
  //   2. NAME (grade & name, or "None Obtained")
  //   3. DATE & POSITION (date + concur/nonconcur)
  const offices = data.coordinatingOffices || [];

  // Column x-positions
  const colAgency = margin;
  const colName = margin + 130;
  const colDatePos = margin + 240;
  const rowHeight = 16;

  // Header text
  const headerFontSize = 9;
  page.drawText('STAFF/EXTERNAL AGENCY', { x: colAgency, y, font: boldFont, size: headerFontSize, color: black });
  page.drawText('NAME', { x: colName, y, font: boldFont, size: headerFontSize, color: black });
  page.drawText('DATE & POSITION', { x: colDatePos, y, font: boldFont, size: headerFontSize, color: black });
  y -= rowHeight + 4;

  // Data rows
  for (const office of offices) {
    ensureSpace(rowHeight + 20);

    // STAFF/EXTERNAL AGENCY
    page.drawText(office.office || '', {
      x: colAgency, y, font, size: 9, color: black,
    });

    // NAME — grade and name, or "None Obtained"
    const nameText = office.aoName || 'None Obtained';
    page.drawText(nameText, {
      x: colName, y, font, size: 9, color: black,
    });

    // DATE & POSITION — combine date and concurrence position
    const datePart = office.date || '';
    const commentText = office.concurrenceCommentText?.trim();
    const noRespDate = office.noResponseDate || datePart;
    let positionPart = '';
    switch (office.concurrence) {
      case 'concur': positionPart = 'Concur'; break;
      case 'concur-comment': positionPart = commentText ? `Concur w/comment ${commentText}` : 'Concur w/comment'; break;
      case 'nonconcur': positionPart = 'Non-concur'; break;
      case 'nonconcur-comment': positionPart = commentText ? `Non-concur w/comment ${commentText}` : 'Non-concur w/comment'; break;
      case 'no-response': {
        const deliveredPart = datePart ? `Delivered ${datePart}` : '';
        const noRespPart = noRespDate ? `No response as of ${noRespDate}` : 'No response';
        positionPart = [deliveredPart, noRespPart].filter(Boolean).join('; ');
        break;
      }
    }
    // Use explicit datePosition field if provided, otherwise build from date + concurrence
    const datePositionText = office.datePosition
      || (office.concurrence === 'no-response'
        ? positionPart
        : [datePart, positionPart].filter(Boolean).join('; '));
    page.drawText(datePositionText, {
      x: colDatePos, y, font, size: 9, color: black,
    });

    y -= rowHeight;
  }

  // === STAFFING COMMENTS (below table) ===
  const staffingComments = offices
    .filter(o => o.staffingComment?.trim())
    .map(o => ({ office: o.office, comment: o.staffingComment!.trim() }));

  if (staffingComments.length > 0) {
    y -= 6;
    ensureSpace(50);

    // Separator line between table and staffing comments
    page.drawLine({
      start: { x: margin, y: y + 2 },
      end: { x: margin + contentWidth, y: y + 2 },
      thickness: 0.5,
      color: black,
    });
    y -= 10;

    page = ensureSpace(14);
    page.drawText('Staffing Comments:', { x: margin, y, font, size: 10, color: black });
    y -= 16;

    for (const sc of staffingComments) {
      const prefix = `${sc.office}: `;
      const prefixWidth = font.widthOfTextAtSize(prefix, 10);
      const commentLines = wrapText(sc.comment, font, 10, contentWidth - prefixWidth);

      // First line: office label + comment text
      page = ensureSpace(14);
      page.drawText(prefix, { x: margin, y, font, size: 10, color: black });
      page.drawText(commentLines[0], { x: margin + prefixWidth, y, font, size: 10, color: black });
      y -= 14;

      // Continuation lines indented to align with first line text
      for (let i = 1; i < commentLines.length; i++) {
        page = ensureSpace(14);
        page.drawText(commentLines[i], { x: margin + prefixWidth, y, font, size: 10, color: black });
        y -= 14;
      }
    }
  }



  return pdfDoc.save();
}
