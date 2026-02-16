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
    ssic: '5210',
    originatorCode: 'AR',
    date: '10 Feb 26',
    from: 'Commandant of the Marine Corps',
    to: 'Distribution List',
    subj: 'MARINE CORPS RECORDS MANAGEMENT PROGRAM',

    // MCO Specifics
    orderPrefix: 'MCO',
    directiveTitle: 'MCO 5210.11G',
    distribution: {
        type: 'pcn-with-copy',
        pcn: '10200150000',
        statementCode: 'A',
        statementReason: 'administrative/operational use',
        statementDate: '10 Feb 26',
        statementAuthority: 'CMC (AR)',
        copyTo: [
          { code: '8145001', qty: 1 },
          { code: '0320001', qty: 2 }
        ]
    },

    // Reports
    reports: [
      {
        id: 'rpt-1',
        title: 'Annual Records Management Assessment',
        controlSymbol: 'MCO 5210.11G-01',
        paragraphRef: '4.b.(2)',
        exempt: false
      },
      {
        id: 'rpt-2',
        title: 'Records Disposition Schedule Update',
        controlSymbol: 'MCO 5210.11G-02',
        paragraphRef: '4.c.',
        exempt: false
      }
    ],

    // Admin Subsections
    adminSubsections: {
      recordsManagement: {
        show: true,
        content: 'Records created by this Order shall be managed per SECNAV M-5210.1 and disposed of per reference (b).',
        order: 1
      },
      privacyAct: {
        show: true,
        content: 'Any misuse or unauthorized disclosure of PII may result in criminal and civil penalties.',
        order: 2
      },
      reportsRequired: {
        show: true,
        content: 'Reports required by this Order are listed in enclosure (3).',
        order: 3
      }
    },

    paragraphs: [
      { id: 1, level: 0, content: '1. Situation. The Marine Corps requires a comprehensive records management program to ensure compliance with federal law and DoD policy.' },
      { id: 2, level: 1, content: 'a. The current records management program requires updating to align with recent changes in federal regulations and DoD directives.' },
      { id: 3, level: 1, content: 'b. This Order cancels MCO 5210.11F.' },
      { id: 4, level: 0, content: '2. Cancellation. MCO 5210.11F.' },
      { id: 5, level: 0, content: '3. Mission. Establish policy and procedures for the Marine Corps Records Management Program.' },
      { id: 6, level: 0, content: '4. Execution.' },
      { id: 7, level: 1, content: 'a. Commander\'s Intent. Ensure all Marine Corps organizations maintain records in accordance with federal law and DoD policy.' },
      { id: 8, level: 1, content: 'b. Concept of Operations. Commands at all levels will designate a Records Manager responsible for program implementation.' },
      { id: 9, level: 2, content: '(1) Each command will conduct an annual records management assessment.' },
      { id: 10, level: 2, content: '(2) Results will be reported to CMC (AR) NLT 31 October annually.' },
      { id: 11, level: 1, content: 'c. Tasks.' },
      { id: 12, level: 2, content: '(1) CMC (AR) will serve as the Marine Corps Records Manager and provide program oversight.' },
      { id: 13, level: 2, content: '(2) Commanding Generals and Commanding Officers will appoint command Records Managers in writing.' },
      { id: 14, level: 1, content: 'd. Coordinating Instructions. All commands will complete initial compliance review within 180 days of the effective date of this Order.' },
      { id: 15, level: 0, content: '5. Administration and Logistics.' },
      { id: 16, level: 1, content: 'a. Training requirements will be coordinated through TECOM.' },
      { id: 17, level: 0, content: '6. Command and Signal. This Order is applicable to the Marine Corps Total Force.' }
    ],
    sig: 'I. M. MARINE',
    delegationText: 'By direction',

    // Arrays
    vias: [],
    references: [
      '(a) Title 44, United States Code',
      '(b) SECNAV M-5210.1',
      '(c) DoD Directive 5015.2',
      '(d) SECNAVINST 5210.8E'
    ],
    enclosures: [
      '(1) Definitions',
      '(2) Records Retention Schedule',
      '(3) Required Reports'
    ],
    copyTos: [],
    line1: '', line2: '', line3: '', endorsementLevel: '', basicLetterReference: '',
    referenceWho: '', referenceType: '', referenceDate: '', startingReferenceLevel: '',
    startingEnclosureNumber: '', startingPageNumber: 1, previousPackagePageCount: 0,
    headerType: 'USMC', bodyFont: 'times', accentColor: 'black'
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
      ssic: '1500',
      originatorCode: 'TRNG',
      date: '10 Feb 26',
      from: 'Commandant of the Marine Corps',
      to: 'Distribution List',
      subj: 'ANNUAL RIFLE AND PISTOL MARKSMANSHIP REQUALIFICATION REQUIREMENTS FOR FISCAL YEAR 2026',

      // Bulletin Specifics
      orderPrefix: 'MCBul',
      cancellationDate: '31 Dec 26',
      cancellationType: 'fixed',
      cancellationContingency: 'This bulletin is cancelled upon completion of the FY26 requalification cycle or 31 Dec 26, whichever occurs first.',
      distribution: {
          type: 'pcn',
          pcn: '10200220000',
          statementCode: 'A',
          statementReason: 'administrative/operational use',
          statementDate: '10 Feb 26',
          statementAuthority: 'CMC (TRNG)'
      },

      // Reports
      reports: [
        {
          id: 'rpt-1',
          title: 'Quarterly Marksmanship Requalification Progress Report',
          controlSymbol: 'MCBul 1500-01',
          paragraphRef: '3.b.',
          exempt: false
        }
      ],

      // Admin Subsections
      adminSubsections: {
        recordsManagement: {
          show: true,
          content: 'Records created by this Bulletin shall be managed per SECNAV M-5210.1.',
          order: 1
        },
        privacyAct: {
          show: false,
          content: '',
          order: 2
        },
        reportsRequired: {
          show: true,
          content: 'Quarterly progress reports are required per paragraph 3.b.',
          order: 3
        }
      },

      paragraphs: [
        { id: 1, level: 1, content: 'Purpose. To establish the annual requalification requirements and timeline for rifle and pistol marksmanship for FY26.' },
        { id: 2, level: 1, content: 'Background. Per reference (a), all Marines are required to maintain marksmanship proficiency through annual requalification.' },
        { id: 3, level: 1, content: 'Action. Commanding Officers will ensure the following actions are completed.' },
        { id: 4, level: 2, content: 'All Marines will complete rifle requalification NLT 30 Sep 26.' },
        { id: 5, level: 2, content: 'Marines in designated billets will complete pistol requalification NLT 30 Sep 26.' },
        { id: 6, level: 3, content: 'Pistol qualification is mandatory for officers, SNCOs, and Marines in designated MOSs per reference (b).' },
        { id: 7, level: 1, content: 'Reserve Applicability. This Bulletin applies to all Reserve component Marines. Reserve units will coordinate range time through their respective I-I staffs.' },
        { id: 8, level: 1, content: 'Cancellation Contingency. This Bulletin is cancelled upon completion of the FY26 requalification cycle or 31 Dec 26, whichever occurs first.' }
      ],
      sig: 'I. M. MARINE',
      delegationText: 'By direction',

      // Arrays
      vias: [],
      references: [
        '(a) MCO 3574.2L',
        '(b) MCO 8010.13A',
        '(c) MARADMIN 045/26'
      ],
      enclosures: [
        '(1) FY26 Requalification Timeline',
        '(2) Range Scheduling POC List'
      ],
      copyTos: [],
      line1: '', line2: '', line3: '', endorsementLevel: '', basicLetterReference: '',
      referenceWho: '', referenceType: '', referenceDate: '', startingReferenceLevel: '',
      startingEnclosureNumber: '', startingPageNumber: 1, previousPackagePageCount: 0,
      headerType: 'USMC', bodyFont: 'times', accentColor: 'black'
    }
  };
