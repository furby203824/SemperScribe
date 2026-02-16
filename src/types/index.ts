/**
 * Shared type definitions for the Naval Letter Formatter application
 */

export interface ParagraphData {
  id: number;
  level: number;
  content: string;
  acronymError?: string;
  title?: string;
  isMandatory?: boolean;
}

export type EndorsementLevel = 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'FIFTH' | 'SIXTH' | 'SEVENTH' | 'EIGHTH' | 'NINTH' | 'TENTH' | '';

export interface ReportData {
  id: string;
  title: string;
  controlSymbol: string;
  paragraphRef: string;
  exempt?: boolean;
}

// Distribution Statement Codes per DoD 5230.24
export type DistributionStatementCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X' | '';

export interface DistributionData {
  type: 'none' | 'standard' | 'pcn' | 'pcn-with-copy';
  pcn?: string;
  copyTo?: Array<{ code: string; qty: number }>;
  recipients?: string[]; // For Multiple-Address Letter
  // Distribution Statement fields
  statementCode?: DistributionStatementCode;
  statementReason?: string;
  statementDate?: string;
  statementAuthority?: string;
}

export interface AdminSubsections {
  recordsManagement: { show: boolean; content: string; order: number };
  privacyAct: { show: boolean; content: string; order: number };
  reportsRequired: { show: boolean; content: string; order: number };
}

export interface FormData {
  documentType: 'basic' | 'endorsement' | 'aa-form' | 'mco' | 'bulletin' | 'page11' | 'amhs' | 'multiple-address' | 'mfr' | 'from-to-memo' | 'letterhead-memo' | 'moa' | 'mou' | 'position-paper' | 'information-paper' | 'business-letter' | '';
  endorsementLevel: EndorsementLevel;
  basicLetterReference: string;
  basicLetterSsic?: string;
  referenceWho: string;
  referenceType: string;
  referenceDate: string;
  startingReferenceLevel: string;
  startingEnclosureNumber: string;
  line1: string;
  line2: string;
  line3: string;
  ssic: string;
  originatorCode: string;
  date: string;
  from: string;
  to: string;
  subj: string;
  sig: string;
  delegationText: string;
  startingPageNumber: number;
  previousPackagePageCount: number;
  headerType: 'USMC' | 'DON';
  bodyFont: 'times' | 'courier';
  accentColor?: 'black' | 'blue' | 'red';
  classification?: string;
  // AA Form specific fields
  actionNo?: string;
  orgStation?: string; // Can default to line1 + line2 + line3 if not set
  // MCO/Bulletin specific fields
  orderPrefix?: string;  // Directive prefix (e.g., "MCO", "BnO", "DivO")
  directiveTitle?: string;  // Full directive title (e.g., "MARINE CORPS ORDER 5210.11F")
  cancellationDate?: string;
  cancellationType?: 'contingent' | 'fixed';
  cancellationContingency?: string;
  distribution?: DistributionData;
  reports?: ReportData[];
  adminSubsections?: AdminSubsections;
  
  // Page 11 specific fields
  name?: string;
  edipi?: string;
  remarksLeft?: string;
  remarksRight?: string;

  // AMHS specific fields
  amhsMessageType?: 'GENADMIN' | 'MARADMIN' | 'ALMAR';
  amhsClassification?: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP SECRET';
  amhsPrecedence?: 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE' | 'FLASH';
  amhsDtg?: string;
  amhsOfficeCode?: string;
  amhsNarrative?: string;
  amhsTextBody?: string;
  amhsReferences?: AMHSReference[];
  amhsPocs?: string[];
  
  // Staffing Paper specific fields
  drafterName?: string;
  drafterRank?: string;
  drafterOfficeCode?: string;
  drafterPhone?: string;
  drafterService?: string;
  drafterAgency?: string;
  approverName?: string;
  approverRank?: string;
  approverOfficeCode?: string;
  approverPhone?: string;

  // Decision Grid
  decisionMode?: 'SINGLE' | 'MULTIPLE_CHOICE' | 'MULTIPLE_RECS';
  decisionGrid?: {
    recommenders: Array<{
      id: string;
      role: string; // e.g., "Dir Ops"
      options: string[]; // e.g., ["Approve", "Disapprove"] or ["COA 1", "COA 2"]
    }>;
    finalDecision: {
      role: string; // e.g., "CMC"
      options: string[]; // e.g., ["Approved", "Disapproved"]
    };
    coas?: string[]; // For MULTIPLE_CHOICE
    recommendationItems?: Array<{ // For MULTIPLE_RECS
      id: string;
      text: string;
    }>;
  };

  // MOA/MOU specific fields
  moaData?: {
    activityA: string; // Senior Activity (Right side)
    activityB: string; // Junior Activity (Left side)
    // Optional Header Details for side-by-side display
    activityAHeader?: {
        ssic?: string;
        serial?: string;
        date?: string;
    };
    activityBHeader?: {
        ssic?: string;
        serial?: string;
        date?: string;
    };
    seniorSigner: {
      name: string;
      title: string;
      activity: string;
      activitySymbol?: string;
      date?: string;
    };
    juniorSigner: {
      name: string;
      title: string;
      activity: string;
      activitySymbol?: string;
      date?: string;
    };
  };

  // Business Letter specific fields
  recipientName?: string;
  recipientTitle?: string;
  businessName?: string;
  recipientAddress?: string;
  attentionLine?: string;
  salutation?: string;
  complimentaryClose?: string;
  signerRank?: string;
  signerTitle?: string;
  // Business Letter Toggles
  isWindowEnvelope?: boolean;
  isShortLetter?: boolean;
  isVipMode?: boolean;
}

export interface SavedLetter extends FormData {
  id: string;
  savedAt: string;
  vias: string[];
  references: string[];
  enclosures: string[];
  copyTos: string[];
  distList?: string[];
  paragraphs: ParagraphData[];
}

export interface AMHSReference {
  id: string;
  letter: string;
  type: string;
  docId: string;
  title: string;
}

export interface ValidationState {
  ssic: { isValid: boolean; message: string; };
  subj: { isValid: boolean; message: string; };
  from: { isValid: boolean; message: string; };
  to: { isValid: boolean; message: string; };
}

export interface SignaturePosition {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  // Metadata
  signerName?: string;
  reason?: string;
  contactInfo?: string;
}
