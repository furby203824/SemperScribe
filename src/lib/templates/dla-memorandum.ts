import { DocumentTemplate } from './types';
import { DLAMemorandumDefinition } from '@/lib/schemas';

export const DLAMemorandumTemplate: DocumentTemplate = {
  id: 'dla-memorandum-default',
  typeId: 'dla-memorandum',
  name: 'DLA Standard Memorandum',
  description: 'Standard memorandum format per DLA Correspondence Manual (2011).',
  definition: DLAMemorandumDefinition,
  defaultData: {
    documentType: 'dla-memorandum',
    date: 'March 5, 2026',
    memorandumFor: 'Director, Defense Logistics Agency',
    through: '',
    suspenseDate: '',
    fouoDesignation: '',
    subj: 'STANDARD MEMORANDUM TEMPLATE',

    paragraphs: [
      {
        id: 1,
        level: 1,
        content: 'This is the first paragraph of a DLA standard memorandum.',
        isMandatory: true,
      },
      {
        id: 2,
        level: 1,
        content: 'This is the second paragraph. It introduces sub-paragraphs.',
      },
      {
        id: 3,
        level: 2,
        content: 'This is a sub-paragraph (a).',
      },
    ],

    signerFullName: 'JOHN M. HANCOCK',
    delegationText: '',

    vias: [],
    references: [],
    enclosures: [],
    copyTos: [],

    line1: '',
    line2: '',
    line3: '',
    headerType: 'DLA',
    bodyFont: 'times',
    accentColor: 'black',
  },
  formatting: {
    dateStyle: 'civilian',
    subjectCase: 'uppercase',
    font: 'Times New Roman',
  },
};
