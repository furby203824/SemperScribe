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
  BorderStyle
} from "docx";
import { FormData, ParagraphData } from "@/types";
import { getDoDSealBufferSync } from "./dod-seal";
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
import { createFormattedParagraph } from "./paragraph-formatter";
import { parseAndFormatDate } from "./date-utils";
import { DISTRIBUTION_STATEMENTS } from "@/lib/constants";
import { DOC_SETTINGS, TAB_STOPS, INDENTS } from "./doc-settings";

// Constants for layout (in twips)
// 1 inch = 1440 twips
const MARGIN_TOP = 0; // Legacy uses 0 for top margin
const MARGIN_BOTTOM = 1440;
const MARGIN_LEFT = 1440;
const MARGIN_RIGHT = 1440;

const FONT_SIZE_BODY = 24; // 12pt (docx uses half-points)

// Helper to get font name
const getFont = (font: 'times' | 'courier') => {
  return font === 'courier' ? 'Courier New' : 'Times New Roman';
};

const getHexColor = (colorName?: string) => {
  switch (colorName) {
    case 'blue': return "0000FF";
    case 'red': return "FF0000";
    default: return "000000";
  }
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
  paragraphs: ParagraphData[]
): Promise<Blob> {
  const font = getFont(formData.bodyFont);
  const color = getHexColor(formData.accentColor);
  const sealBuffer = await getDoDSealBufferSync(formData.headerType as 'USMC' | 'DON');
  const isDirective = formData.documentType === 'mco' || formData.documentType === 'bulletin';

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

  // Department Header Text
  const headerText = formData.headerType === 'USMC' 
    ? 'UNITED STATES MARINE CORPS' 
    : 'DEPARTMENT OF THE NAVY';
    
  letterheadParagraphs.push(new Paragraph({
    children: [new TextRun({ text: headerText, font: 'Times New Roman', bold: true, size: 20, color })], // Size 20 (10pt) per legacy
    alignment: AlignmentType.CENTER,
    spacing: { after: 0 },
  }));

  // Address Lines
  [formData.line1, formData.line2, formData.line3].forEach(line => {
    if (line) {
      letterheadParagraphs.push(new Paragraph({
        children: [new TextRun({ text: line, font: 'Times New Roman', size: 16, color })], // Size 16 (8pt) per legacy
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
      }));
    }
  });

  letterheadParagraphs.push(createEmptyLine(font));

  // --- SSIC Block ---
  const ssicBlock = [];
  if (formData.documentType === 'bulletin' && formData.cancellationDate) {
    ssicBlock.push(`Canc: ${formatCancellationDate(formData.cancellationDate)}`);
  }
  if (formData.ssic) ssicBlock.push(formData.ssic);
  if (formData.originatorCode) ssicBlock.push(formData.originatorCode);
  ssicBlock.push(formData.date || 'Date Placeholder');

  const ssicParagraphs: (Paragraph | Table)[] = [];

  // Check for Endorsement to align side-by-side
  if (formData.documentType === 'endorsement' && formData.endorsementLevel && formData.basicLetterReference) {
      const endorsementText = `${formData.endorsementLevel} ENDORSEMENT on ${formData.basicLetterReference}`;
      
      // Use a table to place Endorsement (Left) and SSIC (Right) on the same line level
      // Col 1: Endorsement text (Width up to SSIC indent)
      // Col 2: SSIC text (Starts at SSIC indent)
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
              new TableRow({
                  children: [
                      // Left Cell: Endorsement Line
                      new TableCell({
                          width: { size: 7920, type: WidthType.DXA }, // 5.5 inches fixed width
                          children: [
                              new Paragraph({
                                  children: [new TextRun({ text: endorsementText, font, size: FONT_SIZE_BODY })],
                                  alignment: AlignmentType.LEFT,
                              })
                          ],
                          verticalAlign: "top",
                      }),
                      // Right Cell: SSIC Block
                      new TableCell({
                          width: { size: 100 - (7920 / 9360 * 100), type: WidthType.PERCENTAGE }, // Remaining width
                          children: ssicBlock.map(line => new Paragraph({
                              children: [new TextRun({ text: line, font, size: FONT_SIZE_BODY })],
                              alignment: AlignmentType.LEFT,
                          })),
                          verticalAlign: "top",
                      })
                  ]
              })
          ]
      });
       ssicParagraphs.push(table);
       // Empty line handled by main sequence
   } else {
      // Standard Stacked SSIC Block
      const ssicPars = ssicBlock.map(line => new Paragraph({
        children: [new TextRun({ text: line, font, size: FONT_SIZE_BODY })],
        alignment: AlignmentType.LEFT, // Legacy uses Left alignment with indent
        indent: { left: 7920 }, // 5.5 inches
        spacing: { after: 0 }
      }));
      ssicParagraphs.push(...ssicPars);
  }

  // --- Endorsement Identification Line (Only if NOT handled above) ---
  const endorsementParagraphs: Paragraph[] = [];
  // Logic moved inside SSIC block generation to ensure alignment
  
  // --- From/To/Via ---
  const addressParagraphs: Paragraph[] = [];
  
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

  // To
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

  // Via
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
             // Legacy: alignment: AlignmentType.LEFT
             // But here we are using TextRuns.
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
        
        // If Directive, override tabs?
        // Legacy logic is complex here.
        // Let's stick to what I had before but use the label generator.
        
        addressParagraphs.push(new Paragraph({
            children,
            tabStops: tabs.length > 0 ? tabs : [{ type: TabStopType.LEFT, position: tabPosition }],
            indent: isDirective ? addressIndent : undefined,
            spacing: { after: addressSpacing },
        }));
    });
  }

  // --- Subject ---
  addressParagraphs.push(createEmptyLine(font));
  
  const subjLabel = getSubjSpacing(formData.bodyFont);
  const subjLines = splitSubject(formData.subj.toUpperCase(), 57);
  
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

  // --- References ---
  const refParagraphs: Paragraph[] = [];
  const refs = references.filter(r => r.trim());
  if (refs.length > 0) {
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
  if (encls.length > 0) {
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

  // --- Body Paragraphs ---
  const bodyParagraphs: Paragraph[] = [];
  const paragraphsWithContent = paragraphs.filter(p => p.content.trim() || p.title);

  paragraphsWithContent.forEach((p, index) => {
    // Use the shared formatter logic which correctly handles:
    // 1. Citation generation (1., a., (1), etc.)
    // 2. Tab stops and indentation per SECNAV M-5216.5
    // 3. Bold/Italic parsing
    bodyParagraphs.push(createFormattedParagraph(p, index, paragraphsWithContent, font, "000000", isDirective));
    
    // Add spacing after paragraph
    bodyParagraphs.push(new Paragraph({
        children: [], 
        spacing: { after: 0, before: 0 }, // Minimal spacing, rely on the empty line height
    }));
  });

  // --- Reports Required (Directives) ---
  const reportsParagraphs: Paragraph[] = [];
  if (isDirective && formData.reports && formData.reports.length > 0) {
    reportsParagraphs.push(createEmptyLine(font));
    reportsParagraphs.push(new Paragraph({
        children: [new TextRun({ text: "REPORTS REQUIRED:", font, size: FONT_SIZE_BODY })],
        spacing: { after: 120 }
    }));
    
    formData.reports.forEach(report => {
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

  // --- Signature ---
  const signatureParagraphs: Paragraph[] = [];
  if (formData.sig) {
    signatureParagraphs.push(createEmptyLine(font));
    signatureParagraphs.push(createEmptyLine(font));
    
    signatureParagraphs.push(new Paragraph({
      children: [
        new TextRun({ text: formData.sig.toUpperCase(), font, size: FONT_SIZE_BODY }),
      ],
      indent: { left: signatureIndent },
      spacing: { after: 0 },
    }));
    
    if (formData.delegationText) {
      signatureParagraphs.push(new Paragraph({
        children: [
          new TextRun({ text: formData.delegationText, font, size: FONT_SIZE_BODY }),
        ],
        indent: { left: signatureIndent },
      }));
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
                  new TextRun({ text: dist.copyTo.map(c => c.code).join(', '), font, size: FONT_SIZE_BODY })
              ],
              spacing: { after: 120 }
          }));
      }
  } else {
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
              if (formData.bodyFont === 'courier') {
                  distributionParagraphs.push(new Paragraph({
                      children: [
                          new TextRun({ text: '       ' + copy, font, size: FONT_SIZE_BODY }),
                      ],
                      alignment: AlignmentType.LEFT,
                      spacing: { after: 0 }
                  }));
              } else {
                  distributionParagraphs.push(new Paragraph({
                      children: [
                          new TextRun({ text: copy, font, size: FONT_SIZE_BODY }),
                      ],
                      alignment: AlignmentType.LEFT,
                      indent: { left: 720 },
                      spacing: { after: 0 }
                  }));
              }
          });
      }
  }

  // --- Header for First Page (Seal) ---
  let firstPageHeader: Header;
  
  if (sealBuffer) {
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
  const headerSubjLines = splitSubject(formData.subj.toUpperCase(), 57);
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
            right: MARGIN_RIGHT,
            bottom: MARGIN_BOTTOM,
            left: MARGIN_LEFT,
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
        first: showPageNumberOnFirstPage ? footer : new Footer({ children: [] }),
        default: footer,
      },
      children: [
        ...letterheadParagraphs,
        ...ssicParagraphs,
        createEmptyLine(font),
        ...endorsementParagraphs,
        ...addressParagraphs,
        ...refParagraphs,
        ...enclParagraphs,
        ...bodyParagraphs,
        ...reportsParagraphs,
        ...signatureParagraphs,
        ...distributionParagraphs,
      ],
    }],
  });

  return Packer.toBlob(doc);
}
