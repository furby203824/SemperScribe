import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';

interface CoordinatingOffice {
  office: string;
  concurrence: 'concur' | 'nonconcur' | 'pending';
  aoName?: string;
  date?: string;
  initials?: string;
  comments?: string;
}

export interface CoordinationPageData {
  documentType: string;
  subj: string;
  date?: string;
  actionOfficerName: string;
  actionOfficerRank?: string;
  actionOfficerOfficeCode: string;
  actionOfficerPhone?: string;
  coordinatingOffices?: CoordinatingOffice[];
  remarks?: string;
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
  const gray = rgb(0.4, 0.4, 0.4);

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

  // === COORDINATION TABLE ===
  // Per MCO 5216.20B Fig 13-8: 6 columns, table directly after subject
  const offices = data.coordinatingOffices || [];
  const MIN_TABLE_ROWS = 12;
  const totalRows = Math.max(offices.length, MIN_TABLE_ROWS);

  // Table column definitions (6 columns per policy)
  const colOffice = margin;
  const colConcur = margin + 110;
  const colName = margin + 210;
  const colDate = margin + 290;
  const colInitials = margin + 345;
  const colComments = margin + 390;
  const tableRight = margin + contentWidth;
  const headerHeight = 28;
  const rowHeight = 22;

  // Draw header top border
  page.drawLine({
    start: { x: colOffice, y: y + 4 },
    end: { x: tableRight, y: y + 4 },
    thickness: 1,
    color: black,
  });

  // Header text (two-line headers where needed)
  const headerFontSize = 8;
  page.drawText('Office/Staff', { x: colOffice + 3, y: y - 8, font: boldFont, size: headerFontSize, color: black });
  page.drawText('Agency', { x: colOffice + 3, y: y - 18, font: boldFont, size: headerFontSize, color: black });

  page.drawText('Concur/', { x: colConcur + 3, y: y - 8, font: boldFont, size: headerFontSize, color: black });
  page.drawText('Nonconcur', { x: colConcur + 3, y: y - 18, font: boldFont, size: headerFontSize, color: black });

  page.drawText('Name', { x: colName + 3, y: y - 13, font: boldFont, size: headerFontSize, color: black });

  page.drawText('Date', { x: colDate + 3, y: y - 13, font: boldFont, size: headerFontSize, color: black });

  page.drawText('Initials', { x: colInitials + 3, y: y - 13, font: boldFont, size: headerFontSize, color: black });

  page.drawText('Comments/Reasons', { x: colComments + 3, y: y - 8, font: boldFont, size: headerFontSize, color: black });
  page.drawText('for Nonconcurrence', { x: colComments + 3, y: y - 18, font: boldFont, size: headerFontSize, color: black });

  // Header bottom border
  y -= headerHeight;
  page.drawLine({
    start: { x: colOffice, y: y + 4 },
    end: { x: tableRight, y: y + 4 },
    thickness: 1,
    color: black,
  });

  // Draw vertical lines for the header
  const colXPositions = [colOffice, colConcur, colName, colDate, colInitials, colComments, tableRight];
  for (const cx of colXPositions) {
    page.drawLine({
      start: { x: cx, y: y + headerHeight + 4 },
      end: { x: cx, y: y + 4 },
      thickness: 0.5,
      color: black,
    });
  }

  // Data rows + empty rows to fill table
  for (let i = 0; i < totalRows; i++) {
    const office = i < offices.length ? offices[i] : null;

    ensureSpace(rowHeight + 30);

    // Row bottom border
    page.drawLine({
      start: { x: colOffice, y: y - rowHeight + 4 },
      end: { x: tableRight, y: y - rowHeight + 4 },
      thickness: 0.5,
      color: black,
    });

    // Vertical lines for row
    for (const cx of colXPositions) {
      page.drawLine({
        start: { x: cx, y: y + 4 },
        end: { x: cx, y: y - rowHeight + 4 },
        thickness: 0.5,
        color: black,
      });
    }

    if (office) {
      // Office/Staff Agency
      page.drawText(office.office || '', {
        x: colOffice + 3, y: y - 10, font, size: 9, color: black,
      });

      // Concur/Nonconcur
      const concurrenceText = office.concurrence === 'concur'
        ? 'CONCUR'
        : office.concurrence === 'nonconcur'
          ? 'NONCONCUR'
          : '';
      const concurColor = office.concurrence === 'nonconcur' ? rgb(0.7, 0, 0) : black;
      page.drawText(concurrenceText, {
        x: colConcur + 3, y: y - 10, font: boldFont, size: 9, color: concurColor,
      });

      // Name
      page.drawText(office.aoName || '', {
        x: colName + 3, y: y - 10, font, size: 9, color: black,
      });

      // Date
      page.drawText(office.date || '', {
        x: colDate + 3, y: y - 10, font, size: 9, color: black,
      });

      // Initials
      page.drawText(office.initials || '', {
        x: colInitials + 3, y: y - 10, font, size: 9, color: black,
      });

      // Comments/Reasons for Nonconcurrence
      if (office.comments) {
        const commentsWidth = tableRight - colComments - 6;
        const commentLines = wrapText(office.comments, font, 8, commentsWidth);
        for (let ci = 0; ci < commentLines.length && ci < 2; ci++) {
          page.drawText(commentLines[ci], {
            x: colComments + 3, y: y - 10 - (ci * 10), font, size: 8, color: black,
          });
        }
      }
    }

    y -= rowHeight;
  }

  // === ACTION OFFICER (below table, per policy Fig 13-8) ===
  y -= 14;
  ensureSpace(30);

  const aoLabel = 'ACTION OFFICER:';
  page.drawText(aoLabel, { x: margin, y, font: boldFont, size: 10, color: black });
  const aoLabelWidth = boldFont.widthOfTextAtSize(aoLabel, 10);

  // Inline labeled fields: Name ___  Office Code ___  Phone ___
  let aoX = margin + aoLabelWidth + 8;

  page.drawText('Name', { x: aoX, y, font, size: 9, color: gray });
  aoX += font.widthOfTextAtSize('Name', 9) + 4;
  const aoName = data.actionOfficerName || '';
  page.drawText(aoName, { x: aoX, y, font: boldFont, size: 10, color: black });
  aoX += Math.max(boldFont.widthOfTextAtSize(aoName, 10), 60) + 12;

  page.drawText('Office Code', { x: aoX, y, font, size: 9, color: gray });
  aoX += font.widthOfTextAtSize('Office Code', 9) + 4;
  const aoOffice = data.actionOfficerOfficeCode || '';
  page.drawText(aoOffice, { x: aoX, y, font: boldFont, size: 10, color: black });
  aoX += Math.max(boldFont.widthOfTextAtSize(aoOffice, 10), 30) + 12;

  page.drawText('Phone', { x: aoX, y, font, size: 9, color: gray });
  aoX += font.widthOfTextAtSize('Phone', 9) + 4;
  const aoPhone = data.actionOfficerPhone || '';
  page.drawText(aoPhone, { x: aoX, y, font: boldFont, size: 10, color: black });

  y -= 20;

  // === REMARKS (below Action Officer, per policy) ===
  if (data.remarks) {
    y -= 6;
    ensureSpace(50);
    page.drawText('REMARKS:', { x: margin, y, font: boldFont, size: 10, color: black });
    y -= 14;

    const remarkLines = wrapText(data.remarks, font, 10, contentWidth);
    for (const line of remarkLines) {
      ensureSpace(14);
      page.drawText(line, { x: margin, y, font, size: 10, color: black });
      y -= 14;
    }
  }

  return pdfDoc.save();
}
