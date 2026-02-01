import { ParagraphData } from './index';

export interface Navmc10274Data {
  actionNo: string;
  ssic: string;
  date: string;
  from: string;
  orgStation: string;
  to: string;
  via: string;
  subject: string;
  reference: string;
  enclosure: string;
  supplementalInfo: string;
  supplementalInfoParagraphs?: ParagraphData[];
  copyTo: string;
  signature?: string;
  classification?: string;
  // Metadata for internal use
  isDraft?: boolean;
}

export interface Navmc11811Data {
  name: string;
  edipi: string;
  remarksLeft?: string;
  remarksRight?: string;
  // Fallback for single remarks string if needed, but prefer left/right split
  remarks?: string;
}

export interface BoxBoundary {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const NAVMC_10274_FIELDS: (keyof Navmc10274Data)[] = [
  "actionNo",
  "ssic",
  "date",
  "from",
  "orgStation",
  "to",
  "via",
  "subject",
  "reference",
  "enclosure",
  "supplementalInfo",
  "copyTo",
];
