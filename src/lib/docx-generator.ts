import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  TabStopType,
  AlignmentType,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  UnderlineType,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  VerticalAlign
} from "docx";
import { FormData, ParagraphData } from "@/types";
import { getDoDSealBuffer } from "./dod-seal";
import { 
  splitSubject, 
  formatCancellationDate, 
  getFromToSpacing, 
  getViaSpacing, 
  getSubjSpacing, 
  getRefSpacing, 
  getEnclSpacing, 
  getCopyToSpacing 
} from "./naval-format-utils";
import { createFormattedParagraph, generateCitation } from "./paragraph-formatter";
import { parseAndFormatDate, formatBusinessDate } from "./date-utils";
import { DISTRIBUTION_STATEMENTS } from "@/lib/constants";
import { DOC_SETTINGS, TAB_STOPS, INDENTS } from "./doc-settings";

// Constants for layout (in twips)
// 1 inch = 1440 twips
const MARGIN_TOP = 720; // 0.5" top margin per reference app
const MARGIN_BOTTOM = 1440;
const MARGIN_LEFT = 1440;
const MARGIN_RIGHT = 1440;

const FONT_SIZE_BODY = 24; // 12pt (docx uses half-points)

// Helper to get font name
const getFont = (font: 'times' | 'courier') => {
  return font === 'courier' ? 'Courier New' : 'Times New Roman';
};

// Get header color based on user selection (black or blue only)
const getHeaderColor = (colorName?: string) => {
  return colorName === 'blue' ? "000080" : "000000"; // Navy blue (#000080 per reference) or black
};

// Helper to create empty lines - Matches legacy app behavior
const createEmptyLine = (font?: string, size?: number) => {
  return new Paragraph({ text: "" });
};

export async function generateDocxBlob(
  formData: FormData,
  vias: string[],
  references: string[],
  enclosures: string[],
  copyTos: string[],
  paragraphs: ParagraphData[],
  distList: string[] = []
): Promise<Blob> {
  const font = getFont(formData.bodyFont);
  const headerColor = getHeaderColor(formData.accentColor);
  const sealBuffer = await getDoDSealBuffer(formData.headerType === 'DON' ? 'navy' : 'marine-corps');
  const isDirective = formData.documentType === 'mco' || formData.documentType === 'bulletin';
  const isStaffingPaper = ['position-paper', 'information-paper'].includes(formData.documentType);
  const isPositionPaper = formData.documentType === 'position-paper';
  const isFromToMemo = formData.documentType === 'from-to-memo';
  const isMfr = formData.documentType === 'mfr';
  const isMoaOrMou = formData.documentType === 'moa' || formData.documentType === 'mou';
  const isBusinessLetter = formData.documentType === 'business-letter';
  const isExecCorr = formData.documentType === 'executive-correspondence';
  const isExecLetter = isExecCorr && (formData.execFormat === 'letter' || !formData.execFormat);
  const isCivilianStyle = isBusinessLetter || isExecLetter;

  const moaData = formData.moaData || {
    activityA: '',
    activityB: '',
    seniorSigner: { name: '', title: '', activity: '' },
    juniorSigner: { name: '', title: '', activity: '' }
  };

  // Layout settings based on document type
  // Letters use 0.5" tabs/indent, Directives use 1.0"
  const tabPosition = isDirective ? 1440 : TAB_STOPS.first; 
  
  // Indentation logic
  // For Directives: Block style (1440 left, 1440 hanging to align wrapped text)
  // For Letters: No indent, just tabs (Legacy behavior)
  const addressIndent = isDirective 
    ? { left: 1440, hanging: 1440 }
    : undefined;
    
  const subjectIndent = isDirective
    ? { left: 1440, hanging: 1440 }
    : undefined;

  const addressSpacing = 0; // Single spacing for address block
  const signatureIndent = INDENTS.signature; // 3.25" from left

  // --- Header Section (Letterhead) ---
  // Note: Seal is placed in the Section Header (headers.first), text is in the Body
  const letterheadParagraphs: Paragraph[] = [];

  if (!isFromToMemo && !isMfr && !isStaffingPaper) {
      // Department Header Text
      const headerText = formData.headerType === 'USMC' 
        ? 'UNITED STATES MARINE CORPS' 
        : 'DEPARTMENT OF THE NAVY';
        
      letterheadParagraphs.push(new Paragraph({
        children: [new TextRun({ text: headerText, font: 'Arial', bold: true, size: 20, color: headerColor })], // Size 20 (10pt), Arial per reference
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
      }));

      // Address Lines
      [formData.line1, formData.line2, formData.line3].forEach(line => {
        if (line) {
          letterheadParagraphs.push(new Paragraph({
            children: [new TextRun({ text: line, font: 'Arial', size: 16, color: headerColor })], // Size 16 (8pt), Arial per reference
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
          }));
        }
      });

      letterheadParagraphs.push(createEmptyLine(font));
  }

  // --- SSIC Block ---
  const ssicParagraphs: (Paragraph | Table)[] = [];
  
  const formattedDate = isCivilianStyle
    ? formatBusinessDate(formData.date || '')
    : parseAndFormatDate(formData.date || '');

  if (isFromToMemo || isMfr) {
       // From-To Memo & MFR: Date Flush Right, Top of page (simulated 1 inch margin)
       ssicParagraphs.push(new Paragraph({
          children: [new TextRun({ text: formattedDate || 'Date Placeholder', font, size: FONT_SIZE_BODY })],
          alignment: AlignmentType.RIGHT,
          spacing: { before: 1440, after: 0 } // 1 inch top spacing
       }));
  } else if (!isMoaOrMou && !isStaffingPaper) {
      const ssicBlock = [];
      if (formData.documentType === 'bulletin' && formData.cancellationDate) {
        const cancPrefix = formData.cancellationType === 'contingent' ? 'Canc frp:' : 'Canc:';
        ssicBlock.push(`${cancPrefix} ${formatCancellationDate(formData.cancellationDate)}`);
      }
      
      if (formData.documentType === 'mco' && formData.orderPrefix) {
        ssicBlock.push(`${formData.orderPrefix} ${formData.ssic}`);
      } else {
        if (formData.ssic) ssicBlock.push(formData.ssic);
      }

      if (formData.originatorCode) ssicBlock.push(formData.originatorCode);
      ssicBlock.push(formattedDate || 'Date Placeholder');

      // SSIC Block: right-aligned table so the longest line's right edge
      // touches the right margin, with all lines left-aligned within the block.
      const ssicTable = new Table({
          width: { size: 0, type: WidthType.AUTO },
          alignment: AlignmentType.RIGHT,
          borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
          },
          rows: [
              new TableRow({
                  children: [
                      new TableCell({
                          width: { size: 0, type: WidthType.AUTO },
                          borders: {
                              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                              left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                          },
                          children: ssicBlock.map(line => new Paragraph({
                              children: [new TextRun({ text: line, font, size: FONT_SIZE_BODY })],
                              alignment: AlignmentType.LEFT,
                              spacing: { after: 0 }
                          })),
                      }),
                  ],
              }),
          ],
      });
      ssicParagraphs.push(ssicTable);
  }

  // --- MOA/MOU Header ---
  const moaHeaderParagraphs: (Paragraph | Table)[] = [];
  if (isMoaOrMou) {
    // Side-by-Side Activity Header
    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "auto" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
        },
        rows: [
            new TableRow({
                children: [
                    // Left Column (Activity B / Junior)
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                            new Paragraph({ children: [new TextRun({ text: (moaData.juniorSigner?.activitySymbol || moaData.activityB || '').toUpperCase(), font, size: FONT_SIZE_BODY })], spacing: { after: 0 } }),
                            ...(moaData.activityBHeader?.ssic ? [new Paragraph({ children: [new TextRun({ text: moaData.activityBHeader.ssic, font, size: FONT_SIZE_BODY })], spacing: { after: 0 } })] : []),
                            ...(moaData.activityBHeader?.serial ? [new Paragraph({ children: [new TextRun({ text: moaData.activityBHeader.serial, font, size: FONT_SIZE_BODY })], spacing: { after: 0 } })] : []),
                            ...(moaData.activityBHeader?.date ? [new Paragraph({ children: [new TextRun({ text: moaData.activityBHeader.date, font, size: FONT_SIZE_BODY })], spacing: { after: 0 } })] : []),
                        ],
                    }),
                    // Right Column (Activity A / Senior) - Nested table for Flush Right alignment
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                            new Table({
                                width: { size: 0, type: WidthType.AUTO },
                                alignment: AlignmentType.RIGHT,
                                borders: {
                                    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                    insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                },
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                width: { size: 0, type: WidthType.AUTO },
                                                borders: {
                                                    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                                    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                                    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                                    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                                },
                                                children: [
                                                    new Paragraph({ children: [new TextRun({ text: (moaData.seniorSigner?.activitySymbol || moaData.activityA || '').toUpperCase(), font, size: FONT_SIZE_BODY })], spacing: { after: 0 } }),
                                                    ...(moaData.activityAHeader?.ssic ? [new Paragraph({ children: [new TextRun({ text: moaData.activityAHeader.ssic, font, size: FONT_SIZE_BODY })], spacing: { after: 0 } })] : []),
                                                    ...(moaData.activityAHeader?.serial ? [new Paragraph({ children: [new TextRun({ text: moaData.activityAHeader.serial, font, size: FONT_SIZE_BODY })], spacing: { after: 0 } })] : []),
                                                    ...(moaData.activityAHeader?.date ? [new Paragraph({ children: [new TextRun({ text: moaData.activityAHeader.date, font, size: FONT_SIZE_BODY })], spacing: { after: 0 } })] : []),
                                                ],
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
    
    moaHeaderParagraphs.push(headerTable);
    moaHeaderParagraphs.push(createEmptyLine(font));

    moaHeaderParagraphs.push(new Paragraph({
      children: [new TextRun({ text: formData.documentType === 'moa' ? 'MEMORANDUM OF AGREEMENT' : 'MEMORANDUM OF UNDERSTANDING', font, size: FONT_SIZE_BODY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120, before: 0 }
    }));
    moaHeaderParagraphs.push(new Paragraph({
      children: [new TextRun({ text: 'BETWEEN', font, size: FONT_SIZE_BODY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 }
    }));
    moaHeaderParagraphs.push(new Paragraph({
      children: [new TextRun({ text: (moaData.activityA || '').toUpperCase(), font, size: FONT_SIZE_BODY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 }
    }));
    moaHeaderParagraphs.push(new Paragraph({
      children: [new TextRun({ text: 'AND', font, size: FONT_SIZE_BODY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 }
    }));
    moaHeaderParagraphs.push(new Paragraph({
      children: [new TextRun({ text: (moaData.activityB || '').toUpperCase(), font, size: FONT_SIZE_BODY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 }
    }));
    
    // Add Subj line using standard formatting
    const subjLabel = getSubjSpacing(formData.bodyFont);
    const subjLines = splitSubject((formData.subj || '').toUpperCase(), 57);
    
    subjLines.forEach((line, index) => {
      let children: TextRun[] = [];
      if (index === 0) {
          children = [
              new TextRun({ text: subjLabel, font, size: FONT_SIZE_BODY }),
              new TextRun({ text: line, font, size: FONT_SIZE_BODY }),
          ];
      } else {
          if (formData.bodyFont === 'courier') {
              children = [
                  new TextRun({ text: '       ' + line, font, size: FONT_SIZE_BODY }),
              ];
          } else {
              children = [
                  new TextRun({ text: "\t" + line, font, size: FONT_SIZE_BODY }),
              ];
          }
      }

      moaHeaderParagraphs.push(new Paragraph({
        children,
        tabStops: [{ type: TabStopType.LEFT, position: tabPosition }],
        indent: isDirective ? subjectIndent : undefined,
        spacing: { before: index === 0 ? 240 : 0 } // Add space before first line
      }));
    });
    
    // Empty line after subject - same as standard letter
    moaHeaderParagraphs.push(createEmptyLine(font));
  }

  // --- Staffing Paper Header ---
  const staffingHeaderParagraphs: Paragraph[] = [];
  if (isStaffingPaper) {
      const title = formData.documentType.split('-').map(w => w.toUpperCase()).join(' ');
      const isPositionPaper = formData.documentType === 'position-paper';
      
      staffingHeaderParagraphs.push(new Paragraph({
          children: [new TextRun({ 
              text: title, 
              font, 
              bold: !isPositionPaper,
              size: FONT_SIZE_BODY,
              underline: { type: UnderlineType.SINGLE }
          })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 120 }
      }));
      
      // Removed "ON" paragraph to match MCO 5216.20A and PDF preview
      
      // Removed Duplicate Bold Subject Line
      // Standard Subject is handled below via logic or manually added if needed.
      // However, for staffing papers, we usually want "Subj: ..." (regular).
      // If we remove the bold one, we should ensure the regular one is present.
      // The code below adds "Subj:" for !isStaffingPaper. 
      // We need to add a non-bold "Subj:" for Staffing Paper if it's not handled elsewhere.
      
      // If it's a Position Paper, we typically don't center "Subj:".
      // Position Paper Format:
      // TITLE (Underlined)
      // Subj: TITLE (Regular, Left Aligned or Block)
      // Wait, MCO 5216.20B Figure 13-3 shows "Subj:" left aligned (tabbed) if it's part of the standard block?
      // Actually, looking at the user image, "Subj:" is left-aligned.
      // My previous code was CENTER aligning it.
      
      if (isPositionPaper) {
         staffingHeaderParagraphs.push(new Paragraph({
            children: [
                new TextRun({ text: "Subj: ", font, size: FONT_SIZE_BODY }),
                new TextRun({ text: (formData.subj || '').toUpperCase(), font, size: FONT_SIZE_BODY })
            ],
            // Use standard subject indentation (usually hanging or tabbed)
            // But for now, simple left alignment to match "1. Purpose"
            indent: { left: 0 }, 
            alignment: AlignmentType.LEFT,
            spacing: { after: 480 } 
         }));
      } else {
         // Information Paper Subject (Centered)
         staffingHeaderParagraphs.push(new Paragraph({
             children: [new TextRun({ 
                text: `Subj: ${formData.subj ? formData.subj.toUpperCase() : ''}`, 
                font, 
                size: FONT_SIZE_BODY,
                bold: false 
             })],
             alignment: AlignmentType.CENTER,
             spacing: { after: 480 } 
         }));
      }
  }

  // --- Business Letter Header (Inside Address, Salutation) ---
  const businessHeaderParagraphs: Paragraph[] = [];
  if (isBusinessLetter) {
      // 1. Inside Address (Flush Left, after SSIC/Date)
      // Spacing for Window Envelope (approx 2" from top vs 1" standard)
      // We add extra spacing before the address block if window envelope.
      if (formData.isWindowEnvelope) {
          businessHeaderParagraphs.push(new Paragraph({
              text: "",
              spacing: { before: 1600, after: 0 } // ~1.1 inches extra spacing
          }));
      } else {
           // Standard spacing
           businessHeaderParagraphs.push(createEmptyLine(font)); 
      }
      
      if (formData.recipientName) {
          businessHeaderParagraphs.push(new Paragraph({
              children: [new TextRun({ text: formData.recipientName, font, size: FONT_SIZE_BODY })],
              alignment: AlignmentType.LEFT,
              spacing: { after: 0 }
          }));
      }

      if (formData.recipientTitle) {
          businessHeaderParagraphs.push(new Paragraph({
              children: [new TextRun({ text: formData.recipientTitle, font, size: FONT_SIZE_BODY })],
              alignment: AlignmentType.LEFT,
              spacing: { after: 0 }
          }));
      }

      if (formData.businessName) {
          businessHeaderParagraphs.push(new Paragraph({
              children: [new TextRun({ text: formData.businessName, font, size: FONT_SIZE_BODY })],
              alignment: AlignmentType.LEFT,
              spacing: { after: 0 }
          }));
      }
      
      if (formData.recipientAddress) {
          const addressLines = formData.recipientAddress.split('\n');
          addressLines.forEach((line: string) => {
              businessHeaderParagraphs.push(new Paragraph({
                  children: [new TextRun({ text: line, font, size: FONT_SIZE_BODY })],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 0 }
          }));
          });
      }

      // Attention Line
      if (formData.attentionLine) {
           businessHeaderParagraphs.push(createEmptyLine(font));
           businessHeaderParagraphs.push(new Paragraph({
               children: [new TextRun({ text: `Attention: ${formData.attentionLine}`, font, size: FONT_SIZE_BODY })],
               alignment: AlignmentType.LEFT,
               spacing: { after: 0 }
           }));
      }
      
      // 2. Salutation (Flush Left, after Inside Address)
      // Add space after Address
      businessHeaderParagraphs.push(createEmptyLine(font));
      
      if (formData.salutation) {
          businessHeaderParagraphs.push(new Paragraph({
              children: [new TextRun({ text: formData.salutation, font, size: FONT_SIZE_BODY })],
              alignment: AlignmentType.LEFT,
              spacing: { after: 0 }
          }));
      }

      // 3. Subject Line (Optional for Business Letters, appears after Salutation)
      if (formData.subj) {
          businessHeaderParagraphs.push(createEmptyLine(font));
          // Use smaller indent/tab for Business Letters (approx 0.86 inch / 1240 twips)
          const subjIndent = 1240; 
          businessHeaderParagraphs.push(new Paragraph({
              children: [
                  new TextRun({ text: "SUBJECT:\t", font, size: FONT_SIZE_BODY }),
                  new TextRun({ text: formData.subj.toUpperCase(), font, size: FONT_SIZE_BODY })
              ],
              alignment: AlignmentType.LEFT,
              tabStops: [
                  { type: TabStopType.LEFT, position: subjIndent } 
              ],
              indent: {
                  left: subjIndent,   
                  hanging: subjIndent 
              },
              spacing: { after: 0 }
          }));
      }
      
      // Add space after Salutation/Subject before body
      businessHeaderParagraphs.push(createEmptyLine(font));
  }

  // --- Executive Letter Header (Inside Address, Salutation) ---
  if (isExecLetter) {
      businessHeaderParagraphs.push(createEmptyLine(font));

      if (formData.recipientName) {
          businessHeaderParagraphs.push(new Paragraph({
              children: [new TextRun({ text: formData.recipientName, font, size: FONT_SIZE_BODY })],
              alignment: AlignmentType.LEFT,
              spacing: { after: 0 }
          }));
      }
      if (formData.recipientTitle) {
          businessHeaderParagraphs.push(new Paragraph({
              children: [new TextRun({ text: formData.recipientTitle, font, size: FONT_SIZE_BODY })],
              alignment: AlignmentType.LEFT,
              spacing: { after: 0 }
          }));
      }
      if (formData.organizationName) {
          businessHeaderParagraphs.push(new Paragraph({
              children: [new TextRun({ text: formData.organizationName, font, size: FONT_SIZE_BODY })],
              alignment: AlignmentType.LEFT,
              spacing: { after: 0 }
          }));
      }
      if (formData.recipientAddress) {
          formData.recipientAddress.split('\n').forEach((line: string) => {
              businessHeaderParagraphs.push(new Paragraph({
                  children: [new TextRun({ text: line, font, size: FONT_SIZE_BODY })],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 0 }
              }));
          });
      }
      businessHeaderParagraphs.push(createEmptyLine(font));
      if (formData.salutation) {
          businessHeaderParagraphs.push(new Paragraph({
              children: [new TextRun({ text: formData.salutation, font, size: FONT_SIZE_BODY })],
              alignment: AlignmentType.LEFT,
              spacing: { after: 0 }
          }));
      }
      if (formData.subj) {
          businessHeaderParagraphs.push(createEmptyLine(font));
          businessHeaderParagraphs.push(new Paragraph({
              children: [
                  new TextRun({ text: "SUBJECT:\t", font, size: FONT_SIZE_BODY }),
                  new TextRun({ text: formData.subj, font, size: FONT_SIZE_BODY })
              ],
              alignment: AlignmentType.LEFT,
              spacing: { after: 0 }
          }));
      }
      businessHeaderParagraphs.push(createEmptyLine(font));
  }

  // --- Endorsement Identification Line (between date and From) ---
  const endorsementParagraphs: Paragraph[] = [];
  if (formData.documentType === 'endorsement' && formData.endorsementLevel && formData.basicLetterReference) {
    const endorsementText = `${formData.endorsementLevel} ENDORSEMENT on ${formData.basicLetterReference}`;
    endorsementParagraphs.push(new Paragraph({
      children: [new TextRun({ text: endorsementText, font, size: FONT_SIZE_BODY })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    }));
    // Add hard return/space after endorsement line before "From:"
    endorsementParagraphs.push(createEmptyLine(font));
  }

  // --- Directive Title Line (between date and From for MCO/Bulletin) ---
  const directiveTitleParagraphs: Paragraph[] = [];
  if (isDirective && formData.directiveTitle) {
    directiveTitleParagraphs.push(new Paragraph({
      children: [new TextRun({
        text: formData.directiveTitle,
        font,
        size: FONT_SIZE_BODY,
        underline: { type: UnderlineType.SINGLE }
      })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 240 }
    }));
  }

  // --- From/To/Via ---
  const addressParagraphs: Paragraph[] = [];
  
  if (formData.documentType === 'mfr') {
    // MFR: No From/To/Via, just the title
    addressParagraphs.push(createEmptyLine(font)); // One blank line so Title is 2 lines below Date
    addressParagraphs.push(new Paragraph({
      children: [new TextRun({ 
        text: "MEMORANDUM FOR THE RECORD", 
        font, 
        size: FONT_SIZE_BODY
      })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 240 } // Double space after title
    }));
  } else if (!isMoaOrMou && !isStaffingPaper && !isCivilianStyle) {
    // Standard Letter / Directive: From/To/Via

    // Letterhead Memorandum Title
     if (formData.documentType === 'letterhead-memo') {
        addressParagraphs.push(new Paragraph({
           children: [new TextRun({ 
             text: "MEMORANDUM", 
             font, 
             size: FONT_SIZE_BODY
           })],
           alignment: AlignmentType.LEFT,
           spacing: { after: 240 } // Double space
        }));
     }
    
    // From-To Memorandum Title
    if (formData.documentType === 'from-to-memo') {
      addressParagraphs.push(createEmptyLine(font));
      addressParagraphs.push(createEmptyLine(font));
      addressParagraphs.push(new Paragraph({
        children: [new TextRun({ 
          text: "MEMORANDUM", 
          font, 
          size: FONT_SIZE_BODY
        })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 240 }
      }));
    }

    // Standard Letter / Directive: From/To/Via
    
    // From
    const fromLabel = getFromToSpacing('From', formData.bodyFont);
    addressParagraphs.push(new Paragraph({
      children: [
        new TextRun({ text: fromLabel, font, size: FONT_SIZE_BODY }),
        new TextRun({ text: formData.from || "Commanding Officer", font, size: FONT_SIZE_BODY }),
      ],
      tabStops: [{ type: TabStopType.LEFT, position: tabPosition }],
      indent: isDirective ? addressIndent : undefined,
      spacing: { after: addressSpacing },
    }));

    // To & Via Logic (Handles Multiple-Address and From-To Memo vs Standard)
    const hasMultipleTo = formData.documentType === 'multiple-address' || formData.documentType === 'from-to-memo';
    const isToDistribution = hasMultipleTo && !!formData.distribution?.toDistribution;
    if (hasMultipleTo) {
       const recipients = formData.distribution?.recipients || (formData.to ? [formData.to] : ["Addressee"]);
       const recipientsWithContent = recipients.filter((r: string) => r && r.trim());

       if (recipientsWithContent.length === 0) recipientsWithContent.push("Addressee");

       if (isToDistribution) {
          // "To Distribution" toggle ON: To line says "Distribution"
          const toLabel = getFromToSpacing('To', formData.bodyFont as 'times' | 'courier');
          addressParagraphs.push(new Paragraph({
             children: [
                new TextRun({ text: toLabel, font, size: FONT_SIZE_BODY }),
                new TextRun({ text: "Distribution", font, size: FONT_SIZE_BODY }),
             ],
             tabStops: [{ type: TabStopType.LEFT, position: tabPosition }],
             indent: isDirective ? addressIndent : undefined,
             spacing: { after: addressSpacing },
          }));
       } else {
          // Toggle OFF: list recipients directly under To
          recipientsWithContent.forEach((recipient: string, index: number) => {
              let children: TextRun[] = [];

              if (index === 0) {
                 const toLabel = getFromToSpacing('To', formData.bodyFont as 'times' | 'courier');
                 children = [
                    new TextRun({ text: toLabel, font, size: FONT_SIZE_BODY }),
                    new TextRun({ text: recipient, font, size: FONT_SIZE_BODY }),
                 ];
              } else {
                 // Subsequent lines align with the first recipient
                 // For Courier, align with spaces. For Times, use tab.
                 const prefix = formData.bodyFont === 'courier' ? '       ' : '\t';
                 children = [
                    new TextRun({ text: prefix + recipient, font, size: FONT_SIZE_BODY }),
                 ];
              }

              addressParagraphs.push(new Paragraph({
                  children,
                  tabStops: [{ type: TabStopType.LEFT, position: tabPosition }],
                  indent: isDirective ? addressIndent : undefined,
                  spacing: { after: index === recipientsWithContent.length - 1 ? addressSpacing : 0 },
              }));
          });
       }

    } else {
        // Standard To
        const toLabel = getFromToSpacing('To', formData.bodyFont);
        addressParagraphs.push(new Paragraph({
          children: [
            new TextRun({ text: toLabel, font, size: FONT_SIZE_BODY }),
            new TextRun({ text: formData.to || "Addressee", font, size: FONT_SIZE_BODY }),
          ],
          tabStops: [{ type: TabStopType.LEFT, position: tabPosition }],
          indent: isDirective ? addressIndent : undefined,
          spacing: { after: addressSpacing },
        }));
    }

    // Via
    {
        const viasWithContent = vias.filter(v => v.trim());
        if (viasWithContent.length > 0) {
          viasWithContent.forEach((via, index) => {
              const viaLabel = getViaSpacing(index, formData.bodyFont);
              const children = [
                  new TextRun({ text: viaLabel, font, size: FONT_SIZE_BODY }),
                  new TextRun({ text: via, font, size: FONT_SIZE_BODY }),
              ];

              let tabs: any[] = [];
              if (formData.bodyFont === 'courier') {
                   // Courier doesn't use tabs for alignment in the same way, but let's keep it consistent with legacy if needed
              } else {
                   // Times
                   if (viasWithContent.length > 1) {
                       tabs = [
                          { type: TabStopType.LEFT, position: 720 },
                          { type: TabStopType.LEFT, position: 1046 }
                       ];
                   } else {
                       tabs = [{ type: TabStopType.LEFT, position: 720 }];
                   }
              }

              addressParagraphs.push(new Paragraph({
                  children,
                  tabStops: tabs.length > 0 ? tabs : [{ type: TabStopType.LEFT, position: tabPosition }],
                  indent: isDirective ? addressIndent : undefined,
                  spacing: { after: addressSpacing },
              }));
          });
        }
    }
  }

  // --- Subject ---
  if (!isMoaOrMou && !isStaffingPaper && !isCivilianStyle) {
    addressParagraphs.push(createEmptyLine(font));
    
    const subjLabel = getSubjSpacing(formData.bodyFont);
    const subjLines = splitSubject((formData.subj || '').toUpperCase(), 57);
    
    subjLines.forEach((line, index) => {
      let children: TextRun[] = [];
      if (index === 0) {
          children = [
              new TextRun({ text: subjLabel, font, size: FONT_SIZE_BODY }),
              new TextRun({ text: line, font, size: FONT_SIZE_BODY }),
          ];
      } else {
          if (formData.bodyFont === 'courier') {
              children = [
                  new TextRun({ text: '       ' + line, font, size: FONT_SIZE_BODY }),
              ];
          } else {
              children = [
                  new TextRun({ text: "\t" + line, font, size: FONT_SIZE_BODY }),
              ];
          }
      }

      addressParagraphs.push(new Paragraph({
        children,
        tabStops: [{ type: TabStopType.LEFT, position: tabPosition }],
        indent: isDirective ? subjectIndent : undefined,
      }));
    });

    addressParagraphs.push(createEmptyLine(font));
  }

  // --- References ---
  const refParagraphs: Paragraph[] = [];
  const refs = references.filter(r => r.trim());
  if (refs.length > 0 && !isStaffingPaper) {
    const startCharCode = (formData.startingReferenceLevel || 'a').charCodeAt(0);
    
    refs.forEach((ref, index) => {
      const letter = String.fromCharCode(startCharCode + index);
      const refLabel = getRefSpacing(letter, index, formData.bodyFont);
      
      let refIndent;
      if (isDirective) {
          refIndent = addressIndent;
      } else if (formData.bodyFont === 'courier') {
          refIndent = { left: 1584, hanging: 1584 };
      } else {
          refIndent = { left: 1080, hanging: 1080 };
      }

      refParagraphs.push(new Paragraph({
        children: [
          new TextRun({ text: refLabel, font, size: FONT_SIZE_BODY }),
          new TextRun({ text: ref, font, size: FONT_SIZE_BODY }),
        ],
        tabStops: [{ type: TabStopType.LEFT, position: tabPosition }],
        indent: refIndent,
      }));
    });
    refParagraphs.push(createEmptyLine(font));
  }

  // --- Enclosures ---
  const enclParagraphs: Paragraph[] = [];
  const encls = enclosures.filter(e => e.trim());
  if (encls.length > 0 && !isStaffingPaper) {
    if (isCivilianStyle) {
        // Business/Executive Letter Enclosures (Flush Left)
        const label = encls.length > 1 ? "Enclosures" : "Enclosure";
        enclParagraphs.push(new Paragraph({
            children: [new TextRun({ text: label, font, size: FONT_SIZE_BODY })],
            alignment: AlignmentType.LEFT,
            spacing: { after: 0 }
        }));
        
        encls.forEach(encl => {
            enclParagraphs.push(new Paragraph({
                children: [new TextRun({ text: encl, font, size: FONT_SIZE_BODY })],
                alignment: AlignmentType.LEFT,
                spacing: { after: 0 }
            }));
        });
        enclParagraphs.push(createEmptyLine(font));
    } else {
        // Standard Naval Enclosures
        const startNum = parseInt(formData.startingEnclosureNumber || '1', 10);
        
        encls.forEach((encl, index) => {
            const num = startNum + index;
            const enclLabel = getEnclSpacing(num, index, formData.bodyFont);
            
            let enclIndent;
            if (isDirective) {
                enclIndent = addressIndent;
            } else if (formData.bodyFont === 'courier') {
                enclIndent = { left: 1584, hanging: 1584 };
            } else {
                enclIndent = { left: 1080, hanging: 1080 };
            }

            enclParagraphs.push(new Paragraph({
                children: [
                new TextRun({ text: enclLabel, font, size: FONT_SIZE_BODY }),
                new TextRun({ text: encl, font, size: FONT_SIZE_BODY }),
                ],
                tabStops: [{ type: TabStopType.LEFT, position: tabPosition }],
                indent: enclIndent,
            }));
        });
        enclParagraphs.push(createEmptyLine(font));
    }
  }

  // --- Body Paragraphs ---
  const bodyParagraphs: (Paragraph | Table)[] = [];
  const paragraphsWithContent = paragraphs.filter(p => p.content.trim() || p.title);

  paragraphsWithContent.forEach((p, index) => {
    // Custom handling for Position Paper Multiple Recs - Paragraph 4
    if (isPositionPaper && 
        formData.decisionMode === 'MULTIPLE_RECS' && 
        (index === 3 || (p.title && p.title.toLowerCase().includes('recommendation')))) {

        // 1. Header: 4. Recommendation.
        const { citation } = generateCitation(p, index, paragraphsWithContent);
        bodyParagraphs.push(new Paragraph({
             children: [
                 new TextRun({ text: citation + "\t", font, size: FONT_SIZE_BODY }),
                 new TextRun({ text: (p.title || 'Recommendation') + ".", font, size: FONT_SIZE_BODY })
             ],
             tabStops: [{ type: TabStopType.LEFT, position: 720 }],
             spacing: { after: 120 }
        }));

        // 2. Iterate Recommendation Items
        formData.decisionGrid?.recommendationItems?.forEach((item: { id: string; text: string }, itemIdx: number) => {
             // a. Text
             const itemLetter = String.fromCharCode(97 + itemIdx);
             bodyParagraphs.push(new Paragraph({
                 children: [
                     new TextRun({ text: itemLetter + ".\t", font, size: FONT_SIZE_BODY }),
                     new TextRun({ text: item.text, font, size: FONT_SIZE_BODY })
                 ],
                 indent: { left: 1080, hanging: 360 }, 
                 tabStops: [{ type: TabStopType.LEFT, position: 1440 }],
                 spacing: { after: 120 }
             }));

             // 3. Grid Table (Embedded)
             const tableRows: TableRow[] = [];
             
             // Recommenders
             formData.decisionGrid?.recommenders.forEach((rec: { id: string; role: string; options: string[] }) => {
                 tableRows.push(new TableRow({
                     children: [
                         new TableCell({
                             children: [new Paragraph({ children: [new TextRun({ text: rec.role + ":", font, size: FONT_SIZE_BODY })] })],
                             width: { size: 30, type: WidthType.PERCENTAGE },
                             borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                         }),
                         new TableCell({
                             children: [new Paragraph({ children: [new TextRun({ text: "[ ] Approve    [ ] Disapprove", font, size: FONT_SIZE_BODY })] })],
                             width: { size: 70, type: WidthType.PERCENTAGE },
                             borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                         })
                     ]
                 }));
             });

             // Final Decision
             if (formData.decisionGrid?.finalDecision) {
                tableRows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: formData.decisionGrid.finalDecision.role + ":", font, size: FONT_SIZE_BODY, bold: true })] })],
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "[ ] Approved    [ ] Disapproved", font, size: FONT_SIZE_BODY })] })],
                            width: { size: 70, type: WidthType.PERCENTAGE },
                            borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                        })
                    ]
                }));
             }

             bodyParagraphs.push(new Table({
                 rows: tableRows,
                 width: { size: 80, type: WidthType.PERCENTAGE },
                 indent: { size: 1440, type: WidthType.DXA }, 
                 borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" } }
             }));
             bodyParagraphs.push(createEmptyLine(font));
        });

        return; // Skip standard processing for this paragraph
    }

    // Use the shared formatter logic which correctly handles:
    // 1. Citation generation (1., a., (1), etc.)
    // 2. Tab stops and indentation per SECNAV M-5216.5
    // 3. Bold/Italic parsing
    const shouldBoldTitle = !['moa', 'mou', 'information-paper', 'position-paper'].includes(formData.documentType);
    const shouldUppercaseTitle = !['moa', 'mou', 'information-paper', 'position-paper'].includes(formData.documentType);
    bodyParagraphs.push(createFormattedParagraph(p, index, paragraphsWithContent, font, "000000", isDirective, shouldBoldTitle, shouldUppercaseTitle, isCivilianStyle, formData.isShortLetter));
    
    // Add spacing after paragraph
    bodyParagraphs.push(new Paragraph({
        children: [], 
        spacing: { after: 0, before: 0 }, // Minimal spacing, rely on the empty line height
    }));
  });

  // Position Paper Decision Grid (Single & Multiple Choice) - Bottom
  if (isPositionPaper && formData.decisionGrid && formData.decisionMode !== 'MULTIPLE_RECS') {
      bodyParagraphs.push(createEmptyLine(font));
      
      if (formData.decisionMode === 'MULTIPLE_CHOICE') {
          // Mode B: Stacked COAs (Vertical)
          formData.decisionGrid.recommenders.forEach((rec: { id: string; role: string; options: string[] }) => {
              const coaRows = rec.options.map((opt: string) =>
                  new Paragraph({
                      children: [
                          new TextRun({ text: opt, font, size: FONT_SIZE_BODY }),
                          new TextRun({ text: "\t", font, size: FONT_SIZE_BODY }),
                          new TextRun({ text: "_______", font, size: FONT_SIZE_BODY }) // Underscore for signature
                      ],
                      tabStops: [{ type: TabStopType.LEFT, position: 1440 }],
                      spacing: { after: 120 }
                  })
              );

              const row = new TableRow({
                  children: [
                      new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: rec.role + " recommends:", font, size: FONT_SIZE_BODY })] })],
                          width: { size: 40, type: WidthType.PERCENTAGE },
                          verticalAlign: VerticalAlign.TOP,
                          borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                      }),
                      new TableCell({
                          children: coaRows,
                          width: { size: 60, type: WidthType.PERCENTAGE },
                          borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                      })
                  ]
              });
              
              bodyParagraphs.push(new Table({
                  rows: [row],
                  width: { size: 90, type: WidthType.PERCENTAGE },
                  indent: { size: 720, type: WidthType.DXA },
                  borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" } }
              }));
              bodyParagraphs.push(createEmptyLine(font));
          });

          // Final Decision
          if (formData.decisionGrid.finalDecision) {
              const final = formData.decisionGrid.finalDecision;
              // Force COA options for CMC in Multiple Choice mode to match recommenders if available
              const finalOptions = (formData.decisionMode === 'MULTIPLE_CHOICE' && formData.decisionGrid.recommenders.length > 0)
                 ? formData.decisionGrid.recommenders[0].options
                 : final.options;

              const coaRows = finalOptions.map((opt: string) =>
                  new Paragraph({
                      children: [
                          new TextRun({ text: opt, font, size: FONT_SIZE_BODY }),
                          new TextRun({ text: "\t", font, size: FONT_SIZE_BODY }),
                          new TextRun({ text: "_______", font, size: FONT_SIZE_BODY })
                      ],
                      tabStops: [{ type: TabStopType.LEFT, position: 1440 }],
                      spacing: { after: 120 }
                  })
              );

              const row = new TableRow({
                  children: [
                      new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: final.role + " decision:", font, size: FONT_SIZE_BODY, bold: true })] })],
                          width: { size: 40, type: WidthType.PERCENTAGE },
                          verticalAlign: VerticalAlign.TOP,
                          borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                      }),
                      new TableCell({
                          children: coaRows,
                          width: { size: 60, type: WidthType.PERCENTAGE },
                          borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                      })
                  ]
              });

              bodyParagraphs.push(new Table({
                  rows: [row],
                  width: { size: 90, type: WidthType.PERCENTAGE },
                  indent: { size: 720, type: WidthType.DXA },
                  borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" } }
              }));
          }

      } else {
          // Mode A: Single Recommendation (Standard Horizontal)
          // Recommenders
          formData.decisionGrid.recommenders.forEach((rec: { id: string; role: string; options: string[] }) => {
              const optionsText = rec.options.map((opt: string) => `[ ] ${opt}`).join("    ");
              
              bodyParagraphs.push(new Paragraph({
                  children: [
                      new TextRun({ text: rec.role + " recommends:\t", font, size: FONT_SIZE_BODY }),
                      new TextRun({ text: optionsText, font, size: FONT_SIZE_BODY })
                  ],
                  tabStops: [{ type: TabStopType.LEFT, position: 2880 }],
                  spacing: { after: 120 },
                  indent: { left: 720 }
              }));
          });

          // Final Decision
          if (formData.decisionGrid.finalDecision) {
              const finalOptsText = formData.decisionGrid.finalDecision.options.map((opt: string) => `[ ] ${opt}`).join("    ");
              bodyParagraphs.push(new Paragraph({
                  children: [
                      new TextRun({ text: formData.decisionGrid.finalDecision.role + " decision:\t", font, size: FONT_SIZE_BODY }),
                      new TextRun({ text: finalOptsText, font, size: FONT_SIZE_BODY })
                  ],
                  tabStops: [{ type: TabStopType.LEFT, position: 2880 }],
                  spacing: { before: 240, after: 120 },
                  indent: { left: 720 }
              }));
          }
      }
      
      bodyParagraphs.push(createEmptyLine(font));
  }

  // --- Reports Required (Directives) ---
  const reportsParagraphs: Paragraph[] = [];
  // Only add if not already present in paragraphs (avoid duplication with merged admin subsections)
  const hasReportsParagraph = paragraphs.some(p => p.content.includes('Reports Required'));
  
  if (isDirective && formData.reports && formData.reports.length > 0 && !hasReportsParagraph) {
    reportsParagraphs.push(createEmptyLine(font));
    reportsParagraphs.push(new Paragraph({
        children: [new TextRun({ text: "REPORTS REQUIRED:", font, size: FONT_SIZE_BODY })],
        spacing: { after: 120 }
    }));
    
    formData.reports.forEach((report: { title: string; controlSymbol?: string; exempt?: boolean }) => {
        let reportText = report.title;
        if (report.controlSymbol) reportText += ` (${report.controlSymbol})`;
        if (report.exempt) reportText += " (Exempt)";
        
        reportsParagraphs.push(new Paragraph({
            children: [new TextRun({ text: reportText, font, size: FONT_SIZE_BODY })],
            indent: { left: 720 }, // Indent report items
            spacing: { after: 120 }
        }));
    });
  }

  // --- Decision Grid (Position Paper) ---
  const decisionGridParagraphs: Paragraph[] = [];
  if (formData.documentType === 'position-paper' && formData.decisionGrid) {
      // Add spacer
      decisionGridParagraphs.push(createEmptyLine(font));

      // Recommenders
      formData.decisionGrid.recommenders.forEach((rec: { id: string; role: string; options: string[] }) => {
          // Role line
          decisionGridParagraphs.push(new Paragraph({
              children: [new TextRun({ text: `${rec.role} recommends:`, font, size: FONT_SIZE_BODY })],
              spacing: { after: 120 }
          }));

          // Options line
          const optionRuns: TextRun[] = [];
          rec.options.forEach((opt: string, index: number) => {
              if (index > 0) {
                  optionRuns.push(new TextRun({ text: "\t", font, size: FONT_SIZE_BODY }));
              }
              optionRuns.push(new TextRun({ text: opt, font, size: FONT_SIZE_BODY }));
              optionRuns.push(new TextRun({ text: " ", font, size: FONT_SIZE_BODY }));
              optionRuns.push(new TextRun({ 
                  text: "______", 
                  font, 
                  size: FONT_SIZE_BODY,
                  // Using underscore text instead of underline style for better visual match with PDF lines
              }));
          });

          decisionGridParagraphs.push(new Paragraph({
              children: optionRuns,
              tabStops: [
                  { type: TabStopType.LEFT, position: 2880 }, // 2 inches
                  { type: TabStopType.LEFT, position: 5760 }, // 4 inches
                  { type: TabStopType.LEFT, position: 8640 }  // 6 inches
              ],
              spacing: { after: 240 }
          }));
      });

      // Final Decision
      const final = formData.decisionGrid.finalDecision;
      decisionGridParagraphs.push(new Paragraph({
          children: [new TextRun({ text: `${final.role} decision:`, font, size: FONT_SIZE_BODY })],
          spacing: { after: 120, before: 240 }
      }));

      const finalOptionRuns: TextRun[] = [];
      final.options.forEach((opt: string, index: number) => {
          if (index > 0) {
              finalOptionRuns.push(new TextRun({ text: "\t", font, size: FONT_SIZE_BODY }));
          }
          finalOptionRuns.push(new TextRun({ text: opt, font, size: FONT_SIZE_BODY }));
          finalOptionRuns.push(new TextRun({ text: " ", font, size: FONT_SIZE_BODY }));
          finalOptionRuns.push(new TextRun({ 
              text: "______", 
              font, 
              size: FONT_SIZE_BODY,
          }));
      });

      decisionGridParagraphs.push(new Paragraph({
          children: finalOptionRuns,
          tabStops: [
              { type: TabStopType.LEFT, position: 2880 },
              { type: TabStopType.LEFT, position: 5760 },
              { type: TabStopType.LEFT, position: 8640 }
          ],
          spacing: { after: 240 }
      }));
  }

  // --- Signature ---
  const signatureParagraphs: (Paragraph | Table)[] = [];
  
  if (isMoaOrMou) {
      // 2-Column Table for MOA/MOU Signatures
      // Senior Right, Junior Left
      const table = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
          },
          rows: [
              // Empty rows for spacing (2 lines to match PDF's 3-line total gap: 1 body + 2 here)
              new TableRow({ children: [ 
                  new TableCell({ children: [createEmptyLine(font)], borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } } }), 
                  new TableCell({ children: [createEmptyLine(font)], borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } } }) 
              ] }),
              new TableRow({ children: [ 
                  new TableCell({ children: [createEmptyLine(font)], borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } } }), 
                  new TableCell({ children: [createEmptyLine(font)], borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } } }) 
              ] }),
              
              // Signature Line
              new TableRow({
                  children: [
                      new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "______________________", font, size: FONT_SIZE_BODY })], alignment: AlignmentType.CENTER })],
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                      }),
                      new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "______________________", font, size: FONT_SIZE_BODY })], alignment: AlignmentType.CENTER })],
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                      })
                  ]
              }),

              // Names
              new TableRow({
                  children: [
                      new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: moaData.juniorSigner.name.toUpperCase(), font, size: FONT_SIZE_BODY })], alignment: AlignmentType.CENTER })],
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                      }),
                      new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: moaData.seniorSigner.name.toUpperCase(), font, size: FONT_SIZE_BODY })], alignment: AlignmentType.CENTER })],
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                      })
                  ]
              }),
              // Titles
              new TableRow({
                  children: [
                      new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: moaData.juniorSigner.title, font, size: FONT_SIZE_BODY })], alignment: AlignmentType.CENTER })],
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                      }),
                      new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: moaData.seniorSigner.title, font, size: FONT_SIZE_BODY })], alignment: AlignmentType.CENTER })],
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                      })
                  ]
              }),
              // Activities
               new TableRow({
                   children: [
                       new TableCell({
                           children: [new Paragraph({ children: [new TextRun({ text: (moaData.juniorSigner?.activitySymbol || moaData.activityB || '').toUpperCase(), font, size: FONT_SIZE_BODY })], alignment: AlignmentType.CENTER })],
                           width: { size: 50, type: WidthType.PERCENTAGE },
                           borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                       }),
                       new TableCell({
                           children: [new Paragraph({ children: [new TextRun({ text: (moaData.seniorSigner?.activitySymbol || moaData.activityA || '').toUpperCase(), font, size: FONT_SIZE_BODY })], alignment: AlignmentType.CENTER })],
                           width: { size: 50, type: WidthType.PERCENTAGE },
                           borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                       })
                   ]
               })
          ]
      });
      signatureParagraphs.push(table);
  } else if (isCivilianStyle) {
      // Business/Executive Letter Closing Block
      let close = formData.complimentaryClose;
      if (!close) {
          close = formData.isVipMode ? "Very respectfully" : "Sincerely";
      }

      signatureParagraphs.push(new Paragraph({
          children: [new TextRun({ text: close.endsWith(',') ? close : close + ",", font, size: FONT_SIZE_BODY })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 }
      }));

      // Space for signature (2 lines)
      signatureParagraphs.push(createEmptyLine(font));
      signatureParagraphs.push(createEmptyLine(font));

      if (!formData.omitSignatureBlock) {
          // Signer Name
          if (formData.sig) {
              signatureParagraphs.push(new Paragraph({
                  children: [new TextRun({ text: formData.sig.toUpperCase(), font, size: FONT_SIZE_BODY })],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 0 }
              }));
          }

          // Signer Rank (business letter only)
          if (isBusinessLetter && formData.signerRank) {
              signatureParagraphs.push(new Paragraph({
                  children: [new TextRun({ text: formData.signerRank, font, size: FONT_SIZE_BODY })],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 0 }
              }));
          }

          // Signer Title
          if (formData.signerTitle) {
              signatureParagraphs.push(new Paragraph({
                  children: [new TextRun({ text: formData.signerTitle, font, size: FONT_SIZE_BODY })],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 0 }
              }));
          }
      }

      // Congressional courtesy copy
      if (isExecLetter && formData.courtesyCopyTo) {
          signatureParagraphs.push(createEmptyLine(font));
          signatureParagraphs.push(new Paragraph({
              children: [new TextRun({ text: formData.courtesyCopyTo, font, size: FONT_SIZE_BODY })],
              alignment: AlignmentType.LEFT,
              spacing: { after: 0 }
          }));
          signatureParagraphs.push(new Paragraph({
              children: [new TextRun({ text: 'Ranking Minority Member', font, size: FONT_SIZE_BODY })],
              alignment: AlignmentType.LEFT,
              spacing: { after: 0 }
          }));
      }
  } else if (formData.sig && !isStaffingPaper) {
    // Three empty lines before signature per reference app (matches SECNAV M-5216.5)
    signatureParagraphs.push(createEmptyLine(font));
    signatureParagraphs.push(createEmptyLine(font));
    signatureParagraphs.push(createEmptyLine(font));

    signatureParagraphs.push(new Paragraph({
      children: [
        new TextRun({ text: formData.sig.toUpperCase(), font, size: FONT_SIZE_BODY }),
      ],
      indent: { left: signatureIndent },
      spacing: { after: 0 },
    }));
    
    if (formData.delegationText && !isFromToMemo) {
      // Support both string and array formats for delegation text (reference uses string[])
      const delegationLines = Array.isArray(formData.delegationText)
        ? formData.delegationText
        : [formData.delegationText];

      delegationLines.forEach((line: string) => {
        if (line && line.trim()) {
          signatureParagraphs.push(new Paragraph({
            children: [
              new TextRun({ text: line, font, size: FONT_SIZE_BODY }),
            ],
            indent: { left: signatureIndent },
          }));
        }
      });
    }
  }

  // --- Distribution / Copy To ---
  const distributionParagraphs: Paragraph[] = [];
  
  if (isDirective) {
      // Distribution Statement
      const dist = formData.distribution;
      if (dist?.statementCode && DISTRIBUTION_STATEMENTS[dist.statementCode as keyof typeof DISTRIBUTION_STATEMENTS]) {
          const stmt = DISTRIBUTION_STATEMENTS[dist.statementCode as keyof typeof DISTRIBUTION_STATEMENTS];
          let stmtText = stmt.text;
          
          if (stmt.requiresFillIns) {
            if (dist.statementReason) stmtText = stmtText.replace('(fill in reason)', dist.statementReason);
            if (dist.statementDate) stmtText = stmtText.replace('(date of determination)', formatCancellationDate(dist.statementDate));
            if (dist.statementAuthority) {
                stmtText = stmtText.replace('(insert originating command)', dist.statementAuthority);
                stmtText = stmtText.replace('(originating command)', dist.statementAuthority);
            }
          }
          
          distributionParagraphs.push(createEmptyLine(font));
          distributionParagraphs.push(new Paragraph({
              children: [new TextRun({ text: stmtText, font, size: FONT_SIZE_BODY })],
              spacing: { after: 240 }
          }));
      }

      // PCN and Copy To
      if (dist && (dist.type === 'pcn' || dist.type === 'pcn-with-copy')) {
          distributionParagraphs.push(new Paragraph({
              children: [
                  new TextRun({ text: "DISTRIBUTION: ", font, size: FONT_SIZE_BODY }),
                  new TextRun({ text: `PCN ${dist.pcn || '___________'}`, font, size: FONT_SIZE_BODY })
              ],
              spacing: { after: 120 }
          }));
      }

      if (dist?.copyTo && dist.copyTo.length > 0) {
          distributionParagraphs.push(new Paragraph({
              children: [
                  new TextRun({ text: "Copy to: ", font, size: FONT_SIZE_BODY }),
                  new TextRun({ text: dist.copyTo.map((c: { code: string; qty: number }) => c.code).join(', '), font, size: FONT_SIZE_BODY })
              ],
              spacing: { after: 120 }
          }));
      }
  } else if (!isStaffingPaper) {
      // 1. Multiple-Address Distribution List (when "To Distribution" toggle is on)
      const isDocToDistribution = formData.documentType === 'multiple-address' && !!formData.distribution?.toDistribution;
      if (isDocToDistribution) {
          const recipients = formData.distribution?.recipients || [];
          const recipientsWithContent = recipients.filter((r: string) => r && r.trim());

          if (recipientsWithContent.length > 0) {
              distributionParagraphs.push(createEmptyLine(font));

              if (recipientsWithContent.length === 1) {
                  distributionParagraphs.push(new Paragraph({
                      children: [new TextRun({ text: `Distribution:  ${recipientsWithContent[0]}`, font, size: FONT_SIZE_BODY })],
                      alignment: AlignmentType.LEFT,
                      spacing: { after: 0 }
                  }));
              } else {
                  distributionParagraphs.push(new Paragraph({
                      children: [new TextRun({ text: "Distribution:", font, size: FONT_SIZE_BODY })],
                      alignment: AlignmentType.LEFT,
                      spacing: { after: 0 }
                  }));
                  recipientsWithContent.forEach((recipient: string) => {
                      distributionParagraphs.push(new Paragraph({
                          children: [new TextRun({ text: recipient, font, size: FONT_SIZE_BODY })],
                          alignment: AlignmentType.LEFT,
                          spacing: { after: 0 }
                      }));
                  });
              }
          }
      }

      // Manual Distribution List
      const manualDistWithContent = distList ? distList.filter(d => d.trim()) : [];

      if (manualDistWithContent.length > 0 && !isDocToDistribution) {
          distributionParagraphs.push(createEmptyLine(font));

          if (manualDistWithContent.length === 1) {
              distributionParagraphs.push(new Paragraph({
                  children: [new TextRun({ text: `Distribution:  ${manualDistWithContent[0]}`, font, size: FONT_SIZE_BODY })],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 0 }
              }));
          } else {
              distributionParagraphs.push(new Paragraph({
                  children: [new TextRun({ text: "Distribution:", font, size: FONT_SIZE_BODY })],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 0 }
              }));
              manualDistWithContent.forEach(dist => {
                  distributionParagraphs.push(new Paragraph({
                      children: [new TextRun({ text: dist, font, size: FONT_SIZE_BODY })],
                      alignment: AlignmentType.LEFT,
                      spacing: { after: 0 }
                  }));
              });
          }
      }

      // Standard Letter Copy To
      const copiesWithContent = copyTos.filter(c => c.trim());
      if (copiesWithContent.length > 0) {
          const copyToLabel = getCopyToSpacing(formData.bodyFont);
          distributionParagraphs.push(createEmptyLine(font));
          distributionParagraphs.push(new Paragraph({
              children: [new TextRun({ text: copyToLabel, font, size: FONT_SIZE_BODY })],
              alignment: AlignmentType.LEFT,
              // Legacy does NOT indent the label
              spacing: { after: 0 }
          }));
          
          copiesWithContent.forEach(copy => {
              distributionParagraphs.push(new Paragraph({
                  children: [
                      new TextRun({ text: copy, font, size: FONT_SIZE_BODY }),
                  ],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 0 }
              }));
          });
      }


  }

  // --- Staffing Paper Footer ---
  let staffingFooter: Footer | undefined;
  // Keep variable to avoid breaking children array until updated
  const staffingFooterParagraphs: Paragraph[] = []; 

  if (isStaffingPaper) {
      const footerLines: Paragraph[] = [];
      const isPositionPaper = formData.documentType === 'position-paper';
      const isInformationPaper = formData.documentType === 'information-paper';

      if (isPositionPaper) {
        // Position Paper Footer: Prepared By & Approved By (Left Aligned), Classification (Center)
        
        // Prepared By
        footerLines.push(new Paragraph({
            children: [
                new TextRun({ text: "Prepared by: ", font, size: FONT_SIZE_BODY, bold: true }),
                new TextRun({ 
                    text: `${formData.drafterRank || ''} ${formData.drafterName || ''}, ${formData.drafterOfficeCode || ''}, ${formData.drafterPhone || ''}`, 
                    font, 
                    size: FONT_SIZE_BODY 
                })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 120 }
        }));

        // Approved By
        footerLines.push(new Paragraph({
            children: [
                new TextRun({ text: "Approved by: ", font, size: FONT_SIZE_BODY, bold: true }),
                new TextRun({ 
                    text: `${formData.approverRank || ''} ${formData.approverName || ''}, ${formData.approverOfficeCode || ''}, ${formData.approverPhone || ''}`, 
                    font, 
                    size: FONT_SIZE_BODY 
                })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 240 }
        }));

        // Classification (Center Bottom)
        footerLines.push(new Paragraph({
            children: [new TextRun({ text: formData.classification || 'UNCLASSIFIED', font, size: FONT_SIZE_BODY, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240 }
        }));

      } else if (isInformationPaper) {
          // Information Paper Footer: Prepared By (Left) with Service/Agency
          
          footerLines.push(new Paragraph({
            children: [
                new TextRun({ text: "Prepared by: ", font, size: FONT_SIZE_BODY, bold: true }),
                new TextRun({ 
                    text: `${formData.drafterName || ''}, ${formData.drafterRank || ''}, ${formData.drafterService || 'USMC'}`, 
                    font, 
                    size: FONT_SIZE_BODY 
                })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 0 }
        }));

        footerLines.push(new Paragraph({
            children: [
                new TextRun({ 
                    text: `             ${formData.drafterAgency ? formData.drafterAgency + ', ' : ''}${formData.drafterOfficeCode || ''}, ${formData.drafterPhone || ''}`, 
                    font, 
                    size: FONT_SIZE_BODY 
                })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 240 }
        }));

         // Classification (Center Bottom)
         footerLines.push(new Paragraph({
            children: [new TextRun({ text: formData.classification || 'UNCLASSIFIED', font, size: FONT_SIZE_BODY, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240 }
        }));

      }
      
      staffingFooter = new Footer({
          children: footerLines
      });
  }

  // --- Header for First Page (Seal) ---
  let firstPageHeader: Header;
  
  if (sealBuffer && !isFromToMemo && !isMfr && !isStaffingPaper) {
      firstPageHeader = new Header({
          children: [
              new Paragraph({
                  children: [
                      new ImageRun({
                          data: sealBuffer,
                          transformation: {
                              width: 96,
                              height: 96,
                          },
                          floating: {
                              horizontalPosition: {
                                  relative: HorizontalPositionRelativeFrom.PAGE,
                                  offset: 458700, // approx 0.5"
                              },
                              verticalPosition: {
                                  relative: VerticalPositionRelativeFrom.PAGE,
                                  offset: 458700, // approx 0.5"
                              },
                              wrap: {
                                  type: TextWrappingType.NONE,
                              },
                          },
                      }),
                  ],
              }),
          ],
      });
  } else {
      firstPageHeader = new Header({ children: [] });
  }

  // --- Header for Subsequent Pages (Subject Line) ---
  const subsequentHeaderParagraphs: Paragraph[] = [];
  
  if (isCivilianStyle) {
      // Business/Executive Letter Continuation Header: SSIC, Originator, Date
      if (formData.ssic) {
          subsequentHeaderParagraphs.push(new Paragraph({
              children: [new TextRun({ text: formData.ssic, font, size: FONT_SIZE_BODY })],
              spacing: { after: 0 }
          }));
      }
      if (formData.originatorCode) {
          subsequentHeaderParagraphs.push(new Paragraph({
              children: [new TextRun({ text: formData.originatorCode, font, size: FONT_SIZE_BODY })],
              spacing: { after: 0 }
          }));
      }
      const dateText = isCivilianStyle
        ? formatBusinessDate(formData.date || '')
        : parseAndFormatDate(formData.date || 'Date Placeholder');

      subsequentHeaderParagraphs.push(new Paragraph({ 
          children: [new TextRun({ text: dateText, font, size: FONT_SIZE_BODY })],
          spacing: { after: 0 }
      }));
      
      subsequentHeaderParagraphs.push(createEmptyLine(font));
  } else {
      const headerSubjLines = splitSubject((formData.subj || '').toUpperCase(), 57);
      const headerSubjPrefix = getSubjSpacing(formData.bodyFont);
      
      if (headerSubjLines.length === 0) {
          if (formData.bodyFont === 'courier') {
              subsequentHeaderParagraphs.push(new Paragraph({
                  children: [new TextRun({ text: headerSubjPrefix, font, size: FONT_SIZE_BODY })],
                  alignment: AlignmentType.LEFT
              }));
          } else {
              subsequentHeaderParagraphs.push(new Paragraph({
                  children: [new TextRun({ text: headerSubjPrefix, font, size: FONT_SIZE_BODY })],
                  tabStops: [{ type: TabStopType.LEFT, position: 720 }]
              }));
          }
      } else {
          if (formData.bodyFont === 'courier') {
              subsequentHeaderParagraphs.push(new Paragraph({
                  children: [new TextRun({ text: headerSubjPrefix + headerSubjLines[0], font, size: FONT_SIZE_BODY })],
                  alignment: AlignmentType.LEFT
              }));
              for (let i = 1; i < headerSubjLines.length; i++) {
                  subsequentHeaderParagraphs.push(new Paragraph({
                      children: [new TextRun({ text: '       ' + headerSubjLines[i], font, size: FONT_SIZE_BODY })],
                      alignment: AlignmentType.LEFT
                  }));
              }
          } else {
              subsequentHeaderParagraphs.push(new Paragraph({
                  children: [
                      new TextRun({ text: headerSubjPrefix, font, size: FONT_SIZE_BODY }),
                      new TextRun({ text: headerSubjLines[0], font, size: FONT_SIZE_BODY })
                  ],
                  tabStops: [{ type: TabStopType.LEFT, position: 720 }]
              }));
              for (let i = 1; i < headerSubjLines.length; i++) {
                  subsequentHeaderParagraphs.push(new Paragraph({
                      children: [new TextRun({ text: "\t" + headerSubjLines[i], font, size: FONT_SIZE_BODY })],
                      tabStops: [{ type: TabStopType.LEFT, position: 720 }]
                  }));
              }
          }
      }
      subsequentHeaderParagraphs.push(createEmptyLine(font));
  }

  const defaultHeader = new Header({
      children: subsequentHeaderParagraphs
  });

  // --- Footer (Page Numbers) ---
  const footer = new Footer({
      children: [
          new Paragraph({
              children: [
                  new TextRun({
                      children: [PageNumber.CURRENT],
                      font,
                      size: FONT_SIZE_BODY
                  })
              ],
              alignment: AlignmentType.CENTER
          })
      ]
  });

  // Determine if we should show page number on first page
  // Standard letters (start=1): No number on first page
  // Endorsements/Continuations (start>1): Show number on first page
  const startPage = formData.startingPageNumber || 1;
  const showPageNumberOnFirstPage = startPage > 1;

  // --- Assemble Document ---
  const doc = new Document({
    sections: [{
        properties: {
          page: {
            margin: {
              top: MARGIN_TOP,
              right: formData.isShortLetter ? 2880 : MARGIN_RIGHT,
              bottom: MARGIN_BOTTOM,
              left: formData.isShortLetter ? 2880 : MARGIN_LEFT,
            },
            pageNumbers: {
              start: startPage,
              formatType: "decimal",
            },
          },
          titlePage: true, // Distinct first page header
        },
      headers: {
        first: firstPageHeader,
        default: defaultHeader,
      },
      footers: {
        first: isStaffingPaper && staffingFooter ? staffingFooter : (showPageNumberOnFirstPage ? footer : new Footer({ children: [] })),
        default: footer,
      },
      children: [
        ...letterheadParagraphs,
        ...ssicParagraphs,
        ...businessHeaderParagraphs,
        ...(isMoaOrMou ? [] : [createEmptyLine(font)]),
        ...moaHeaderParagraphs,
        ...staffingHeaderParagraphs,
        ...endorsementParagraphs,
        ...directiveTitleParagraphs,
        ...addressParagraphs,
        ...refParagraphs,
        ...enclParagraphs,
        ...bodyParagraphs,
        ...reportsParagraphs,
        ...decisionGridParagraphs,
        ...signatureParagraphs,
        ...distributionParagraphs,
      ],
    }],
  });

  return Packer.toBlob(doc);
}
