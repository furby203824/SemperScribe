import { DocumentTemplate } from './types';
import { 
  FromToMemoDefinition, 
  LetterheadMemoDefinition, 
  MOADefinition, 
  MOUDefinition 
} from '@/lib/schemas';

export const FromToMemoTemplate: DocumentTemplate = {
  id: 'from-to-memo-default',
  typeId: 'from-to-memo',
  name: 'From-To Memorandum',
  description: 'Informal internal correspondence.',
  definition: FromToMemoDefinition,
  defaultData: {
    documentType: 'from-to-memo',
    date: '10 Feb 26',
    from: 'Rank Name',
    to: 'Recipient',
    subj: 'FROM-TO MEMO SUBJECT',
    paragraphs: [
      { id: 1, level: 0, content: '1. Just a quick note.' },
      { id: 2, level: 0, content: '2. Another point.' },
      { id: 3, level: 1, content: 'a. Sub-point.' }
    ],
    // Defaults
    ssic: '', originatorCode: '', sig: '', vias: [], references: [], enclosures: [], copyTos: [],
    line1: '', line2: '', line3: '', endorsementLevel: '', basicLetterReference: '',
    referenceWho: '', referenceType: '', referenceDate: '', startingReferenceLevel: '',
    startingEnclosureNumber: '', startingPageNumber: 1, previousPackagePageCount: 0,
    headerType: 'USMC', bodyFont: 'times', delegationText: '', accentColor: 'black'
  }
};

export const LetterheadMemoTemplate: DocumentTemplate = {
  id: 'letterhead-memo-default',
  typeId: 'letterhead-memo',
  name: 'Letterhead Memorandum',
  description: 'Formal memorandum on command letterhead.',
  definition: LetterheadMemoDefinition,
  defaultData: {
    documentType: 'letterhead-memo',
    ssic: '1000',
    originatorCode: 'CODE',
    date: '10 Feb 26',
    from: 'Commanding Officer',
    to: 'Distribution List',
    subj: 'LETTERHEAD MEMO SUBJECT',
    paragraphs: [
      { id: 1, level: 0, content: '1. This is a formal memo.' },
      { id: 2, level: 0, content: '2. Additional details.' },
      { id: 3, level: 1, content: 'a. Sub-paragraph.' },
      { id: 4, level: 2, content: '(1) Sub-sub-paragraph.' }
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

export const MOATemplate: DocumentTemplate = {
    id: 'moa-default',
    typeId: 'moa',
    name: 'Memorandum of Agreement',
    description: 'Agreement between parties (Conditional).',
    definition: MOADefinition,
    defaultData: {
      documentType: 'moa',
      subj: 'MEMORANDUM OF AGREEMENT BETWEEN ACTIVITY A AND ACTIVITY B',
      date: '10 Feb 26',
      moaData: {
          activityA: 'Senior Activity',
          activityB: 'Junior Activity',
          seniorSigner: { name: 'Name', title: 'Title', activity: 'Activity A' },
          juniorSigner: { name: 'Name', title: 'Title', activity: 'Activity B' }
      },
      paragraphs: [
        { id: 1, level: 1, content: 'Purpose.' },
        { id: 2, level: 1, content: 'Problem.' },
        { id: 3, level: 1, content: 'Scope.' },
        { id: 4, level: 1, content: 'Agreement.' },
      ],
      // Defaults
      ssic: '', originatorCode: '', from: '', to: '', sig: '', vias: [], references: [], enclosures: [], copyTos: [],
      line1: '', line2: '', line3: '', endorsementLevel: '', basicLetterReference: '',
      referenceWho: '', referenceType: '', referenceDate: '', startingReferenceLevel: '',
      startingEnclosureNumber: '', startingPageNumber: 1, previousPackagePageCount: 0,
      headerType: 'USMC', bodyFont: 'times', delegationText: '', accentColor: 'black'
    }
  };

  export const MOUTemplate: DocumentTemplate = {
    id: 'mou-default',
    typeId: 'mou',
    name: 'Memorandum of Understanding',
    description: 'General understanding between parties (Non-binding).',
    definition: MOUDefinition,
    defaultData: {
      documentType: 'mou',
      subj: 'MEMORANDUM OF UNDERSTANDING BETWEEN ACTIVITY A AND ACTIVITY B',
      date: '10 Feb 26',
      moaData: {
          activityA: 'Senior Activity',
          activityB: 'Junior Activity',
          seniorSigner: { name: 'Name', title: 'Title', activity: 'Activity A' },
          juniorSigner: { name: 'Name', title: 'Title', activity: 'Activity B' }
      },
      paragraphs: [
        { id: 1, level: 0, content: '1. Purpose.' },
        { id: 2, level: 0, content: '2. Problem.' },
        { id: 3, level: 0, content: '3. Scope.' },
        { id: 4, level: 0, content: '4. Understanding.' },
      ],
      // Defaults
      ssic: '', originatorCode: '', from: '', to: '', sig: '', vias: [], references: [], enclosures: [], copyTos: [],
      line1: '', line2: '', line3: '', endorsementLevel: '', basicLetterReference: '',
      referenceWho: '', referenceType: '', referenceDate: '', startingReferenceLevel: '',
      startingEnclosureNumber: '', startingPageNumber: 1, previousPackagePageCount: 0,
      headerType: 'USMC', bodyFont: 'times', delegationText: '', accentColor: 'black'
    }
  };
