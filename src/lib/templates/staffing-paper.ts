import { DocumentTemplate } from './types';
import { PositionPaperDefinition, InformationPaperDefinition } from '@/lib/schemas';

export const PositionPaperTemplate: DocumentTemplate = {
  id: 'position-paper-default',
  typeId: 'position-paper',
  name: 'Position/Decision Paper',
  description: 'Used to advocate for a specific position or decision.',
  definition: PositionPaperDefinition,
  defaultData: {
    documentType: 'position-paper',
    
    subj: 'POSITION PAPER ON TOPIC',
    date: '10 Feb 26',
    classification: 'UNCLASSIFIED',
    
    // Drafter Info
    drafterName: 'Capt J. M. Doe',
    drafterRank: 'Capt',
    drafterOfficeCode: 'G-3',
    drafterPhone: '555-1234',
    drafterService: 'USMC',
    drafterAgency: 'Unit',
    
    // Approver Info (Required for Position Paper)
    approverName: 'Col I. M. Boss',
    approverRank: 'Col',
    approverOfficeCode: 'G-3',
    approverPhone: '555-5678',

    // Body
    paragraphs: [
      {
        id: 1,
        level: 0,
        content: '1. BLUF. Bottom Line Up Front...',
        title: 'BLUF'
      },
      {
        id: 2,
        level: 0,
        content: '2. Background. Context of the issue...',
        title: 'Background'
      },
      {
        id: 3,
        level: 0,
        content: '3. Discussion. Detailed analysis...',
        title: 'Discussion'
      },
      {
        id: 4,
        level: 1,
        content: 'a. Analysis point 1.',
      },
      {
        id: 5,
        level: 2,
        content: '(1) Detail.',
      },
      {
        id: 6,
        level: 0,
        content: '4. Recommendation. Specific action to take...',
        title: 'Recommendation'
      }
    ],

    // Decision Grid Default
    decisionMode: 'SINGLE',
    decisionGrid: {
        recommenders: [],
        finalDecision: {
            role: 'Commander',
            options: ['Approve', 'Disapprove', 'Modify']
        }
    },

    // Defaults
    ssic: '',
    originatorCode: '',
    from: '',
    to: '',
    sig: '',
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

export const InformationPaperTemplate: DocumentTemplate = {
    id: 'information-paper-default',
    typeId: 'information-paper',
    name: 'Information Paper',
    description: 'Provides factual information in concise terms.',
    definition: InformationPaperDefinition,
    defaultData: {
      documentType: 'information-paper',
      
      subj: 'INFORMATION PAPER ON TOPIC',
      date: '10 Feb 26',
      classification: 'UNCLASSIFIED',
      
      // Drafter Info
      drafterName: 'Capt J. M. Doe',
      drafterRank: 'Capt',
      drafterOfficeCode: 'G-3',
      drafterPhone: '555-1234',
      drafterService: 'USMC',
      drafterAgency: 'Unit',
      
      // Body
      paragraphs: [
        {
          id: 1,
          level: 1,
          content: 'Purpose. To provide information regarding...',
          title: 'Purpose'
        },
        {
          id: 2,
          level: 1,
          content: 'Key Points. Bulletized list of facts...',
          title: 'Key Points'
        },
        {
          id: 3,
          level: 2,
          content: 'First fact.',
        },
        {
          id: 4,
          level: 2,
          content: 'Second fact.',
        },
        {
          id: 5,
          level: 3,
          content: 'Detail.',
        }
      ],
  
      // Defaults
      ssic: '',
      originatorCode: '',
      from: '',
      to: '',
      sig: '',
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
