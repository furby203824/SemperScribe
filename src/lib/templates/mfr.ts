import { DocumentTemplate } from './types';
import { MFRDefinition } from '@/lib/schemas';

export const MFRTemplate: DocumentTemplate = {
  id: 'mfr-default',
  typeId: 'mfr',
  name: 'Memorandum for the Record',
  description: 'Internal document used to record events, decisions, or conversations.',
  definition: MFRDefinition,
  defaultData: {
    documentType: 'mfr',
    
    // Header (Simplified)
    date: '10 Feb 26',
    ssic: '1000', // Optional but common
    originatorCode: 'CODE', // Optional
    subj: 'MEMORANDUM FOR THE RECORD TEMPLATE',
    
    // Body
    paragraphs: [
      {
        id: 1,
        level: 1,
        content: 'Purpose. To record the events of the meeting held on...',
        isMandatory: true
      },
      {
        id: 2,
        level: 1,
        content: 'Discussion. The following points were discussed...'
      },
      {
        id: 3,
        level: 2,
        content: 'First point discussed.'
      },
      {
        id: 4,
        level: 2,
        content: 'Second point discussed.'
      },
      {
        id: 5,
        level: 3,
        content: 'Detail about the second point.'
      }
    ],

    // Footer
    sig: 'I. M. MARINE', // Signer
    
    // Unused/Defaults
    from: '', // Not used
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
    dateStyle: 'standard',
    subjectCase: 'uppercase',
    font: 'Times New Roman'
  }
};
