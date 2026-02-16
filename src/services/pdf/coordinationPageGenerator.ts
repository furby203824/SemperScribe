import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface CoordinationPageData {
  documentType: string;
  subject: string;
  summary: string;
  routing?: Array<{ name: string; department: string }>;
  [key: string]: unknown;
}

export async function createCoordinationPagePdf(data: CoordinationPageData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = height - margin;

    // Title
    page.drawText('Coordination Page', {
        x: margin,
        y,
        font: boldFont,
        size: 24,
        color: rgb(0, 0, 0),
    });
    y -= 40;

    // Subject
    page.drawText('Subject:', {
        x: margin,
        y,
        font: boldFont,
        size: 14,
    });
    y -= 20;
    page.drawText(data.subject, {
        x: margin,
        y,
        font,
        size: 12,
    });
    y -= 40;

    // Summary
    page.drawText('Summary:', {
        x: margin,
        y,
        font: boldFont,
        size: 14,
    });
    y -= 20;
    
    const summaryLines = data.summary.split('\n');
    for (const line of summaryLines) {
        page.drawText(line, {
            x: margin,
            y,
            font,
            size: 12,
        });
        y -= 15;
    }
    y -= 25;

    // Routing Table
    page.drawText('Routing:', {
        x: margin,
        y,
        font: boldFont,
        size: 14,
    });
    y -= 25;

    const tableTop = y;
    const tableLeft = margin;
    const tableRight = width - margin;
    const rowHeight = 20;
    const nameColumnWidth = 250;

    // Table Header
    page.drawText('Name', { x: tableLeft + 5, y, font: boldFont, size: 12 });
    page.drawText('Department', { x: tableLeft + nameColumnWidth + 5, y, font: boldFont, size: 12 });
    y -= rowHeight;
    page.drawLine({
        start: { x: tableLeft, y: y + 5 },
        end: { x: tableRight, y: y + 5 },
        thickness: 1,
        color: rgb(0, 0, 0),
    });

    // Table Rows
    for (const route of (data.routing || [])) {
        if (y < margin + rowHeight) {
            // Add a new page if there is no more space
            const newPage = pdfDoc.addPage();
            y = newPage.getSize().height - margin;
        }
        page.drawText(route.name, { x: tableLeft + 5, y, font, size: 12 });
        page.drawText(route.department, { x: tableLeft + nameColumnWidth + 5, y, font, size: 12 });
        y -= rowHeight;
        page.drawLine({
            start: { x: tableLeft, y: y + 5 },
            end: { x: tableRight, y: y + 5 },
            thickness: 0.5,
            color: rgb(0.5, 0.5, 0.5),
        });
    }

    return pdfDoc.save();
}
