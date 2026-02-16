import { DocumentTemplate } from './types';
import { BusinessLetterDefinition } from '@/lib/schemas';

export const BusinessLetterTemplate: DocumentTemplate = {
  id: 'business-letter-default',
  typeId: 'business-letter',
  name: 'Business Letter',
  description: 'Correspondence with non-DoD entities, agencies, or individuals.',
  definition: BusinessLetterDefinition,
  defaultData: {
    documentType: 'business-letter',
    // Header
    ssic: '1000',
    originatorCode: 'CODE',
    date: 'February 10, 2026', // Business letters use full dates
    
    // Business Letter Specifics
    recipientName: 'Mr. John Doe',
    recipientTitle: 'Director of Operations',
    businessName: 'Acme Corporation',
    recipientAddress: '123 Business Blvd\nCity, State 12345',
    salutation: 'Dear Mr. Doe:',
    complimentaryClose: 'Sincerely,',
    
    subj: 'BUSINESS LETTER TEMPLATE', // Optional in Business Letter, but good practice
    
    // Footer
    sig: 'I. M. MARINE',
    signerRank: 'Colonel',
    signerTitle: 'Commanding Officer',
    
    // Toggles
    isWindowEnvelope: false,
    isShortLetter: false,
    isVipMode: false,
    
    // Body
    paragraphs: [
      {
        id: 1,
        level: 1,
        content: 'This is the first paragraph of a business letter. Unlike naval letters, paragraphs are typically not numbered.',
        isMandatory: true
      },
      {
        id: 2,
        level: 1,
        content: 'This is the second paragraph. However, if the letter is complex, you may use an outline format.',
      },
      {
        id: 3,
        level: 2,
        content: 'This is a sub-paragraph (a).',
      },
      {
        id: 4,
        level: 3,
        content: 'This is a sub-sub-paragraph (1).',
      },
      {
        id: 5,
        level: 4,
        content: 'This is a sub-sub-sub-paragraph (a).',
      },
      {
        id: 6,
        level: 5,
        content: 'This is the fifth level <u>1</u>.',
      },
      {
        id: 7,
        level: 6,
        content: 'This is the sixth level <u>a</u>.',
      },
      {
        id: 8,
        level: 7,
        content: 'This is the seventh level (<u>1</u>).',
      },
      {
        id: 9,
        level: 8,
        content: 'This is the eighth level (<u>a</u>).',
      }
    ],

    // Unused/Defaults
    from: '', // Not used in Business Letter header block
    to: '', // Not used
    vias: [],
    references: [],
    enclosures: [],
    copyTos: [],
    line1: '',
    line2: '',
    line3: '',
    endorsementLevel: '',
    basicLetterReference: '',
    referenceWho: '',
    referenceType: '',
    referenceDate: '',
    startingReferenceLevel: '',
    startingEnclosureNumber: '',
    startingPageNumber: 1,
    previousPackagePageCount: 0,
    headerType: 'USMC',
    bodyFont: 'times',
    delegationText: '',
    accentColor: 'black'
  },
  formatting: {
    dateStyle: 'civilian',
    subjectCase: 'uppercase', // Can be title case, but typically uppercase
    font: 'Times New Roman'
  }
};
