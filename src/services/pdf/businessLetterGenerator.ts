
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface BusinessLetterData {
  documentType: string;
  date: string;
  recipientAddress: string;
  salutation: string;
  complimentaryClose: string;
  sig: string;
  senderAddress?: string;
  body?: string;
  closing?: string;
  signatureName?: string;
  [key: string]: unknown;
}

export async function createBusinessLetterPdf(data: BusinessLetterData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontSize = 12;
  const margin = 50;
  const lineHeight = fontSize * 1.5;
  let y = height - margin;

  const drawText = (text: string, x: number, yPos: number) => {
    page.drawText(text, {
      x,
      y: yPos,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    return yPos - lineHeight;
  };
  
  const drawMultilineText = (text: string, x: number, yPos: number, maxWidth: number) => {
    const words = text.split(' ');
    let line = '';
    let currentY = yPos;

    for (const word of words) {
        const testLine = line + word + ' ';
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (textWidth > maxWidth) {
            currentY = drawText(line, x, currentY);
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    drawText(line, x, currentY);
    return currentY - lineHeight;
  };


  // 1. Sender's Address (top right)
  const senderAddr = data.senderAddress || '';
  if (senderAddr) {
    const senderAddressWidth = font.widthOfTextAtSize(senderAddr, fontSize);
    drawMultilineText(senderAddr, width - margin - senderAddressWidth, y, 250);
    y -= lineHeight * (senderAddr.split('\n').length + 1);
  }

  // 2. Date
  y = drawText(data.date, margin, y);
  y -= lineHeight;

  // 3. Recipient's Address (left)
  y = drawMultilineText(data.recipientAddress, margin, y, 300);
  y -= lineHeight;

  // 4. Salutation
  y = drawText(data.salutation, margin, y);
  y -= lineHeight;

  // 5. Body
  if (data.body) {
    y = drawMultilineText(data.body, margin, y, width - margin * 2);
    y -= lineHeight;
  }

  // 6. Closing
  const closingText = data.closing || data.complimentaryClose || '';
  y = drawText(closingText, margin, y);
  y -= lineHeight * 3; // Space for signature

  // 7. Signature Name
  const sigName = data.signatureName || data.sig || '';
  drawText(sigName, margin, y);

  return pdfDoc.save();
}
