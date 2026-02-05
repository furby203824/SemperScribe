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
import { parseAndFormatDate } from '@/lib/date-utils';
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

const createStyles = (bodyFont: 'times' | 'courier', accentColor?: string) => {
  const fontFamily = getPDFBodyFont(bodyFont);
  // Use user-selected color for header (blue or black)
  const headerColor = accentColor === 'blue' ? '#002D72' : '#000000';

  return StyleSheet.create({
    page: {
      paddingTop: PDF_MARGINS.top,
      paddingBottom: PDF_MARGINS.bottom,
      paddingLeft: PDF_MARGINS.left,
      paddingRight: PDF_MARGINS.right,
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
    signatureLine: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    
    copyToSection: {
      marginTop: 0,
    },
    copyToLabel: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    copyToLine: {
      marginLeft: PDF_INDENTS.copyTo,
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
      fontWeight: 'bold',
      textTransform: 'uppercase',
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
  });
};

function generateCitation(
  paragraph: ParagraphData,
  index: number,
  allParagraphs: ParagraphData[]
): string {
  const { level } = paragraph;

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
      if (p.content.trim() || p.id === paragraph.id) {
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
}: {
  paragraph: ParagraphData;
  index: number;
  allParagraphs: ParagraphData[];
  bodyFont: 'times' | 'courier';
  shouldBoldTitle?: boolean;
  shouldUppercaseTitle?: boolean;
}) {
  const citation = generateCitation(paragraph, index, allParagraphs);
  const level = paragraph.level;
  const tabs = PDF_PARAGRAPH_TABS[level as keyof typeof PDF_PARAGRAPH_TABS] || PDF_PARAGRAPH_TABS[1];
  const isUnderlined = level >= 5 && level <= 8;

  // Calculate left margin for this paragraph level
  const leftMargin = tabs.citation;
  
  const titleText = shouldUppercaseTitle && paragraph.title ? paragraph.title.toUpperCase() : paragraph.title;

  if (bodyFont === 'courier') {
    const spacesAfterCitation = citation.endsWith('.') ? '\u00A0\u00A0' : '\u00A0';

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
        {'\u00A0\u00A0'}
        {paragraph.title && (
            <Text style={shouldBoldTitle ? { fontWeight: 'bold' } : {}}>{titleText}{paragraph.content ? '.' : ''}{paragraph.content ? '\u00A0\u00A0' : ''}</Text>
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

  const sealDataUrl = getPDFSealDataUrl(formData.headerType as 'USMC' | 'DON');
  const formattedDate = parseAndFormatDate(formData.date || '');

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
  const isStaffingPaper = ['point-paper', 'talking-paper', 'briefing-paper', 'position-paper', 'trip-report'].includes(formData.documentType);
  
  // Determine if standard header (Seal + Letterhead) should be shown
  // STRICTLY HIDDEN for Staffing Papers (Point Paper, etc.), MFR, and From-To Memo
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
      <Page size="LETTER" style={styles.page}>
        {/* Continuation page header - Subject line on pages 2+ (absolutely positioned) */}
        <View
          style={styles.continuationHeader}
          fixed
          render={({ pageNumber }) => (
            pageNumber > 1 ? (
              <View>
                <View style={styles.continuationSubjLine}>
                  <Text style={styles.continuationSubjLabel}>Subj:</Text>
                  <Text style={styles.continuationSubjText}>{formattedSubjLines[0]}</Text>
                </View>
                {formattedSubjLines.slice(1).map((line, i) => (
                  <Text key={i} style={{ marginLeft: PDF_INDENTS.tabStop1 }}>{line}</Text>
                ))}
              </View>
            ) : null
          )}
        />
        
        {/* Fixed spacer - reserves space at top for continuation header on pages 2+ */}
        <View
          fixed
          render={({ pageNumber }) => (
            pageNumber > 1 ? (
              <View style={{ height: CONTINUATION_HEADER_HEIGHT }} />
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
        {!isFromToMemo && !isMfr && !isMoaOrMou && !isStaffingPaper && (
          <View style={styles.addressBlock}>
            {formData.documentType === 'bulletin' && formData.cancellationDate && (
              <Text style={styles.addressLine}>
                Canc: {formatCancellationDate(formData.cancellationDate)}
              </Text>
            )}
            <Text style={styles.addressLine}>{formData.ssic || ''}</Text>
            <Text style={styles.addressLine}>{formData.originatorCode || ''}</Text>
            <Text style={styles.addressLine}>{formattedDate}</Text>
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
          <View style={styles.staffingPaperHeader}>
            <Text style={styles.staffingPaperTitle}>
               {formData.documentType.replace('-', ' ').toUpperCase()}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
               <Text style={styles.staffingPaperSubject}>
                  Subj: {formData.subj ? formData.subj.toUpperCase() : ''}
               </Text>
            </View>
          </View>
        )}

        {/* From/To/Via - Hide for MFR, MOA/MOU, and Staffing Papers */}
        {formData.documentType !== 'mfr' && !isMoaOrMou && !isStaffingPaper && (
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
        {/* Subject Line - Hide for MOA/MOU (handled in header) */}
        {!isMoaOrMou && (
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

        {/* References */}
        {refsWithContent.length > 0 && (
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

        {/* Enclosures */}
        {enclsWithContent.length > 0 && (
          <View style={styles.refEnclSection}>
            {enclsWithContent.map((encl, i) => {
              const enclNum = startEnclNum + i;
              if (formData.bodyFont === 'courier') {
                const prefix = i === 0
                  ? `Encl:\u00A0\u00A0(${enclNum})\u00A0`
                  : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${enclNum})\u00A0`;
                return <Text key={i}>{prefix}{encl}</Text>;
              }
              return (
                <View key={i} style={styles.refEnclLine}>
                  <Text style={styles.refEnclLabel}>{i === 0 ? 'Encl:' : ''}</Text>
                  <Text>({enclNum}) {encl}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Body paragraphs - text wraps to left margin */}
        <View style={styles.bodySection}>
          {paragraphsWithContent.map((p, i) => (
            <ParagraphItem
              key={p.id}
              paragraph={p}
              index={i}
              allParagraphs={paragraphsWithContent}
              bodyFont={formData.bodyFont}
              shouldBoldTitle={!['moa', 'mou'].includes(formData.documentType)}
              shouldUppercaseTitle={!['moa', 'mou'].includes(formData.documentType)}
            />
          ))}
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

        {/* Signature block - Standard (Hide for MOA/MOU, Staffing Papers usually don't have this block, or different) */}
        {!isMoaOrMou && !isStaffingPaper && formData.sig && (
          <View style={styles.signatureBlock}>
            <View style={styles.emptyLine} />
            <View style={styles.emptyLine} />
            <View style={styles.emptyLine} />
            <Text style={styles.signatureLine}>{formData.sig.toUpperCase()}</Text>
            {!isFromToMemo && formData.delegationText && (
              <Text style={styles.signatureLine}>{formData.delegationText}</Text>
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
                {formData.bodyFont === 'courier' ? '             ' : ''}{dist}
              </Text>
            ))}
          </View>
        )}

        {/* Copy to (Standard Letter) */}
        {!isDirective && copiesWithContent.length > 0 && (
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
                {formData.bodyFont === 'courier' ? '       ' : ''}{copy}
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
          <View style={styles.staffingPaperFooter}>
            <Text style={styles.staffingPaperFooterLine}>{formData.drafterName || ''} {formData.drafterRank || ''}</Text>
            <Text style={styles.staffingPaperFooterLine}>{formData.drafterOfficeCode || ''} {formData.drafterPhone ? `/ ${formData.drafterPhone}` : ''}</Text>
            <Text style={styles.staffingPaperFooterLine}>{formattedDate}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export default NavalLetterPDF;
