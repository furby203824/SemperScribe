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

export interface DistributionData {
  type: 'none' | 'standard' | 'pcn' | 'pcn-with-copy';
  pcn?: string;
  copyTo?: Array<{ code: string; qty: number }>;
  statementCode?: string;
  statementReason?: string;
  statementDate?: string;
  statementAuthority?: string;
}

export interface FormData {
  documentType: 'basic' | 'endorsement' | 'aa-form' | 'mco' | 'bulletin' | 'page11';
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
  cancellationDate?: string;
  cancellationType?: 'contingent' | 'fixed';
  distribution?: DistributionData;
  reports?: ReportData[];
  
  // Page 11 specific fields
  name?: string;
  edipi?: string;
  remarksLeft?: string;
  remarksRight?: string;
}

export interface SavedLetter extends FormData {
  id: string;
  savedAt: string;
  vias: string[];
  references: string[];
  enclosures: string[];
  copyTos: string[];
  paragraphs: ParagraphData[];
}

export interface ValidationState {
  ssic: { isValid: boolean; message: string; };
  subj: { isValid: boolean; message: string; };
  from: { isValid: boolean; message: string; };
  to: { isValid: boolean; message: string; };
}
