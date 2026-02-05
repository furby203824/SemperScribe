import { z } from 'zod';

// --- UI Schema Definitions ---

export type ControlType = 
  | 'text' 
  | 'textarea' 
  | 'date' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'combobox'
  | 'number'
  | 'hidden'; // For fields that are present in data but not shown

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: ControlType;
  placeholder?: string;
  description?: string;
  options?: FieldOption[];
  defaultValue?: any;
  className?: string; // Layout hints (e.g., 'col-span-1', 'md:col-span-2')
  rows?: number; // For textareas
  required?: boolean;
  
  // Dynamic behavior
  condition?: (formData: any) => boolean; 
}

export interface SectionDefinition {
  id: string;
  title: string;
  description?: string;
  fields: FieldDefinition[];
  className?: string; // Optional override for the grid layout (e.g. "grid-cols-1")
}

export interface DocumentTypeDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string; // Emoji or icon name
  sections: SectionDefinition[];
  schema: z.ZodObject<any>; // Zod validation schema
}

// --- Validation Helpers ---

const ssicRegex = /^[0-9]{4,5}$/;
const dateRegex = /^(?:[0-9]{1,2} [A-Z][a-z]{2} [0-9]{2}|today)$/; // Simple validation for "DD Mmm YY" or "today"

// --- Document Type Schemas ---

// 1. Basic Letter
export const BasicLetterSchema = z.object({
  ssic: z.string().min(4, "SSIC must be at least 4 digits").max(5),
  originatorCode: z.string().min(1, "Originator Code is required"),
  date: z.string().min(1, "Date is required"),
  from: z.string().min(1, "From line is required"),
  to: z.string().min(1, "To line is required"),
  subj: z.string().min(1, "Subject is required").transform(val => val.toUpperCase()),
  documentType: z.literal('basic'),
});

export const BasicLetterDefinition: DocumentTypeDefinition = {
  id: 'basic',
  name: 'Basic Letter',
  description: 'Standard format for routine correspondence and official communications.',
  icon: '📄',
  schema: BasicLetterSchema,
  sections: [
    {
      id: 'header',
      title: 'Header Information',
      fields: [
        {
          name: 'ssic',
          label: 'SSIC',
          type: 'combobox', // In reality, this needs a data source. For now, we simulate.
          placeholder: 'Search SSIC...',
          required: true,
          className: 'md:col-span-1'
        },
        {
          name: 'originatorCode',
          label: 'Originator Code',
          type: 'text',
          placeholder: 'e.g., G-1',
          required: true,
          className: 'md:col-span-1'
        },
        {
          name: 'date',
          label: 'Date',
          type: 'date',
          placeholder: 'DD Mmm YY',
          required: true,
          className: 'md:col-span-1'
        },
        {
          name: 'from',
          label: 'From',
          type: 'text',
          placeholder: 'Commanding Officer...',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'to',
          label: 'To',
          type: 'text',
          placeholder: 'Commanding Officer...',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'subj',
          label: 'Subject',
          type: 'text',
          placeholder: 'SUBJECT LINE (ALL CAPS)',
          required: true,
          className: 'col-span-full'
        }
      ]
    }
  ]
};

// 2. Multiple-Address Letter
export const MultipleAddressLetterSchema = BasicLetterSchema.extend({
  documentType: z.literal('multiple-address'),
  to: z.string().optional(), // 'to' is optional because we use distribution.recipients
});

export const MultipleAddressLetterDefinition: DocumentTypeDefinition = {
  id: 'multiple-address',
  name: 'Multiple-Address Letter',
  description: 'Letter addressed to two or more commands/activities.',
  icon: '📨',
  schema: MultipleAddressLetterSchema,
  sections: [
    {
      id: 'header',
      title: 'Header Information',
      fields: [
        // Exclude 'to' because we handle it with a custom section
        ...BasicLetterDefinition.sections[0].fields.filter(f => f.name !== 'to')
      ]
    }
  ]
};

// 3. Endorsement
export const EndorsementSchema = BasicLetterSchema.extend({
  documentType: z.literal('endorsement'),
  endorsementLevel: z.enum(['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH', 'SIXTH', 'SEVENTH', 'EIGHTH', 'NINTH', 'TENTH', '']),
  basicLetterReference: z.string().optional(),
  basicLetterSsic: z.string().optional(),
  referenceWho: z.string().optional(),
  referenceType: z.string().optional(),
  referenceDate: z.string().optional(),
  startingReferenceLevel: z.string().optional(),
  startingEnclosureNumber: z.string().optional(),
  startingPageNumber: z.number().optional(),
  previousPackagePageCount: z.number().optional(),
});

export const EndorsementDefinition: DocumentTypeDefinition = {
  id: 'endorsement',
  name: 'New-Page Endorsement',
  description: 'Forwards correspondence on a new page.',
  icon: '📝',
  schema: EndorsementSchema,
  sections: [
    // Endorsement-specific fields are handled in page.tsx custom section
    // Only include basic letter sections here
    ...BasicLetterDefinition.sections
  ]
};

// 3. AA Form (NAVMC 10274)
export const AAFormSchema = z.object({
  documentType: z.literal('aa-form'),
  actionNo: z.string().optional(),
  orgStation: z.string().optional(),
  from: z.string().min(1, "From is required"),
  to: z.string().min(1, "To is required"),
  subj: z.string().min(1, "Subject is required"),
  date: z.string().min(1, "Date is required"),
});

export const AAFormDefinition: DocumentTypeDefinition = {
  id: 'aa-form',
  name: 'NAVMC 10274 (AA Form)',
  description: 'Administrative Action Form for personnel requests.',
  icon: '📋',
  schema: AAFormSchema,
  sections: [
    {
      id: 'aa-header',
      title: 'AA Form Details',
      fields: [
        {
          name: 'actionNo',
          label: 'Action No',
          type: 'text',
          placeholder: '12345',
          className: 'md:col-span-1'
        },
        {
          name: 'orgStation',
          label: 'Organization/Station',
          type: 'textarea',
          placeholder: 'Unit Name\nAddress...',
          className: 'md:col-span-1'
        },
        {
          name: 'from',
          label: 'From (Grade, Name, EDIPI, MOS)',
          type: 'text',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'to',
          label: 'To',
          type: 'text',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'subj',
          label: 'Subject',
          type: 'text',
          required: true,
          className: 'col-span-full'
        },
         {
          name: 'date',
          label: 'Date',
          type: 'date',
          required: true,
          className: 'md:col-span-1'
        }
      ]
    }
  ]
};


// 4. Marine Corps Order (MCO)
export const MCOSchema = BasicLetterSchema.extend({
  documentType: z.literal('mco'),
  distribution: z.object({
    type: z.string().optional(),
    pcn: z.string().optional(),
    copyTo: z.array(z.object({
        code: z.string(),
        qty: z.number()
    })).optional(),
    // Distribution Statement fields (per DoD 5230.24)
    statementCode: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'X', '']).optional(),
    statementReason: z.string().optional(),
    statementDate: z.string().optional(),
    statementAuthority: z.string().optional(),
  }).optional(),
});

export const MCODefinition: DocumentTypeDefinition = {
  id: 'mco',
  name: 'Marine Corps Order',
  description: 'Permanent directives that establish policy or procedures.',
  icon: '📜',
  schema: MCOSchema,
  sections: [
    {
      id: 'header',
      title: 'Order Information',
      fields: [
         // MCOs use standard letter fields but "To" is usually fixed
         ...BasicLetterDefinition.sections[0].fields.map(f => 
           f.name === 'to' ? { ...f, defaultValue: 'Distribution List', placeholder: 'Distribution List' } : f
         ),
         {
           name: 'distribution.pcn',
           label: 'PCN (Publication Control Number)',
           type: 'text',
           placeholder: 'e.g. 10200000000',
           className: 'md:col-span-1'
         }
      ]
    }
  ]
};

// 5. Marine Corps Bulletin (MCBul)
export const BulletinSchema = BasicLetterSchema.extend({
  documentType: z.literal('bulletin'),
  cancellationDate: z.string().min(1, "Cancellation Date is required"),
  cancellationType: z.enum(['fixed', 'contingent']).optional(),
});

export const BulletinDefinition: DocumentTypeDefinition = {
  id: 'bulletin',
  name: 'Marine Corps Bulletin',
  description: 'Directives of a temporary nature (expire after 12 months).',
  icon: '📢',
  schema: BulletinSchema,
  sections: [
    {
      id: 'header',
      title: 'Bulletin Information',
      fields: [
        ...BasicLetterDefinition.sections[0].fields.map(f => 
            f.name === 'to' ? { ...f, defaultValue: 'Distribution List', placeholder: 'Distribution List' } : f
        ),
        {
          name: 'cancellationDate',
          label: 'Cancellation Date',
          type: 'date',
          required: true,
          className: 'md:col-span-1',
          description: 'Usually 12 months from issue date'
        },
        {
          name: 'cancellationType',
          label: 'Cancellation Type',
          type: 'select',
          options: [
            { label: 'Fixed Date', value: 'fixed' },
            { label: 'Contingent (Action Complete)', value: 'contingent' }
          ],
          defaultValue: 'fixed',
          className: 'md:col-span-1'
        }
      ]
    }
  ]
};

// 6. Page 11 (NAVMC 118(11))
export const Page11Schema = z.object({
  documentType: z.literal('page11'),
  name: z.string().min(1, "Name is required"),
  edipi: z.string().min(1, "DOD ID / EDIPI is required"),
  remarksLeft: z.string().optional(),
  remarksRight: z.string().optional(),
});

export const Page11Definition: DocumentTypeDefinition = {
  id: 'page11',
  name: 'NAVMC 118(11) (Page 11)',
  description: 'Administrative Remarks for service record entries.',
  icon: '🗂️',
  schema: Page11Schema,
  sections: [
    {
      id: 'header',
      title: 'Page 11 Details',
      fields: [
        {
          name: 'name',
          label: 'Name (LAST, FIRST MI)',
          type: 'text',
          placeholder: 'DOE, JOHN A',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'edipi',
          label: 'DOD ID / EDIPI',
          type: 'text',
          placeholder: '1234567890',
          required: true,
          className: 'md:col-span-1'
        }
      ]
    },
    {
      id: 'remarks',
      title: 'Remarks',
      fields: [
        {
          name: 'remarksLeft',
          label: 'Left Column Content',
          type: 'textarea',
          placeholder: 'Enter dates or entry headers...',
          className: 'md:col-span-1 font-mono',
          rows: 20
        },
        {
          name: 'remarksRight',
          label: 'Right Column Content',
          type: 'textarea',
          placeholder: 'Enter remarks text...',
          className: 'md:col-span-1 font-mono',
          rows: 20
        }
      ]
    }
  ]
};

// 7. AMHS Message
export const AMHSSchema = z.object({
  documentType: z.literal('amhs'),
  amhsMessageType: z.enum(['GENADMIN', 'MARADMIN', 'ALMAR']),
  amhsClassification: z.enum(['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET']),
  amhsPrecedence: z.enum(['ROUTINE', 'PRIORITY', 'IMMEDIATE', 'FLASH']),
  amhsDtg: z.string().optional(), // Auto-generated, handled separately
  amhsOfficeCode: z.string().optional(),
  originatorCode: z.string().min(1, "Originator (FROM) is required"), // Reusing originatorCode for "FROM" field
  subj: z.string().min(1, "Subject is required"),
  amhsPocs: z.array(z.string()).optional(),
});

export const AMHSDefinition: DocumentTypeDefinition = {
  id: 'amhs',
  name: 'AMHS Message',
  description: 'Automated Message Handling System (GENADMIN/MARADMIN)',
  icon: '📡',
  schema: AMHSSchema,
  sections: [
    {
      id: 'classification',
      title: 'Message Type & Classification',
      fields: [
        {
          name: 'amhsMessageType',
          label: 'Message Type',
          type: 'select',
          options: [
            { label: 'GENADMIN', value: 'GENADMIN' },
            { label: 'MARADMIN', value: 'MARADMIN' },
            { label: 'ALMAR', value: 'ALMAR' }
          ],
          defaultValue: 'GENADMIN',
          className: 'md:col-span-1'
        },
        {
          name: 'amhsClassification',
          label: 'Classification',
          type: 'select',
          options: [
            { label: 'UNCLASSIFIED', value: 'UNCLASSIFIED' },
            { label: 'CONFIDENTIAL', value: 'CONFIDENTIAL' },
            { label: 'SECRET', value: 'SECRET' },
            { label: 'TOP SECRET', value: 'TOP SECRET' }
          ],
          defaultValue: 'UNCLASSIFIED',
          className: 'md:col-span-1'
        },
        {
          name: 'amhsPrecedence',
          label: 'Precedence',
          type: 'select',
          options: [
            { label: 'ROUTINE (R)', value: 'ROUTINE' },
            { label: 'PRIORITY (P)', value: 'PRIORITY' },
            { label: 'IMMEDIATE (O)', value: 'IMMEDIATE' },
            { label: 'FLASH (Z)', value: 'FLASH' }
          ],
          defaultValue: 'ROUTINE',
          className: 'md:col-span-1'
        }
      ]
    },
    {
      id: 'header',
      title: 'Message Header',
      fields: [
        {
          name: 'amhsOfficeCode',
          label: 'Office Code (Optional)',
          type: 'text',
          placeholder: 'MRA MM',
          className: 'md:col-span-1'
        },
        {
          name: 'originatorCode', // Mapped to "FROM"
          label: 'Originator (FROM)',
          type: 'text',
          placeholder: 'CMC WASHINGTON DC',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'subj',
          label: 'Subject (SUBJ)',
          type: 'text',
          placeholder: 'SUBJECT LINE (ALL CAPS)',
          required: true,
          className: 'col-span-full'
        }
      ]
    }
  ]
};

// 8. Memorandum for the Record (MFR)
export const MFRSchema = BasicLetterSchema.omit({ from: true, to: true, ssic: true, originatorCode: true }).extend({
  documentType: z.literal('mfr'),
  from: z.string().optional(),
  to: z.string().optional(),
  ssic: z.string().optional(),
  originatorCode: z.string().optional(),
});

export const MFRDefinition: DocumentTypeDefinition = {
  id: 'mfr',
  name: 'Memorandum for the Record',
  description: 'Internal document to record events or decisions. No "To" line.',
  icon: '📝',
  schema: MFRSchema,
  sections: [
    {
      id: 'header',
      title: 'MFR Details',
      fields: [
        // Include basic fields but exclude From/To, SSIC, and Originator Code
        ...BasicLetterDefinition.sections[0].fields.filter(f => 
          f.name !== 'from' && f.name !== 'to' && f.name !== 'ssic' && f.name !== 'originatorCode'
        )
      ]
    }
  ]
};

// 9. From-To Memorandum
export const FromToMemoSchema = BasicLetterSchema.extend({
  documentType: z.literal('from-to-memo'),
  ssic: z.string().optional(),
  originatorCode: z.string().optional(),
});

export const FromToMemoDefinition: DocumentTypeDefinition = {
  id: 'from-to-memo',
  name: 'From-To Memorandum',
  description: 'Informal internal correspondence on plain paper.',
  icon: '📨',
  schema: FromToMemoSchema,
  sections: [
    {
      id: 'header',
      title: 'Header Information',
      fields: [
        {
          name: 'date',
          label: 'Date',
          type: 'date',
          placeholder: 'DD Mmm YY',
          required: true,
          className: 'md:col-span-1'
        },
        {
          name: 'from',
          label: 'From',
          type: 'text',
          placeholder: 'Name (Grade, First MI Last)',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'to',
          label: 'To',
          type: 'text',
          placeholder: 'Commanding Officer...',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'subj',
          label: 'Subject',
          type: 'text',
          placeholder: 'SUBJECT LINE (ALL CAPS)',
          required: true,
          className: 'col-span-full'
        }
      ]
    }
  ]
};

// 10. Letterhead Memorandum
export const LetterheadMemoSchema = BasicLetterSchema.extend({
  documentType: z.literal('letterhead-memo'),
});

export const LetterheadMemoDefinition: DocumentTypeDefinition = {
  id: 'letterhead-memo',
  name: 'Letterhead Memorandum',
  description: 'Formal memorandum used for correspondence within the activity or with other federal agencies.',
  icon: '🏛️',
  schema: LetterheadMemoSchema,
  sections: [
    ...BasicLetterDefinition.sections
  ]
};

// 11. Memorandum of Agreement (MOA)
export const MOASchema = z.object({
  documentType: z.literal('moa'),
  date: z.string().optional(),
  subj: z.string().min(1, "Subject (REGARDING) is required").transform(val => val.toUpperCase()),
  moaData: z.object({
    activityA: z.string().min(1, "Senior Activity is required"),
    activityB: z.string().min(1, "Junior Activity is required"),
    activityAHeader: z.object({
        ssic: z.string().optional(),
        serial: z.string().optional(),
        date: z.string().optional(),
    }).optional(),
    activityBHeader: z.object({
        ssic: z.string().optional(),
        serial: z.string().optional(),
        date: z.string().optional(),
    }).optional(),
    seniorSigner: z.object({
      name: z.string().min(1, "Name is required"),
      title: z.string().min(1, "Title is required"),
      activity: z.string().min(1, "Activity is required"),
      date: z.string().optional(),
    }),
    juniorSigner: z.object({
      name: z.string().min(1, "Name is required"),
      title: z.string().min(1, "Title is required"),
      activity: z.string().min(1, "Activity is required"),
      date: z.string().optional(),
    }),
  }),
  ssic: z.string().optional(),
  originatorCode: z.string().optional(),
});

export const MOADefinition: DocumentTypeDefinition = {
  id: 'moa',
  name: 'Memorandum of Agreement',
  description: 'Agreement between two or more parties (Conditional).',
  icon: '🤝',
  schema: MOASchema,
  sections: [
    {
      id: 'moa-header',
      title: 'Agreement Details',
      className: 'grid-cols-1',
      fields: [
        {
          name: 'subj',
          label: 'Subject (REGARDING)',
          type: 'textarea',
          rows: 3,
          required: true,
          className: 'col-span-1',
          placeholder: 'SUBJECT OF AGREEMENT'
        }
      ]
    }
  ]
};

// 12. Memorandum of Understanding (MOU)
export const MOUSchema = MOASchema.extend({
  documentType: z.literal('mou'),
});

export const MOUDefinition: DocumentTypeDefinition = {
  ...MOADefinition,
  id: 'mou',
  name: 'Memorandum of Understanding',
  description: 'General understanding between two or more parties (Non-binding).',
  schema: MOUSchema,
};

// 13. Staffing Papers (Point, Talking, Briefing, Position, Trip Report)
export const StaffingPaperSchema = z.object({
  documentType: z.enum(['talking-paper', 'briefing-paper', 'position-paper', 'trip-report']),
  subj: z.string().min(1, "Subject is required").transform(val => val.toUpperCase()),
  date: z.string().min(1, "Date is required"),
  drafterName: z.string().min(1, "Drafter Name is required"),
  drafterRank: z.string().min(1, "Drafter Rank is required"),
  drafterOfficeCode: z.string().min(1, "Office Code is required"),
  drafterPhone: z.string().min(1, "Phone Extension is required"),
});

const StaffingPaperFields: FieldDefinition[] = [
  {
    name: 'subj',
    label: 'Subject',
    type: 'text',
    placeholder: 'SUBJECT (ALL CAPS)',
    required: true,
    className: 'col-span-full'
  },
  {
    name: 'date',
    label: 'Date',
    type: 'date',
    required: true,
    className: 'md:col-span-1'
  }
];

const StaffingPaperFooterFields: FieldDefinition[] = [
  {
    name: 'drafterName',
    label: 'Drafter Name',
    type: 'text',
    placeholder: 'J. M. DOE',
    required: true,
    className: 'md:col-span-1'
  },
  {
    name: 'drafterRank',
    label: 'Drafter Rank',
    type: 'text',
    placeholder: 'LtCol',
    required: true,
    className: 'md:col-span-1'
  },
  {
    name: 'drafterOfficeCode',
    label: 'Office Code',
    type: 'text',
    placeholder: 'G-1',
    required: true,
    className: 'md:col-span-1'
  },
  {
    name: 'drafterPhone',
    label: 'Phone Extension',
    type: 'text',
    placeholder: '555-1234',
    required: true,
    className: 'md:col-span-1'
  }
];

export const TalkingPaperDefinition: DocumentTypeDefinition = {
  id: 'talking-paper',
  name: 'Talking Paper',
  description: 'Narrative outline for speaking engagements.',
  icon: '🗣️',
  schema: StaffingPaperSchema,
  sections: [
    { id: 'header', title: 'Paper Details', fields: StaffingPaperFields },
    { id: 'footer', title: 'Identification Footer', fields: StaffingPaperFooterFields }
  ]
};

export const BriefingPaperDefinition: DocumentTypeDefinition = {
  id: 'briefing-paper',
  name: 'Briefing Paper',
  description: 'Detailed information paper.',
  icon: '📊',
  schema: StaffingPaperSchema,
  sections: [
    { id: 'header', title: 'Paper Details', fields: StaffingPaperFields },
    { id: 'footer', title: 'Identification Footer', fields: StaffingPaperFooterFields }
  ]
};

export const PositionPaperDefinition: DocumentTypeDefinition = {
  id: 'position-paper',
  name: 'Position Paper',
  description: 'Advocates a specific position or solution.',
  icon: '📍',
  schema: StaffingPaperSchema,
  sections: [
    { id: 'header', title: 'Paper Details', fields: StaffingPaperFields },
    { id: 'footer', title: 'Identification Footer', fields: StaffingPaperFooterFields }
  ]
};

export const TripReportDefinition: DocumentTypeDefinition = {
  id: 'trip-report',
  name: 'Trip Report',
  description: 'Report on official travel.',
  icon: '✈️',
  schema: StaffingPaperSchema,
  sections: [
    { id: 'header', title: 'Report Details', fields: StaffingPaperFields },
    { id: 'footer', title: 'Identification Footer', fields: StaffingPaperFooterFields }
  ]
};

// Registry of all document types
export const DOCUMENT_TYPES: Record<string, DocumentTypeDefinition> = {
  basic: BasicLetterDefinition,
  'multiple-address': MultipleAddressLetterDefinition,
  endorsement: EndorsementDefinition,
  'aa-form': AAFormDefinition,
  mco: MCODefinition,
  bulletin: BulletinDefinition,
  page11: Page11Definition,
  mfr: MFRDefinition,
  'from-to-memo': FromToMemoDefinition,
  'letterhead-memo': LetterheadMemoDefinition,
  amhs: AMHSDefinition,
  moa: MOADefinition,
  mou: MOUDefinition,

  'talking-paper': TalkingPaperDefinition,
  'briefing-paper': BriefingPaperDefinition,
  'position-paper': PositionPaperDefinition,
  'trip-report': TripReportDefinition
};
