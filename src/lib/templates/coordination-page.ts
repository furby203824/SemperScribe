import { DocumentTemplate } from './types';
import { CoordinationPageDefinition } from '@/lib/schemas';

export const CoordinationPageTemplate: DocumentTemplate = {
  id: 'coordination-page-default',
  typeId: 'coordination-page',
  name: 'Coordination Page',
  description: 'Mandatory staffing table for routing packages per MCO 5216.20B, Fig 13-8.',
  definition: CoordinationPageDefinition,
  defaultData: {
    documentType: 'coordination-page',

    subj: 'CONSOLIDATION OF ADMINISTRATIVE SUPPORT FUNCTIONS ACROSS I MEF MAJOR SUBORDINATE COMMANDS',
    date: '10 Feb 26',

    // Action Officer
    actionOfficerName: 'Capt J. M. Doe',
    actionOfficerRank: 'Capt',
    actionOfficerOfficeCode: 'G-3',
    actionOfficerPhone: '(760) 555-1234',

    // Coordinating Offices
    coordinatingOffices: [
      {
        office: 'AC/S G-1',
        concurrence: 'concur',
        aoName: 'Maj R. L. Smith',
        date: '08 Feb 26',
        initials: 'RLS',
        comments: '',
      },
      {
        office: 'AC/S G-3',
        concurrence: 'concur',
        aoName: 'LtCol P. J. Adams',
        date: '09 Feb 26',
        initials: 'PJA',
        comments: '',
      },
      {
        office: 'AC/S G-4',
        concurrence: 'nonconcur',
        aoName: 'Maj T. K. Brown',
        date: '09 Feb 26',
        initials: 'TKB',
        comments: 'Nonconcur with proposed timeline. Supply chain transition requires minimum 180 days, not 90 as proposed. See attached memo.',
      },
      {
        office: 'AC/S G-8',
        concurrence: 'concur',
        aoName: 'Capt M. A. Wilson',
        date: '10 Feb 26',
        initials: 'MAW',
        comments: '',
      },
      {
        office: 'SJA',
        concurrence: 'concur',
        aoName: 'Maj H. R. Garcia',
        date: '10 Feb 26',
        initials: 'HRG',
        comments: 'No legal objection.',
      },
    ],

    remarks: 'G-4 nonconcurrence has been addressed. Proponent recommends extending Phase 2 timeline from 90 to 180 days to accommodate supply chain transition requirements.',

    // Standard defaults (unused by this type but required by template interface)
    ssic: '',
    originatorCode: '',
    from: '',
    to: '',
    sig: '',
    vias: [],
    references: [],
    enclosures: [],
    copyTos: [],
    paragraphs: [],
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
