import { DocumentTemplate } from './types';
import { AAFormDefinition } from '@/lib/schemas';

export const AAFormTemplate: DocumentTemplate = {
  id: 'aa-form-default',
  typeId: 'aa-form',
  name: 'NAVMC 10274 (AA Form)',
  description: 'Administrative Action Form used for personnel requests.',
  definition: AAFormDefinition,
  defaultData: {
    documentType: 'aa-form',
    
    // AA Form Specifics
    actionNo: '',
    orgStation: 'Unit Name\nAddress\nCity, State Zip',
    
    // Standard Fields
    from: 'Rank First MI Last, EDIPI/MOS, USMC',
    to: 'Commanding General, Higher Headquarters',
    subj: 'REQUEST FOR ADMINISTRATIVE ACTION',
    date: '10 Feb 26',
    
    // Body (Block 12)
    paragraphs: [
      {
        id: 1,
        level: 1,
        content: 'It is requested that...',
        isMandatory: true
      }
    ],

    // Footer
    sig: 'I. M. MARINE',
    
    // Arrays
    vias: [], // "Via" lines
    references: [],
    enclosures: [],
    copyTos: [],
    
    // Defaults
    ssic: '5216', // Default SSIC for AA forms often used
    originatorCode: '',
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
