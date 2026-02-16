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

  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const margin = 72; // 1 inch margins
  const pageWidth = 612;
  const contentWidth = pageWidth - margin * 2;
  let y = 792 - margin;

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.85, 0.85, 0.85);

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

  // === DATE ===
  if (data.date) {
    page.drawText('Date:', { x: margin, y, font: boldFont, size: 11, color: black });
    page.drawText(data.date, { x: margin + 40, y, font, size: 11, color: black });
    y -= 20;
  }

  // === ACTION OFFICER INFO ===
  y -= 5;
  page.drawText('Action Officer:', { x: margin, y, font: boldFont, size: 11, color: black });
  y -= 16;

  const aoInfo = [
    data.actionOfficerName,
    data.actionOfficerRank ? `(${data.actionOfficerRank})` : '',
    data.actionOfficerOfficeCode,
    data.actionOfficerPhone || '',
  ].filter(Boolean).join('  /  ');

  page.drawText(aoInfo, { x: margin + 10, y, font, size: 10, color: black });
  y -= 25;

  // === COORDINATION TABLE ===
  const offices = data.coordinatingOffices || [];

  if (offices.length > 0) {
    page.drawText('COORDINATION', { x: margin, y, font: boldFont, size: 11, color: black });
    y -= 20;

    // Table column definitions
    const colOffice = margin;
    const colConcur = margin + 170;
    const colAO = margin + 280;
    const colDate = margin + 380;
    const colInitials = margin + 440;
    const tableRight = margin + contentWidth;
    const headerHeight = 18;
    const rowHeight = 22;

    // Draw header background
    page.drawRectangle({
      x: colOffice,
      y: y - headerHeight + 4,
      width: contentWidth,
      height: headerHeight,
      color: lightGray,
    });

    // Header text
    const headers = [
      { text: 'Office/Agency', x: colOffice + 4 },
      { text: 'Concur/Nonconcur', x: colConcur + 4 },
      { text: 'Action Officer', x: colAO + 4 },
      { text: 'Date', x: colDate + 4 },
      { text: 'Initials', x: colInitials + 4 },
    ];

    for (const h of headers) {
      page.drawText(h.text, { x: h.x, y: y - 10, font: boldFont, size: 9, color: black });
    }

    // Header bottom border
    y -= headerHeight;
    page.drawLine({
      start: { x: colOffice, y: y + 4 },
      end: { x: tableRight, y: y + 4 },
      thickness: 1,
      color: black,
    });

    // Draw vertical lines for the header
    const colXPositions = [colOffice, colConcur, colAO, colDate, colInitials, tableRight];
    for (const cx of colXPositions) {
      page.drawLine({
        start: { x: cx, y: y + headerHeight + 4 },
        end: { x: cx, y: y + 4 },
        thickness: 0.5,
        color: black,
      });
    }

    // Data rows
    for (const office of offices) {
      ensureSpace(rowHeight + 30);

      // Row border
      page.drawLine({
        start: { x: colOffice, y: y - rowHeight + 8 },
        end: { x: tableRight, y: y - rowHeight + 8 },
        thickness: 0.5,
        color: gray,
      });

      // Vertical lines
      for (const cx of colXPositions) {
        page.drawLine({
          start: { x: cx, y: y + 4 },
          end: { x: cx, y: y - rowHeight + 8 },
          thickness: 0.5,
          color: gray,
        });
      }

      // Office
      page.drawText(office.office || '', {
        x: colOffice + 4, y: y - 8, font, size: 10, color: black,
      });

      // Concurrence - show the selected status, strike through the other
      const concurrenceText = office.concurrence === 'concur'
        ? 'CONCUR'
        : office.concurrence === 'nonconcur'
          ? 'NONCONCUR'
          : '—';
      const concurColor = office.concurrence === 'nonconcur' ? rgb(0.7, 0, 0) : black;
      page.drawText(concurrenceText, {
        x: colConcur + 4, y: y - 8, font: boldFont, size: 10, color: concurColor,
      });

      // Action Officer
      page.drawText(office.aoName || '', {
        x: colAO + 4, y: y - 8, font, size: 10, color: black,
      });

      // Date
      page.drawText(office.date || '', {
        x: colDate + 4, y: y - 8, font, size: 10, color: black,
      });

      // Initials
      page.drawText(office.initials || '', {
        x: colInitials + 4, y: y - 8, font, size: 10, color: black,
      });

      y -= rowHeight;

      // If there are comments, add a sub-row
      if (office.comments) {
        const commentLines = wrapText(`Comments: ${office.comments}`, font, 9, contentWidth - 20);
        for (const line of commentLines) {
          ensureSpace(14);
          page.drawText(line, {
            x: colOffice + 10, y: y - 4, font, size: 9, color: gray,
          });
          y -= 12;
        }
        // Bottom border for comment row
        page.drawLine({
          start: { x: colOffice, y: y + 2 },
          end: { x: tableRight, y: y + 2 },
          thickness: 0.5,
          color: gray,
        });
      }
    }
  }

  // === REMARKS ===
  if (data.remarks) {
    y -= 20;
    ensureSpace(50);
    page.drawText('REMARKS', { x: margin, y, font: boldFont, size: 11, color: black });
    y -= 16;

    const remarkLines = wrapText(data.remarks, font, 10, contentWidth);
    for (const line of remarkLines) {
      ensureSpace(14);
      page.drawText(line, { x: margin, y, font, size: 10, color: black });
      y -= 14;
    }
  }

  return pdfDoc.save();
}
