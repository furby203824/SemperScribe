import { DocumentTemplate } from './types';
import { MCODefinition, BulletinDefinition } from '@/lib/schemas';

export const MCOTemplate: DocumentTemplate = {
  id: 'mco-default',
  typeId: 'mco',
  name: 'Marine Corps Order',
  description: 'Permanent directive establishing policy.',
  definition: MCODefinition,
  defaultData: {
    documentType: 'mco',
    ssic: '1000',
    originatorCode: 'CODE',
    date: '10 Feb 26',
    from: 'Commanding Officer',
    to: 'Distribution List',
    subj: 'MARINE CORPS ORDER TITLE',
    
    // MCO Specifics
    orderPrefix: 'MCO',
    distribution: {
        type: 'standard',
        pcn: '10200000000',
        statementCode: 'A'
    },

    paragraphs: [
      { id: 1, level: 0, content: '1. Situation.' },
      { id: 2, level: 0, content: '2. Mission.' },
      { id: 3, level: 0, content: '3. Execution.' },
      { id: 4, level: 1, content: 'a. Commander\'s Intent.' },
      { id: 5, level: 1, content: 'b. Concept of Operations.' },
      { id: 6, level: 1, content: 'c. Tasks.' },
      { id: 7, level: 2, content: '(1) Subordinate Unit 1.' },
      { id: 8, level: 2, content: '(2) Subordinate Unit 2.' },
      { id: 9, level: 1, content: 'd. Coordinating Instructions.' },
      { id: 10, level: 0, content: '4. Administration and Logistics.' },
      { id: 11, level: 0, content: '5. Command and Signal.' }
    ],
    sig: 'I. M. MARINE',
    
    // Defaults
    vias: [], references: [], enclosures: [], copyTos: [],
    line1: '', line2: '', line3: '', endorsementLevel: '', basicLetterReference: '',
    referenceWho: '', referenceType: '', referenceDate: '', startingReferenceLevel: '',
    startingEnclosureNumber: '', startingPageNumber: 1, previousPackagePageCount: 0,
    headerType: 'USMC', bodyFont: 'times', delegationText: '', accentColor: 'black'
  }
};

export const BulletinTemplate: DocumentTemplate = {
    id: 'bulletin-default',
    typeId: 'bulletin',
    name: 'Marine Corps Bulletin',
    description: 'Directive of duration less than 12 months.',
    definition: BulletinDefinition,
    defaultData: {
      documentType: 'bulletin',
      ssic: '1000',
      originatorCode: 'CODE',
      date: '10 Feb 26',
      from: 'Commanding Officer',
      to: 'Distribution List',
      subj: 'BULLETIN TITLE',
      
      // Bulletin Specifics
      orderPrefix: 'MCBul',
      cancellationDate: '31 Dec 26',
      distribution: {
          type: 'standard',
          pcn: '10200000000'
      },
  
      paragraphs: [
        { id: 1, level: 1, content: 'Purpose.' },
        { id: 2, level: 1, content: 'Background.' },
        { id: 3, level: 1, content: 'Action.' },
        { id: 4, level: 2, content: 'First action item.' },
        { id: 5, level: 3, content: 'Detail.' },
        { id: 6, level: 1, content: 'Reserve Applicability.' },
        { id: 7, level: 1, content: 'Cancellation Contingency. This Bulletin is cancelled upon receipt.' }
      ],
      sig: 'I. M. MARINE',
      
      // Defaults
      vias: [], references: [], enclosures: [], copyTos: [],
      line1: '', line2: '', line3: '', endorsementLevel: '', basicLetterReference: '',
      referenceWho: '', referenceType: '', referenceDate: '', startingReferenceLevel: '',
      startingEnclosureNumber: '', startingPageNumber: 1, previousPackagePageCount: 0,
      headerType: 'USMC', bodyFont: 'times', delegationText: '', accentColor: 'black'
    }
  };
