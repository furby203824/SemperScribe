import { DocumentTemplate } from './types';
import { DLABusinessLetterDefinition } from '@/lib/schemas';

export const DLABusinessLetterTemplate: DocumentTemplate = {
  id: 'dla-business-letter-default',
  typeId: 'dla-business-letter',
  name: 'DLA Business Letter',
  description: 'Business letter format for DLA correspondence with non-DoD entities.',
  definition: DLABusinessLetterDefinition,
  defaultData: {
    documentType: 'dla-business-letter',
    date: 'March 5, 2026',
    recipientName: 'Mr. John Doe',
    recipientTitle: 'Vice President',
    businessName: 'Acme Corporation',
    recipientAddress: '123 Main Street\nAnytown, VA 22030',
    salutation: 'Dear Mr. Doe:',
    subj: 'BUSINESS LETTER TEMPLATE',
    complimentaryClose: 'Sincerely,',

    paragraphs: [
      {
        id: 1,
        level: 1,
        content: 'This is the first paragraph of a DLA business letter.',
        isMandatory: true,
      },
      {
        id: 2,
        level: 1,
        content: 'This is the second paragraph with additional details.',
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
