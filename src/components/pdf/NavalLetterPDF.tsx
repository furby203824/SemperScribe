import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { FormData, ParagraphData } from '@/types';
import { getPDFBodyFont, PDF_FONTS } from '@/lib/pdf-fonts';
import {
  PDF_PAGE,
  PDF_MARGINS,
  PDF_FONT_SIZES,
  PDF_COLORS,
  PDF_INDENTS,
  PDF_PARAGRAPH_TABS,
  PDF_SEAL,
  PDF_SUBJECT,
  PDF_CONTENT_WIDTH,
  PDF_SPACING,
} from '@/lib/pdf-settings';

// Height reserved for continuation page header (Subj line + spacing)
// This creates top margin space on pages 2+ so content doesn't overlap the header
// Needs to accommodate 2 lines of subject text + spacing
const CONTINUATION_HEADER_HEIGHT = 48;
import { getPDFSealDataUrl } from '@/lib/pdf-seal';
import { parseAndFormatDate, formatBusinessDate } from '@/lib/date-utils';
import { splitSubject, formatCancellationDate } from '@/lib/naval-format-utils';
import { DISTRIBUTION_STATEMENTS } from '@/lib/constants';
import { parseFormattedText } from '@/lib/pdf-text-parser';

interface NavalLetterPDFProps {
  formData: FormData;
  vias: string[];
  references: string[];
  enclosures: string[];
  copyTos: string[];
  paragraphs: ParagraphData[];
  distList?: string[];
}

const createStyles = (bodyFont: 'times' | 'courier', accentColor?: string, isShortLetter?: boolean) => {
  const fontFamily = getPDFBodyFont(bodyFont);
  // Use user-selected color for header (blue or black)
  const headerColor = accentColor === 'blue' ? '#002D72' : '#000000';

  // Short Letter: 2" side margins (144pt). Standard is 1" (72pt) usually defined in PDF_MARGINS.
  // We override the default left/right margins if isShortLetter is true.
  const sideMargin = isShortLetter ? 144 : PDF_MARGINS.left;

  return StyleSheet.create({
    page: {
      paddingTop: PDF_MARGINS.top,
      paddingBottom: PDF_MARGINS.bottom,
      paddingLeft: sideMargin,
      paddingRight: sideMargin,
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    
    seal: {
      position: 'absolute',
      top: PDF_SEAL.offsetY,
      left: PDF_SEAL.offsetX,
      width: PDF_SEAL.width,
      height: PDF_SEAL.height,
    },
    
    letterhead: {
      marginBottom: 0,
    },
    
    headerTitle: {
      fontFamily: PDF_FONTS.SERIF,
      fontSize: PDF_FONT_SIZES.title,
      fontWeight: 'bold',
      textAlign: 'center',
      color: headerColor,
    },
    
    headerLine: {
      fontFamily: PDF_FONTS.SERIF,
      fontSize: PDF_FONT_SIZES.unitLines,
      textAlign: 'center',
      color: headerColor,
    },
    
    // SSIC block - uses sectionGap for spacing after
    addressBlock: {
      marginLeft: PDF_INDENTS.ssicBlock,
      marginBottom: PDF_SPACING.sectionGap,
    },
    addressLine: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    
    fromToSection: {
      marginBottom: 0,
    },
    fromToLine: {
      flexDirection: 'row',
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    fromToLabel: {
      width: PDF_INDENTS.tabStop1,
    },
    
    // Subject - uses sectionGap for spacing before and after
    subjectSection: {
      marginTop: PDF_SPACING.sectionGap,
      marginBottom: PDF_SPACING.sectionGap,
    },
    subjectLine: {
      flexDirection: 'row',
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    subjectLabel: {
      width: PDF_INDENTS.tabStop1,
    },
    subjectContinuation: {
      marginLeft: PDF_INDENTS.tabStop1,
    },
    
    // Ref/Encl - uses sectionGap for spacing after
    refEnclSection: {
      marginBottom: PDF_SPACING.sectionGap,
    },
    refEnclLine: {
      flexDirection: 'row',
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    refEnclLabel: {
      width: PDF_INDENTS.tabStop1,
    },
    refEnclContent: {
      flex: 1,
    },
    
    // Body - uses sectionGap for spacing after
    bodySection: {
      marginBottom: PDF_SPACING.sectionGap,
    },

    // MOA/MOU Header
    moaHeader: {
      textAlign: 'center',
      marginBottom: 0,
    },
    moaTitle: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
      marginBottom: 6,
    },
    moaBetween: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
      marginBottom: 6,
    },
    moaActivity: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
      marginBottom: 6,
    },
    moaAnd: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
      marginBottom: 6,
    },
    moaRegarding: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
      marginTop: 6,
    },

    // MOA/MOU Signatures
    signatureRow: {
      flexDirection: 'row',
      marginTop: 0,
      marginBottom: 12,
    },
    signatureColumn: {
      width: '50%',
      alignItems: 'center',
    },
    signatureLine: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
      textAlign: 'center',
    },
    
    // Individual paragraph spacing
    paragraphItem: {
      marginBottom: 0,
    },
    
    signatureBlock: {
      marginTop: 0,
      marginLeft: PDF_INDENTS.signature,
    },

    copyToSection: {
      marginTop: 0,
    },
    copyToLabel: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    copyToLine: {
      marginLeft: 0,
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    
    emptyLine: {
      height: PDF_SPACING.emptyLine,
    },
    
    footer: {
      position: 'absolute',
      bottom: 36,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: PDF_FONT_SIZES.body,
      fontFamily: fontFamily,
    },
    
    // Continuation page header (pages 2+)
    // Absolutely positioned at top of page, only visible on pages 2+
    continuationHeader: {
      position: 'absolute',
      top: PDF_MARGINS.top,
      left: PDF_MARGINS.left,
      right: PDF_MARGINS.right,
    },
    continuationSubjLabel: {
      width: PDF_INDENTS.tabStop1,
    },
    continuationSubjLine: {
      flexDirection: 'row',
    },
    continuationSubjText: {
      flex: 1,
    },

    // Staffing Paper Header
    staffingPaperHeader: {
      textAlign: 'center',
      marginBottom: PDF_SPACING.sectionGap * 2,
    },
    staffingPaperTitle: {
      fontFamily: PDF_FONTS.SERIF, // Usually Courier for these, but let's respect bodyFont or default to standard
      fontSize: PDF_FONT_SIZES.title,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      textDecoration: 'underline', // MCO 5216.20A often shows underlined title for Point Papers
      marginBottom: 12,
    },
    staffingPaperOn: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    staffingPaperSubject: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
      // fontWeight: 'bold', // Removed per user request
      // textTransform: 'uppercase', // Removed per user request
    },

    staffingPaperFooter: {
      position: 'absolute',
      bottom: PDF_MARGINS.bottom,
      right: PDF_MARGINS.right,
      textAlign: 'right',
    },
    staffingPaperFooterLine: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
      textAlign: 'right',
    },

    // Information Paper Specific Styles
    infoPaperClassification: {
      textAlign: 'center',
      fontSize: PDF_FONT_SIZES.body,
      fontFamily: fontFamily,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    infoPaperTitle: {
      textAlign: 'center',
      fontSize: PDF_FONT_SIZES.body,
      fontFamily: fontFamily,
      marginBottom: 0,
      textTransform: 'uppercase',
    },
    infoPaperIdBlock: {
      marginLeft: PDF_INDENTS.ssicBlock,
      marginBottom: PDF_SPACING.sectionGap,
      alignItems: 'flex-start',
    },
    infoPaperFooterContainer: {
        position: 'absolute',
        bottom: PDF_MARGINS.bottom,
        left: PDF_MARGINS.left,
        right: PDF_MARGINS.right,
    },
    infoPaperFooterLeft: {
        textAlign: 'left',
        fontSize: PDF_FONT_SIZES.body,
        fontFamily: fontFamily,
    },
    infoPaperFooterCenter: {
        textAlign: 'center',
        fontSize: PDF_FONT_SIZES.body,
        fontFamily: fontFamily,
        marginTop: 12,
        textTransform: 'uppercase',
    },
  });
};

function generateCitation(
  paragraph: ParagraphData,
  index: number,
  allParagraphs: ParagraphData[],
  documentType?: string
): string {
  const { level } = paragraph;

  if (documentType === 'information-paper' && level > 1) {
    switch (level) {
      case 2: return '•';
      case 3: return '◦';
      case 4: return '▪';
      default: return '•';
    }
  }

  let listStartIndex = 0;
  if (level > 1) {
    for (let i = index - 1; i >= 0; i--) {
      if (allParagraphs[i].level < level) {
        listStartIndex = i + 1;
        break;
      }
    }
  }

  let count = 0;
  for (let i = listStartIndex; i <= index; i++) {
    const p = allParagraphs[i];
    if (p.level === level) {
      if (p.content.trim() || p.title || p.id === paragraph.id) {
        count++;
      }
    }
  }

  if (count === 0) count = 1;

  switch (level) {
    case 1: return `${count}.`;
    case 2: return `${String.fromCharCode(96 + count)}.`;
    case 3: return `(${count})`;
    case 4: return `(${String.fromCharCode(96 + count)})`;
    case 5: return `${count}.`;
    case 6: return `${String.fromCharCode(96 + count)}.`;
    case 7: return `(${count})`;
    case 8: return `(${String.fromCharCode(96 + count)})`;
    default: return '';
  }
}

/**
 * Paragraph rendering - text wraps to LEFT MARGIN (citation position)
 * NOT indented to align with first word after citation
 */
function ParagraphItem({
  paragraph,
  index,
  allParagraphs,
  bodyFont,
  shouldBoldTitle = true,
  shouldUppercaseTitle = true,
  documentType,
  isShortLetter,
}: {
  paragraph: ParagraphData;
  index: number;
  allParagraphs: ParagraphData[];
  bodyFont: 'times' | 'courier';
  shouldBoldTitle?: boolean;
  shouldUppercaseTitle?: boolean;
  documentType?: string;
  isShortLetter?: boolean;
}) {
  const citation = generateCitation(paragraph, index, allParagraphs, documentType);
  const level = paragraph.level;
  const tabs = PDF_PARAGRAPH_TABS[level as keyof typeof PDF_PARAGRAPH_TABS] || PDF_PARAGRAPH_TABS[1];
  const isUnderlined = level >= 5 && level <= 8;

  // Calculate left margin for this paragraph level
  const leftMargin = tabs.citation;
  
  const titleText = shouldUppercaseTitle && paragraph.title ? paragraph.title.toUpperCase() : paragraph.title;

  if (documentType === 'business-letter') {
     if (level === 1) {
        // Main Paragraph: First line indent 0.25" (18pt) to match Word/policy "8 spaces"
        // Short Letter rule: If isShortLetter is true, indent is 1 inch (72pt)
        const indent = isShortLetter ? 72 : 18; 
        
        return (
          <View style={{ marginLeft: 0, marginBottom: PDF_SPACING.paragraph, textIndent: indent }}>
             <Text style={isShortLetter ? { lineHeight: 2.0 } : {}}>
                {paragraph.title && (
                    <Text style={{ fontWeight: shouldBoldTitle ? 'bold' : 'normal' }}>
                        {titleText}{paragraph.content ? '.' : ''}{paragraph.content ? '\u00A0\u00A0' : ''}
                    </Text>
                )}
                {parseFormattedText(paragraph.content)}
             </Text>
          </View>
        );
     } else {
        // Subparagraphs: Indented with hanging indent behavior
        // Level 2: Citation at 0.25" (18pt). Text aligns with first letter
        
        // Define indentation levels for business letters
        // Level 2: Indent 18pt (0.25") -> Alignment 36pt
        const indentStep = 18;
        const textOffset = 18; // Space between citation and text
        
        // Level 2 starts at 36pt. Level 3 at 72pt.
        const baseIndent = (level - 1) * indentStep; 
        const totalLeftMargin = baseIndent + textOffset; // Where text starts
        
        return (
          <View style={{ marginLeft: totalLeftMargin, marginBottom: PDF_SPACING.paragraph, textIndent: -textOffset }}>
             <Text style={isShortLetter ? { lineHeight: 2.0 } : {}}>
                {citation}
                {'\u00A0'}
                {paragraph.title && (
                    <Text style={{ fontWeight: shouldBoldTitle ? 'bold' : 'normal' }}>
                        {titleText}{paragraph.content ? '.' : ''}{paragraph.content ? '\u00A0\u00A0' : ''}
                    </Text>
                )}
                {parseFormattedText(paragraph.content)}
             </Text>
          </View>
        );
     }
  }

  if (bodyFont === 'courier') {
    const spacesAfterCitation = (citation.endsWith('.') || documentType === 'information-paper') ? '\u00A0\u00A0' : '\u00A0';

    return (
      <View style={{ marginLeft: leftMargin, marginBottom: PDF_SPACING.paragraph }}>
        <Text>
          {isUnderlined ? (
            <>
              <Text style={{ textDecoration: 'underline' }}>
                {citation.replace(/[().]/g, '')}
              </Text>
              {citation.includes('(') ? ')' : '.'}
            </>
          ) : (
            citation
          )}
          {spacesAfterCitation}
          {paragraph.title && (
            <Text>{titleText}{paragraph.content ? '.' : ''}{paragraph.content ? '\u00A0\u00A0' : ''}</Text>
          )}
          {parseFormattedText(paragraph.content)}
        </Text>
      </View>
    );
  }

  // Times New Roman - citation on same line, text wraps to citation position (left margin)
  // Use a single Text block so wrapping goes to the left edge of the container
  return (
    <View style={{ marginLeft: leftMargin, marginBottom: PDF_SPACING.paragraph }}>
      <Text>
        {isUnderlined ? (
          <>
            {citation.includes('(') && '('}
            <Text style={{ textDecoration: 'underline' }}>
              {citation.replace(/[().]/g, '')}
            </Text>
            {citation.includes(')') ? ')' : '.'}
          </>
        ) : (
          citation
        )}
        {documentType === 'information-paper' ? '\u00A0\u00A0' : '\u00A0\u00A0'}
        {paragraph.title && (
            <Text style={{
              fontWeight: shouldBoldTitle ? 'bold' : 'normal',
              textDecoration: 'none'
            }}>{titleText}{paragraph.content ? '.' : ''}{paragraph.content ? '\u00A0\u00A0' : ''}</Text>
        )}
        {parseFormattedText(paragraph.content)}
      </Text>
    </View>
  );
}

export function NavalLetterPDF({
  formData,
  vias,
  references,
  enclosures,
  copyTos,
  paragraphs,
  distList = [],
}: NavalLetterPDFProps) {
  const styles = createStyles(
    formData.bodyFont || 'times',
    formData.accentColor
  );

  const isBusinessLetter = formData.documentType === 'business-letter';
  
  const sealDataUrl = getPDFSealDataUrl(formData.headerType as 'USMC' | 'DON');
  const formattedDate = isBusinessLetter 
    ? formatBusinessDate(formData.date || '') 
    : parseAndFormatDate(formData.date || '');

  const viasWithContent = vias.filter((v) => v.trim());
  const refsWithContent = references.filter((r) => r.trim());
  const enclsWithContent = enclosures.filter((e) => e.trim());
  const copiesWithContent = copyTos.filter((c) => c.trim());
  const distListWithContent = distList.filter((d) => d.trim());
  const paragraphsWithContent = paragraphs.filter((p) => p.content.trim() || p.title);

  const formattedSubjLines = splitSubject((formData.subj || '').toUpperCase(), PDF_SUBJECT.maxLineLength);
  const isDirective = formData.documentType === 'mco' || formData.documentType === 'bulletin';
  const isFromToMemo = formData.documentType === 'from-to-memo';
  const isMfr = formData.documentType === 'mfr';
  const isMoaOrMou = formData.documentType === 'moa' || formData.documentType === 'mou';
  const isInformationPaper = formData.documentType === 'information-paper';
  // const isBusinessLetter defined above
  const isPositionPaper = formData.documentType === 'position-paper';
  const isStaffingPaper = ['position-paper', 'information-paper'].includes(formData.documentType);
  
  // Determine if standard header (Seal + Letterhead) should be shown
  // STRICTLY HIDDEN for Staffing Papers, MFR, and From-To Memo
  const showStandardHeader = !isFromToMemo && !isMfr && !isStaffingPaper;

  const moaData = formData.moaData || {
    activityA: '',
    activityB: '',
    activityAHeader: { ssic: '', serial: '', date: '' },
    activityBHeader: { ssic: '', serial: '', date: '' },
    seniorSigner: { name: '', title: '', activity: '', date: '' },
    juniorSigner: { name: '', title: '', activity: '', date: '' }
  };
  
  // Logic to determine if we are in "Multiple Address" mode with MANY recipients (automatic list)
  // If true, we use the automatic list and HIDE the manual list to avoid duplication.
  const isMultipleAddressMany = formData.documentType === 'multiple-address' && 
                               (formData.distribution?.recipients?.filter(r => r && r.trim()).length || 0) > 1;

  const getFromToSpacing = (label: string): string => {
    if (formData.bodyFont === 'courier') {
      if (label === 'From') return 'From:  ';
      if (label === 'To') return 'To:    ';
    }
    return `${label}:`;
  };

  const getViaSpacing = (index: number, total: number): string => {
    if (formData.bodyFont === 'courier') {
      if (total === 1) return 'Via:\u00A0\u00A0\u00A0';
      return index === 0
        ? `Via:\u00A0\u00A0\u00A0(${index + 1})\u00A0`
        : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${index + 1})\u00A0`;
    }
    if (total === 1) return 'Via:';
    return index === 0 ? 'Via:' : '';
  };

  const isEndorsement = formData.documentType === 'endorsement';
  const startPage = isEndorsement ? (formData.startingPageNumber || 1) : 1;

  // Calculate starting indices for refs/encls
  const startRefChar = isEndorsement && formData.startingReferenceLevel 
    ? formData.startingReferenceLevel.charCodeAt(0) 
    : 'a'.charCodeAt(0);
    
  const startEnclNum = isEndorsement && formData.startingEnclosureNumber
    ? parseInt(formData.startingEnclosureNumber, 10)
    : 1;

  const fontFamily = getPDFBodyFont(formData.bodyFont || 'times');

  return (
    <Document
      title={formData.subj || 'Naval Letter'}
      author="by Semper Admin"
      subject="Generated Naval Letter Format"
    >
      <Page size="LETTER" style={[styles.page, formData.isShortLetter ? { paddingLeft: 144, paddingRight: 144 } : {}]}>
        {/* Continuation page header - Subject line on pages 2+ (absolutely positioned) */}
        <View
          style={styles.continuationHeader}
          fixed
          render={({ pageNumber }) => (
            pageNumber > 1 ? (
              <View>
                {isBusinessLetter && (
                   <View style={{ marginBottom: 12 }}>
                      <Text style={styles.addressLine}>{formData.ssic}</Text>
                      <Text style={styles.addressLine}>{formData.originatorCode}</Text>
                      <Text style={styles.addressLine}>{formattedDate}</Text>
                   </View>
                )}
                {!isBusinessLetter && (
                  <>
                    <View style={styles.continuationSubjLine}>
                      <Text style={styles.continuationSubjLabel}>Subj:</Text>
                      <Text style={styles.continuationSubjText}>{formattedSubjLines[0]}</Text>
                    </View>
                    {formattedSubjLines.slice(1).map((line, i) => (
                      <Text key={i} style={{ marginLeft: PDF_INDENTS.tabStop1 }}>{line}</Text>
                    ))}
                  </>
                )}
              </View>
            ) : null
          )}
        />
        
        {/* Fixed spacer - reserves space at top for continuation header on pages 2+ */}
        <View
          fixed
          render={({ pageNumber }) => (
            pageNumber > 1 ? (
              <View style={{ height: CONTINUATION_HEADER_HEIGHT + (isBusinessLetter ? 48 : 0) }} />
            ) : null
          )}
        />
        
        {/* Seal - Only on first page, skip for Staffing Papers */}
        {showStandardHeader && <Image src={sealDataUrl} style={styles.seal} />}

        {/* Letterhead - Only on first page, skip for Staffing Papers */}
        {showStandardHeader && (
        <View style={styles.letterhead}>
          <Text style={styles.headerTitle}>
            {formData.headerType === 'USMC'
              ? 'UNITED STATES MARINE CORPS'
              : 'DEPARTMENT OF THE NAVY'}
          </Text>
          {formData.line1 && <Text style={styles.headerLine}>{formData.line1}</Text>}
          {formData.line2 && <Text style={styles.headerLine}>{formData.line2}</Text>}
          {formData.line3 && <Text style={styles.headerLine}>{formData.line3}</Text>}
        </View>
        )}

        {/* One empty line after letterhead */}
        {showStandardHeader && <View style={styles.emptyLine} />}

        {/* From-To Memo and MFR Date - Flush Right, top of content */}
        {(isFromToMemo || isMfr) && (
            <View style={{ marginBottom: PDF_SPACING.sectionGap, marginTop: 24, alignItems: 'flex-end' }}>
                <Text style={styles.addressLine}>{formattedDate}</Text>
            </View>
        )}

        {/* SSIC Block - Hide for MFR, FromToMemo, Staffing Papers */}
        {/* New Layout: Flush Right Container, Left Aligned Text Content */}
        {!isFromToMemo && !isMfr && !isMoaOrMou && !isStaffingPaper && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: PDF_SPACING.sectionGap }}>
             <View style={{ alignItems: 'flex-start' }}>
                {formData.documentType === 'bulletin' && formData.cancellationDate && (
                  <Text style={styles.addressLine}>
                    Canc: {formatCancellationDate(formData.cancellationDate)}
                  </Text>
                )}
                <Text style={styles.addressLine}>{formData.ssic || ''}</Text>
                <Text style={styles.addressLine}>{formData.originatorCode || ''}</Text>
                <Text style={styles.addressLine}>{formattedDate}</Text>
             </View>
          </View>
        )}

        {/* Business Letter Inside Address & Salutation */}
        {isBusinessLetter && (
             <View style={{ 
                marginTop: formData.isWindowEnvelope ? 84 : 0,
                marginBottom: PDF_SPACING.sectionGap,
                marginLeft: 0 
             }}>
                 {formData.recipientName && <Text style={styles.addressLine}>{formData.recipientName}</Text>}
                 {formData.recipientTitle && <Text style={styles.addressLine}>{formData.recipientTitle}</Text>}
                 {formData.businessName && <Text style={styles.addressLine}>{formData.businessName}</Text>}
                 {(formData.recipientAddress || '').split('\n').map((line, i) => (
                     <Text key={i} style={styles.addressLine}>{line}</Text>
                 ))}

                 {formData.attentionLine && (
                     <Text style={[styles.addressLine, { marginTop: 12, marginBottom: 12 }]}>
                         Attention: {formData.attentionLine}
                     </Text>
                 )}

                 <Text style={[styles.addressLine, { marginTop: 24 }]}>
                     {formData.salutation || 'Dear Sir or Madam:'}
                 </Text>

                 {/* Subject Line (Optional) */}
                 {formData.subj && (
                    <View style={{ flexDirection: 'row', marginTop: 12 }}>
                        <Text style={[styles.addressLine, { width: 62 }]}>SUBJECT:</Text>
                        <Text style={[styles.addressLine, { flex: 1, textTransform: 'uppercase' }]}>
                            {formData.subj}
                        </Text>
                    </View>
                 )}
             </View>
        )}

        {/* Endorsement Identification Line - Between date and From */}
        {isEndorsement && formData.endorsementLevel && formData.basicLetterReference && (
          <View style={{ marginBottom: PDF_SPACING.sectionGap }}>
            <Text style={styles.addressLine}>
              {`${formData.endorsementLevel} ENDORSEMENT on ${formData.basicLetterReference}`}
            </Text>
          </View>
        )}

        {/* Directive Title Line - Between date and From (MCO/Bulletin) */}
        {isDirective && formData.directiveTitle && (
          <View style={{ marginBottom: PDF_SPACING.sectionGap }}>
            <Text style={[styles.addressLine, { textDecoration: 'underline' }]}>
              {formData.directiveTitle}
            </Text>
          </View>
        )}

        {/* MFR Title */}
        {formData.documentType === 'mfr' && (
          <View style={{ marginBottom: PDF_SPACING.sectionGap }}>
            <Text style={[styles.addressLine, { textAlign: 'left' }]}>
              MEMORANDUM FOR THE RECORD
            </Text>
          </View>
        )}

        {/* From-To Memo Title */}
        {isFromToMemo && (
          <View style={{ marginBottom: PDF_SPACING.sectionGap, marginTop: 12, alignItems: 'flex-start' }}>
            <Text style={[styles.addressLine, { textAlign: 'left' }]}>
              MEMORANDUM
            </Text>
          </View>
        )}

        {/* Letterhead Memo Title - Between date and MEMORANDUM FOR */}
        {formData.documentType === 'letterhead-memo' && (
          <View style={{ marginBottom: PDF_SPACING.sectionGap }}>
             <Text style={[styles.addressLine, { textAlign: 'left' }]}>
              MEMORANDUM
            </Text>
          </View>
        )}

        {/* MOA/MOU Header */}
        {isMoaOrMou && (
            <View>
              {/* Side-by-Side Activity Header */}
              <View style={{ 
                flexDirection: 'row', 
                marginBottom: 14, 
                marginTop: 12,
                fontFamily: fontFamily,
                fontSize: PDF_FONT_SIZES.body 
              }}>
                 {/* Left Side: Activity B (Junior) - Starts at left margin */}
                 <View style={{ width: '50%' }}>
                   <Text>{(moaData.juniorSigner.activitySymbol || moaData.activityB || '').toUpperCase()}</Text>
                   {moaData.activityBHeader?.ssic && <Text>{moaData.activityBHeader.ssic}</Text>}
                   {moaData.activityBHeader?.serial && <Text>{moaData.activityBHeader.serial}</Text>}
                   {moaData.activityBHeader?.date && <Text>{moaData.activityBHeader.date}</Text>}
                 </View>

                 {/* Right Side: Activity A (Senior) - Dynamically placed based on longest line (Flush Right block, Left Text) */}
                 <View style={{ width: '50%', alignItems: 'flex-end' }}>
                   <View style={{ alignItems: 'flex-start' }}>
                     <Text>{(moaData.seniorSigner.activitySymbol || moaData.activityA || '').toUpperCase()}</Text>
                     {moaData.activityAHeader?.ssic && <Text>{moaData.activityAHeader.ssic}</Text>}
                     {moaData.activityAHeader?.serial && <Text>{moaData.activityAHeader.serial}</Text>}
                     {moaData.activityAHeader?.date && <Text>{moaData.activityAHeader.date}</Text>}
                   </View>
                 </View>
              </View>

              <View style={styles.moaHeader}>
                <Text style={styles.moaTitle}>
                    {formData.documentType === 'moa' ? 'MEMORANDUM OF AGREEMENT' : 'MEMORANDUM OF UNDERSTANDING'}
                </Text>
                <Text style={styles.moaBetween}>BETWEEN</Text>
                <Text style={styles.moaActivity}>{(moaData.activityA || '').toUpperCase()}</Text>
                <Text style={styles.moaAnd}>AND</Text>
                <Text style={styles.moaActivity}>{(moaData.activityB || '').toUpperCase()}</Text>
              </View>
              
              {/* Subj line for MOA/MOU - Standard format instead of REGARDING */}
              <View style={[styles.subjectSection, { marginTop: 8 }]}>
                {formData.bodyFont === 'courier' ? (
                  <>
                    <Text style={styles.subjectLine}>
                      {'Subj:\u00A0\u00A0\u00A0' + formattedSubjLines[0]}
                    </Text>
                    {formattedSubjLines.slice(1).map((line, i) => (
                      <Text key={i} style={styles.subjectLine}>
                        {'       ' + line}
                      </Text>
                    ))}
                  </>
                ) : (
                  <View style={styles.subjectLine}>
                    <Text style={styles.subjectLabel}>Subj:</Text>
                    <View style={{ flex: 1 }}>
                      {formattedSubjLines.map((line, i) => (
                        <Text key={i}>{line}</Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
        )}

        {/* Staffing Paper Header */}
        {isStaffingPaper && (
          <View style={{ marginBottom: 0 }}>
              {/* Top Classification */}
              <Text style={styles.infoPaperClassification}>
                  {formData.classification || 'UNCLASSIFIED'}
              </Text>
              
              {/* ID Block (Right) */}
              <View style={styles.infoPaperIdBlock}>
                  <Text style={styles.addressLine}>{formData.drafterOfficeCode || ''}</Text>
                  <Text style={styles.addressLine}>{formattedDate || ''}</Text>
              </View>

              {/* Title */}
              <Text style={styles.infoPaperTitle}>
                  {isPositionPaper ? 'POSITION/DECISION PAPER' : 'INFORMATION PAPER'}
              </Text>
              
              {/* Subject for Position Paper/Info Paper */}
              <View style={{ marginTop: 12, marginBottom: PDF_SPACING.sectionGap }}>
                {formData.bodyFont === 'courier' ? (
                  <>
                    <Text style={styles.staffingPaperSubject}>
                      Subj:{'\u00A0'}{formattedSubjLines[0] || ''}
                    </Text>
                    {formattedSubjLines.slice(1).map((line, i) => (
                      <Text key={i} style={[styles.staffingPaperSubject, { marginLeft: PDF_INDENTS.tabStop1 }]}>
                        {'       '}{line}
                      </Text>
                    ))}
                  </>
                ) : (
                  <>
                    <View style={{ flexDirection: 'row' }}>
                      <Text style={[styles.staffingPaperSubject, { width: PDF_INDENTS.tabStop1 }]}>Subj:{'\u00A0'}</Text>
                      <Text style={styles.staffingPaperSubject}>{formattedSubjLines[0] || ''}</Text>
                    </View>
                    {formattedSubjLines.slice(1).map((line, i) => (
                      <Text key={i} style={[styles.staffingPaperSubject, { marginLeft: PDF_INDENTS.tabStop1 }]}>
                        {line}
                      </Text>
                    ))}
                  </>
                )}
              </View>
          </View>
        )}

        {/* From/To/Via - Hide for MFR, MOA/MOU, Staffing Papers, and Business Letter */}
        {formData.documentType !== 'mfr' && !isMoaOrMou && !isStaffingPaper && !isBusinessLetter && (
        <View style={styles.fromToSection}>
          {/* From Line - Common */}
          {formData.bodyFont === 'courier' ? (
             <Text style={styles.addressLine}>{getFromToSpacing('From')}{formData.from}</Text>
          ) : (
             <View style={styles.fromToLine}>
                <Text style={styles.fromToLabel}>From:</Text>
                <Text>{formData.from}</Text>
             </View>
          )}

          {/* To Line(s) */}
          {formData.documentType === 'multiple-address' ? (
             // Multiple Address Logic
             (() => {
                const recipients = formData.distribution?.recipients || (formData.to ? [formData.to] : ["Addressee"]);
                const recipientsWithContent = recipients.filter(r => r && r.trim());
                if (recipientsWithContent.length === 0) recipientsWithContent.push("Addressee");

                if (recipientsWithContent.length > 1) {
                    // > 1 Recipients: "See Distribution"
                    return formData.bodyFont === 'courier' ? (
                         <Text style={styles.addressLine}>{getFromToSpacing('To')}See Distribution</Text>
                    ) : (
                         <View style={styles.fromToLine}>
                            <Text style={styles.fromToLabel}>To:</Text>
                            <Text>See Distribution</Text>
                         </View>
                    );
                } else {
                    // 1 Recipient: Stacked (which is just one)
                    return formData.bodyFont === 'courier' ? (
                        <>
                          {recipientsWithContent.map((r, i) => (
                             <Text key={i} style={styles.addressLine}>
                               {i === 0 ? getFromToSpacing('To') : '       '}
                               {r}
                             </Text>
                          ))}
                        </>
                     ) : (
                        <View style={styles.fromToLine}>
                           <Text style={styles.fromToLabel}>To:</Text>
                           <View style={{ flex: 1 }}>
                              {recipientsWithContent.map((r, i) => (
                                 <Text key={i} style={{ marginBottom: 0 }}>{r}</Text>
                              ))}
                           </View>
                        </View>
                     );
                }
             })()
          ) : (
             // Standard Logic
             formData.bodyFont === 'courier' ? (
                <Text style={styles.addressLine}>{getFromToSpacing('To')}{formData.to}</Text>
             ) : (
                <View style={styles.fromToLine}>
                    <Text style={styles.fromToLabel}>To:</Text>
                    <Text>{formData.to}</Text>
                </View>
             )
          )}

          {/* Via Lines - Only if NOT multiple-address */}
          {formData.documentType !== 'multiple-address' && viasWithContent.map((via, i) => (
            formData.bodyFont === 'courier' ? (
              <Text key={i} style={styles.addressLine}>
                {getViaSpacing(i, viasWithContent.length)}{via}
              </Text>
            ) : (
              <View key={i} style={styles.fromToLine}>
                <Text style={styles.fromToLabel}>{i === 0 ? 'Via:' : ''}</Text>
                {viasWithContent.length > 1 ? (
                  <Text>({i + 1}) {via}</Text>
                ) : (
                  <Text>{via}</Text>
                )}
              </View>
            )
          ))}
        </View>
        )}

        {/* Subject */}
        {/* Subject Line - Hide for MOA/MOU (handled in header), Staffing Papers (handled in custom header), and Business Letter (custom placement) */}
        {!isMoaOrMou && !isStaffingPaper && !isBusinessLetter && (
        <View style={styles.subjectSection}>
          {formData.bodyFont === 'courier' ? (
            <>
              <Text>Subj:  {formattedSubjLines[0] || ''}</Text>
              {formattedSubjLines.slice(1).map((line, i) => (
                <Text key={i} style={styles.subjectContinuation}>
                  {'       '}{line}
                </Text>
              ))}
            </>
          ) : (
            <>
              <View style={styles.subjectLine}>
                <Text style={styles.subjectLabel}>Subj:</Text>
                <Text>{formattedSubjLines[0] || ''}</Text>
              </View>
              {formattedSubjLines.slice(1).map((line, i) => (
                <Text key={i} style={{ marginLeft: PDF_INDENTS.tabStop1 }}>{line}</Text>
              ))}
            </>
          )}
        </View>
        )}

        {/* References - Hide for Business Letter */}
        {!isBusinessLetter && refsWithContent.length > 0 && (
          <View style={styles.refEnclSection}>
            {refsWithContent.map((ref, i) => {
              const refLetter = String.fromCharCode(startRefChar + i);
              if (formData.bodyFont === 'courier') {
                const prefix = i === 0
                  ? `Ref:\u00A0\u00A0\u00A0(${refLetter})\u00A0`
                  : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${refLetter})\u00A0`;
                return <Text key={i}>{prefix}{ref}</Text>;
              }
              return (
                <View key={i} style={styles.refEnclLine}>
                  <Text style={styles.refEnclLabel}>{i === 0 ? 'Ref:' : ''}</Text>
                  <Text>({refLetter}) {ref}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Enclosures / Tabs - Hide for Business Letter (rendered at bottom) */}
        {!isBusinessLetter && enclsWithContent.length > 0 && (
          <View style={styles.refEnclSection}>
            {enclsWithContent.map((encl, i) => {
              const isPositionPaper = formData.documentType === 'position-paper';
              const enclNum = startEnclNum + i;
              const enclLabel = isPositionPaper ? 'Tab:' : 'Encl:';
              // Tabs use A, B, C... Enclosures use (1), (2), (3)...
              const enclIndicator = isPositionPaper ? String.fromCharCode(65 + i) : `(${enclNum})`;
              
              if (formData.bodyFont === 'courier') {
                // Adjust spacing for "Tab:" (4 chars) vs "Encl:" (5 chars)
                // Actually "Tab:" is 4, "Encl:" is 5.
                // Standard letter uses 2 spaces after colon.
                const labelStr = i === 0 ? enclLabel : '';
                const padding = i === 0 
                    ? (isPositionPaper ? '\u00A0\u00A0' : '\u00A0\u00A0') 
                    : (isPositionPaper ? '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0' : '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
                
                // For Courier, we need precise alignment.
                // Tab:  (A)  Item
                //       (B)  Item
                // Encl: (1)  Item
                //       (2)  Item
                
                // Let's use a simplified approach for now consistent with previous code
                 const prefix = i === 0
                  ? `${enclLabel}\u00A0\u00A0${isPositionPaper ? '' : ''}${enclIndicator}\u00A0`
                  : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0${enclIndicator}\u00A0`;
                  
                // If it's Tab (shorter label), we might need an extra space to align if mixed (but they aren't mixed)
                return <Text key={i}>{prefix}{encl}</Text>;
              }
              return (
                <View key={i} style={styles.refEnclLine}>
                  <Text style={styles.refEnclLabel}>{i === 0 ? enclLabel : ''}</Text>
                  <Text>{enclIndicator} {encl}</Text>
                </View>
              );
            })}
          </View>
        )}



        {/* Body paragraphs - text wraps to left margin */}
        <View style={styles.bodySection}>
          {paragraphsWithContent.map((p, i) => {
             // Custom handling for Position Paper - Paragraph 4 (Recommendation)
             // We wrap this paragraph AND the Decision Grid together to prevent orphans
             // STRICTLY check for 'Recommendation' title to avoid hijacking other paragraphs (like 2b)
             if (formData.documentType === 'position-paper' &&
                 p.title && p.title.toLowerCase().includes('recommendation')) {
         
                 return (
                     <View key={p.id} wrap={false} style={{ marginLeft: PDF_PARAGRAPH_TABS[1].citation, marginBottom: PDF_SPACING.paragraph }}>
                         {/* 4. Recommendation. */}
                        <Text>
                            {generateCitation(p, i, paragraphsWithContent, formData.documentType)}
                            {/* Restore title for the actual Recommendation paragraph */}
                            {p.title && (
                                <Text>
                                    {'\u00A0\u00A0'}{p.title}.
                                </Text>
                            )}
                            {/* Render content inline for ALL modes */}
                            {p.content && (
                                <Text style={{ fontFamily: fontFamily, fontSize: PDF_FONT_SIZES.body }}>
                                   {'\u00A0\u00A0'}{p.content}
                                </Text>
                            )}
                        </Text>
                         
                         {/* Content of Recommendation Paragraph */}
                         {/* If MULTIPLE_RECS, content is generated from grid items. */}
                         
                         {formData.decisionMode === 'MULTIPLE_RECS' ? (
                            // MULTIPLE_RECS Logic (Embedded Grid)
                            // We re-use the SINGLE/MULTIPLE_CHOICE layout logic for each recommendation item.
                            formData.decisionGrid?.recommendationItems?.map((item, idx) => (
                                 <View key={item.id} style={{ marginTop: 12, marginRight: 0 }}> 
                                     {/* Item Text: a. Approve adoption... */}
                                     <Text style={{ marginBottom: 12, fontFamily: fontFamily, fontSize: PDF_FONT_SIZES.body }}>
                                         {String.fromCharCode(97 + idx)}.{'\u00A0\u00A0'}{item.text}
                                     </Text>
                                     
                                     {/* Routing Chain - Same layout as SINGLE mode */}
                                     {formData.decisionGrid?.recommenders.map((rec, rIdx) => (
                                        <View key={rIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <Text style={{ fontFamily: fontFamily, fontSize: PDF_FONT_SIZES.body, maxWidth: '50%' }}>
                                                {rec.role} recommends:
                                            </Text>
                                            <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                                                {rec.options.map((opt, j) => {
                                                    // Mapping "Approve" -> "Approval" for display consistency
                                                    let displayOpt = opt;
                                                    if (opt === 'Approve') displayOpt = 'Approval';
                                                    if (opt === 'Disapprove') displayOpt = 'Disapproval';

                                                    return (
                                                        <View key={j} style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                                            <Text style={{ fontFamily: fontFamily, fontSize: PDF_FONT_SIZES.body, marginRight: 8 }}>
                                                                {displayOpt}
                                                            </Text>
                                                            <View style={{ borderBottomWidth: 1, borderBottomColor: 'black', width: 100 }} />
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                     ))}
                                     
                                     {/* Final Decision - Same layout as SINGLE mode */}
                                     {formData.decisionGrid?.finalDecision && (
                                       <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 }}>
                                           <Text style={{ fontFamily: fontFamily, fontSize: PDF_FONT_SIZES.body, maxWidth: '50%', fontWeight: 'bold' }}>
                                               {formData.decisionGrid.finalDecision.role} decision:
                                           </Text>
                                           <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                                               {formData.decisionGrid.finalDecision.options.map((opt, j) => {
                                                   // Mapping "Approved" -> "Approved" (no change needed usually, but just in case)
                                                   let displayOpt = opt;
                                                   // Ensure consistent past tense if needed, but usually it's "Approved" / "Disapproved" in the data
                                                   
                                                   return (
                                                       <View key={j} style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                                           <Text style={{ fontFamily: fontFamily, fontSize: PDF_FONT_SIZES.body, marginRight: 8 }}>
                                                               {displayOpt}
                                                           </Text>
                                                           <View style={{ borderBottomWidth: 1, borderBottomColor: 'black', width: 100 }} />
                                                       </View>
                                                   );
                                               })}
                                           </View>
                                       </View>
                                     )}
                                 </View>
                             ))
                         ) : (
                            // SINGLE / MULTIPLE_CHOICE Logic
                            <>
                                {/* Render the Decision Grid immediately after */}
                                {formData.decisionGrid && (
                                    <View style={{ marginTop: 12, marginRight: 0 }}>
                                       {/* Recommenders */}
                                       {formData.decisionGrid.recommenders.map((rec, rIdx) => (
                                          <View key={rIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                              <Text style={{ fontFamily: fontFamily, fontSize: PDF_FONT_SIZES.body, maxWidth: '50%' }}>
                                                  {rec.role} recommends:
                                              </Text>
                                              <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                                                  {rec.options.map((opt, j) => {
                                                      let displayOpt = opt;
                                                      if (formData.decisionMode === 'SINGLE') {
                                                          if (opt === 'Approve') displayOpt = 'Approval';
                                                          if (opt === 'Disapprove') displayOpt = 'Disapproval';
                                                      }
                                                      return (
                                                          <View key={j} style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                                              <Text style={{ fontFamily: fontFamily, fontSize: PDF_FONT_SIZES.body, marginRight: 8 }}>
                                                                  {displayOpt}
                                                              </Text>
                                                              <View style={{ borderBottomWidth: 1, borderBottomColor: 'black', width: 100 }} />
                                                          </View>
                                                      );
                                                  })}
                                              </View>
                                          </View>
                                        ))}
                          
                                        {/* Final Decision */}
                                        {formData.decisionGrid.finalDecision && (
                                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 0 }}>
                                              <Text style={{ fontFamily: fontFamily, fontSize: PDF_FONT_SIZES.body, maxWidth: '50%', fontWeight: 'bold' }}>
                                                  {formData.decisionGrid.finalDecision.role} decision:
                                              </Text>
                                              <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                                                  {(() => {
                                                       const finalOptions = (formData.decisionMode === 'MULTIPLE_CHOICE' && formData.decisionGrid.recommenders.length > 0)
                                                          ? formData.decisionGrid.recommenders[0].options
                                                          : formData.decisionGrid.finalDecision.options;
                          
                                                       return finalOptions.map((opt, j) => {
                                                           let displayOpt = opt;
                                                           if (formData.decisionMode === 'SINGLE') {
                                                               if (opt === 'Approved') displayOpt = 'Approved';
                                                               if (opt === 'Disapproved') displayOpt = 'Disapproved';
                                                           }
                                                           
                                                           return (
                                                              <View key={j} style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                                                  <Text style={{ fontFamily: fontFamily, fontSize: PDF_FONT_SIZES.body, marginRight: 8 }}>
                                                                      {displayOpt}
                                                                  </Text>
                                                                  <View style={{ borderBottomWidth: 1, borderBottomColor: 'black', width: 100 }} />
                                                              </View>
                                                           );
                                                      });
                                                  })()}
                                              </View>
                                          </View>
                                        )}
                                    </View>
                                 )}
                             </>
                         )}
                     </View>
                 );
             }

            return (
            <ParagraphItem
              key={p.id}
              paragraph={p}
              index={i}
              allParagraphs={paragraphsWithContent}
              bodyFont={formData.bodyFont}
              shouldBoldTitle={!['moa', 'mou', 'information-paper', 'position-paper'].includes(formData.documentType)}
              shouldUppercaseTitle={!['moa', 'mou', 'information-paper', 'position-paper'].includes(formData.documentType)}
              documentType={formData.documentType}
              isShortLetter={formData.isShortLetter}
            />
          );
          })}
        </View>

        {/* Reports Required (for Directives) */}
        {isDirective && formData.reports && formData.reports.length > 0 && (
          <View style={styles.bodySection}>
             <View style={styles.emptyLine} />
             <Text style={{ fontFamily: styles.page.fontFamily, fontSize: PDF_FONT_SIZES.body }}>
               REPORTS REQUIRED:
             </Text>
             {formData.reports.map((report, i) => {
               let reportText = report.title;
               if (report.controlSymbol) reportText += ` (${report.controlSymbol})`;
               if (report.exempt) reportText += " (Exempt)";
               return (
                 <View key={i} style={{ flexDirection: 'row', marginLeft: PDF_INDENTS.tabStop1 }}>
                   <Text style={{ fontFamily: styles.page.fontFamily, fontSize: PDF_FONT_SIZES.body }}>
                     {reportText}
                   </Text>
                 </View>
               );
             })}
          </View>
        )}

        {/* Signature block - Standard (Hide for MOA/MOU, Staffing Papers, Business Letter) */}
        {!isMoaOrMou && !isStaffingPaper && !isBusinessLetter && formData.sig && (
          <View style={styles.signatureBlock}>
            <View style={styles.emptyLine} />
            <View style={styles.emptyLine} />
            <View style={styles.emptyLine} />
            <Text style={[styles.signatureLine, { textAlign: 'left' }]}>{formData.sig.toUpperCase()}</Text>
            {!isFromToMemo && formData.delegationText && (
              <Text style={[styles.signatureLine, { textAlign: 'left' }]}>{formData.delegationText}</Text>
            )}
          </View>
        )}

        {/* Business Letter Closing Block */}
        {isBusinessLetter && (
            <View>
                {/* Complimentary Close (Centered) */}
                <View style={{ marginBottom: PDF_SPACING.sectionGap * 2, marginLeft: PDF_INDENTS.signature }}>
                    <View style={styles.emptyLine} />
                    <Text style={styles.addressLine}>
                        {formData.complimentaryClose || (formData.isVipMode ? 'Very respectfully,' : 'Sincerely,')}
                    </Text>
                </View>

                {/* Signature Block (Centered) */}
                <View style={{ marginBottom: PDF_SPACING.sectionGap, marginLeft: PDF_INDENTS.signature }}>
                     <View style={styles.emptyLine} />
                     <View style={styles.emptyLine} />
                     <View style={styles.emptyLine} />
                     <Text style={styles.addressLine}>{formData.sig}</Text>
                     {formData.signerRank && <Text style={styles.addressLine}>{formData.signerRank}</Text>}
                     {formData.signerTitle && <Text style={styles.addressLine}>{formData.signerTitle}</Text>}
                     {formData.delegationText && <Text style={styles.addressLine}>{formData.delegationText}</Text>}
                </View>

                {/* Enclosures (Flush Left) */}
                {enclsWithContent.length > 0 && (
                    <View style={{ marginBottom: PDF_SPACING.sectionGap, marginLeft: 0 }}>
                        <Text style={styles.addressLine}>
                            {enclsWithContent.length > 1 ? 'Enclosures' : 'Enclosure'}
                        </Text>
                        {enclsWithContent.map((encl, i) => (
                            <Text key={i} style={styles.addressLine}>{encl}</Text>
                        ))}
                    </View>
                )}

                {/* Copy To (Flush Left) */}
                {copiesWithContent.length > 0 && (
                    <View style={{ marginBottom: PDF_SPACING.sectionGap, marginLeft: 0 }}>
                        <Text style={styles.addressLine}>Copy to:</Text>
                        {copiesWithContent.map((copy, i) => (
                            <Text key={i} style={styles.addressLine}>{copy}</Text>
                        ))}
                    </View>
                )}
            </View>
        )}

        {/* MOA/MOU Signature Block */}
        {isMoaOrMou && (
          <View style={styles.signatureRow}>
            {/* Junior Signer (Left) */}
            <View style={styles.signatureColumn}>
              <View style={styles.emptyLine} />
              <View style={styles.emptyLine} />
              <View style={{ borderBottomWidth: 1, borderBottomColor: 'black', width: '80%', marginBottom: 4 }} />
              <Text style={styles.signatureLine}>{(moaData.juniorSigner?.name || '').toUpperCase()}</Text>
              <Text style={styles.signatureLine}>{moaData.juniorSigner?.title || ''}</Text>
              <Text style={styles.signatureLine}>{(moaData.juniorSigner?.activitySymbol || moaData.activityB || '').toUpperCase()}</Text>
            </View>

            {/* Senior Signer (Right) */}
            <View style={styles.signatureColumn}>
              <View style={styles.emptyLine} />
              <View style={styles.emptyLine} />
              <View style={{ borderBottomWidth: 1, borderBottomColor: 'black', width: '80%', marginBottom: 4 }} />
              <Text style={styles.signatureLine}>{(moaData.seniorSigner?.name || '').toUpperCase()}</Text>
              <Text style={styles.signatureLine}>{moaData.seniorSigner?.title || ''}</Text>
              <Text style={styles.signatureLine}>{(moaData.seniorSigner?.activitySymbol || moaData.activityA || '').toUpperCase()}</Text>
            </View>
          </View>
        )}

        {/* Distribution / Copy To for Directives */}
        {isDirective && (
            <View style={styles.copyToSection}>
                {/* Distribution Statement */}
                {(() => {
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
                        return (
                            <View style={{ marginBottom: PDF_SPACING.sectionGap, marginTop: PDF_SPACING.sectionGap }}>
                                <Text style={{ fontFamily: styles.page.fontFamily, fontSize: PDF_FONT_SIZES.body }}>
                                    {stmtText}
                                </Text>
                            </View>
                        );
                    }
                    return null;
                })()}

                {formData.distribution && (formData.distribution.type === 'pcn' || formData.distribution.type === 'pcn-with-copy') && (
                    <View style={{ flexDirection: 'row', marginTop: PDF_SPACING.paragraph }}>
                        <Text style={styles.copyToLabel}>DISTRIBUTION: </Text>
                        <Text style={styles.copyToLine}>
                            PCN {formData.distribution.pcn || '___________'}
                        </Text>
                    </View>
                )}
                
                {formData.distribution?.copyTo && formData.distribution.copyTo.length > 0 && (
                    <View style={{ flexDirection: 'row', marginTop: PDF_SPACING.paragraph }}>
                        <Text style={styles.copyToLabel}>Copy to: </Text>
                        <Text style={styles.copyToLine}>
                            {formData.distribution.copyTo.map(c => c.code).join(', ')}
                        </Text>
                    </View>
                )}
            </View>
        )}



        {/* Distribution List for Multiple-Address Letter (Automatic) */}
        {isMultipleAddressMany && (
            <View style={styles.copyToSection}>
                <View style={styles.emptyLine} />
                <Text style={styles.copyToLabel}>Distribution:</Text>
                {formData.distribution?.recipients?.filter(r => r && r.trim()).map((r, i) => (
                    <Text key={i} style={styles.copyToLine}>
                        {r}
                    </Text>
                ))}
            </View>
        )}

        {/* Manual Distribution List (Standard Letter or Multiple-Address with <= 1 recipient) */}
        {!isDirective && !isMultipleAddressMany && distListWithContent.length > 0 && (
          <View style={styles.copyToSection}>
            <Text style={styles.copyToLabel}>
              {formData.bodyFont === 'courier' ? 'Distribution:  ' : 'Distribution:'}
            </Text>
            {distListWithContent.map((dist, i) => (
              <Text key={i} style={styles.copyToLine}>
                {dist}
              </Text>
            ))}
          </View>
        )}

        {/* Copy to (Standard Letter) - Hide for Business Letter AND Staffing Papers */}
        {!isDirective && !isBusinessLetter && !isStaffingPaper && copiesWithContent.length > 0 && (
          <View style={styles.copyToSection}>
            {/* Add full space if any distribution list was rendered above */}
            {(isMultipleAddressMany || (distListWithContent.length > 0)) && (
               <View style={styles.emptyLine} />
            )}
            <Text style={styles.copyToLabel}>
              {formData.bodyFont === 'courier' ? 'Copy to:  ' : 'Copy to:'}
            </Text>
            {copiesWithContent.map((copy, i) => (
              <Text key={i} style={styles.copyToLine}>
                {copy}
              </Text>
            ))}
          </View>
        )}

        {/* Footer - page number on pages after first */}
        <Text
          style={styles.footer}
          render={({ pageNumber }) => {
            const displayPage = pageNumber + startPage - 1;
            if (isDirective) return displayPage;
            return displayPage > 1 ? displayPage : '';
          }}
          fixed
        />

        {/* Staffing Paper Footer */}
        {isStaffingPaper && (
          isInformationPaper ? (
            <View style={styles.infoPaperFooterContainer}>
                 <View style={{ flexDirection: 'row' }}>
                    <Text style={styles.infoPaperFooterLeft}>Prepared by: </Text>
                    <View>
                        <Text style={styles.infoPaperFooterLeft}>
                            {formData.drafterName}, {formData.drafterRank}, {formData.drafterService || 'USMC'}
                        </Text>
                        <Text style={styles.infoPaperFooterLeft}>
                            {formData.drafterAgency ? `${formData.drafterAgency}, ` : ''}{formData.drafterOfficeCode}, {formData.drafterPhone}
                        </Text>
                    </View>
                 </View>
                 <Text style={styles.infoPaperFooterCenter}>
                    {formData.classification || 'UNCLASSIFIED'}
                 </Text>
            </View>
          ) : formData.documentType === 'position-paper' ? (
             <View style={styles.infoPaperFooterContainer}>
                 <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.infoPaperFooterLeft}>Prepared by: </Text>
                        <Text style={styles.infoPaperFooterLeft}>
                            {formData.drafterRank} {formData.drafterName}, {formData.drafterOfficeCode}, {formData.drafterPhone}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.infoPaperFooterLeft}>Approved by: </Text>
                        <Text style={styles.infoPaperFooterLeft}>
                            {formData.approverRank || 'Rank'} {formData.approverName || 'Name'}, {formData.approverOfficeCode || 'Code'}, {formData.approverPhone || 'Phone'}
                        </Text>
                    </View>
                 </View>
                 <Text style={styles.infoPaperFooterCenter}>
                    {formData.classification || 'UNCLASSIFIED'}
                 </Text>
            </View>
          ) : (
          <View style={styles.staffingPaperFooter}>
               <Text style={styles.staffingPaperFooterLine}>{formData.drafterName || ''} {formData.drafterRank || ''}</Text>
               <Text style={styles.staffingPaperFooterLine}>{formData.drafterOfficeCode || ''} {formData.drafterPhone ? `/ ${formData.drafterPhone}` : ''}</Text>
               <Text style={styles.staffingPaperFooterLine}>{formattedDate}</Text>
          </View>
          )
        )}
      </Page>
    </Document>
  );
}

export default NavalLetterPDF;
