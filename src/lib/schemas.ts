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
  | 'autosuggest'
  | 'number'
  | 'hidden' // For fields that are present in data but not shown
  | 'decision-grid'; // Custom decision grid (rendered externally, not by DynamicForm)

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

// Reusable inline validators for rich error messages while editing
const ssicFieldRequired = () => z.string().superRefine((val, ctx) => {
  if (!val) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SSIC is required" });
    return;
  }
  if (!/^\d+$/.test(val)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SSIC must contain only numbers" });
    return;
  }
  if (val.length < 4) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `SSIC must be 4-5 digits (currently ${val.length})` });
    return;
  }
  if (val.length > 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SSIC too long (max 5 digits)" });
    return;
  }
});

const ssicFieldOptional = () => z.string().optional().superRefine((val, ctx) => {
  if (!val || val.length === 0) return;
  if (!/^\d+$/.test(val)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SSIC must contain only numbers" });
    return;
  }
  if (val.length < 4) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `SSIC must be 4-5 digits (currently ${val.length})` });
    return;
  }
  if (val.length > 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SSIC too long (max 5 digits)" });
    return;
  }
});

const subjFieldRequired = () => z.string()
  .min(1, "Subject is required")
  .refine(val => val === val.toUpperCase(), { message: "Subject must be in ALL CAPS" });

const subjFieldOptional = () => z.string().optional()
  .refine(val => !val || val === val.toUpperCase(), { message: "Subject must be in ALL CAPS" });

// --- Document Type Schemas ---

// 1. Basic Letter
export const BasicLetterSchema = z.object({
  ssic: ssicFieldRequired(),
  originatorCode: z.string().min(1, "Originator Code is required"),
  date: z.string().min(1, "Date is required"),
  from: z.string().min(1, "From line is required"),
  to: z.string().min(1, "To line is required"),
  subj: subjFieldRequired(),
  documentType: z.literal('basic'),
  line1: z.string(),
  line2: z.string(),
  line3: z.string(),
  sig: z.string(),
  delegationText: z.string().optional(),
  bodyFont: z.string().optional(),
  distribution: z.any().optional(),
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
          type: 'combobox',
          placeholder: 'Search SSIC...',
          description: 'Standard Subject Identification Code (4-5 digit number from SECNAV M-5210.2)',
          required: true,
          className: 'md:col-span-1'
        },
        {
          name: 'originatorCode',
          label: 'Originator Code',
          type: 'text',
          placeholder: 'e.g., G-1',
          description: 'Office code of the drafting section (e.g., G-1, S-3, CO)',
          required: true,
          className: 'md:col-span-1'
        },
        {
          name: 'date',
          label: 'Date',
          type: 'date',
          placeholder: 'DD Mmm YY',
          description: 'Day Month Year format (e.g., 16 Feb 26)',
          required: true,
          className: 'md:col-span-1'
        },
        {
          name: 'from',
          label: 'From',
          type: 'autosuggest',
          placeholder: 'Commanding Officer...',
          description: 'Title of the signing authority (not the individual\'s name)',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'to',
          label: 'To',
          type: 'text',
          placeholder: 'Commanding Officer...',
          description: 'Title of the addressee or "Distribution List" for multiple recipients',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'subj',
          label: 'Subject',
          type: 'autosuggest',
          placeholder: 'SUBJECT LINE (ALL CAPS)',
          description: 'Brief topic in ALL CAPS — do not use abbreviations unless widely recognized',
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
  basicLetterReference: z.string(),
  basicLetterSsic: z.string(),
  referenceWho: z.string(),
  referenceType: z.string(),
  referenceDate: z.string(),
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

// 4. AA Form (NAVMC 10274)
export const AAFormSchema = z.object({
  documentType: z.literal('aa-form'),
  ssic: ssicFieldOptional(),
  actionNo: z.string().optional(),
  orgStation: z.string().optional(),
  from: z.string().min(1, "From is required"),
  to: z.string().min(1, "To is required"),
  subj: subjFieldRequired(),
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


// 5. Marine Corps Order (MCO)
export const MCOSchema = BasicLetterSchema.extend({
  documentType: z.literal('mco'),
  // These fields are managed by UnitInfoSection / ClosingBlockSection, not DynamicForm.
  // Override as optional so zodResolver doesn't reject the form when they're absent.
  line1: z.string().optional(),
  line2: z.string().optional(),
  line3: z.string().optional(),
  sig: z.string().optional(),
  directiveTitle: z.string().optional(),
  // Classified directive prefix per MCO 5215.1K para 9
  classificationPrefix: z.enum(['', 'C', 'S']).optional(),
  // Reserve designation per MCO 5215.1K para 22
  isReserveOnly: z.boolean().optional(),
  // Revision tracking per MCO 5215.1K para 21e
  revisionLetter: z.string().optional(),
  // FOUO designation per MCO 5215.1K para 10
  fouoDesignation: z.enum(['', 'full', 'partial']).optional(),
  // 4-digit paragraph numbering per MCO 5215.1K para 34
  fourDigitNumbering: z.boolean().optional(),
  chapterNumber: z.number().min(1).max(9).optional(),
  // Structural pages per MCO 5215.1K para 48
  showStructuralPages: z.boolean().optional(),
  recordOfChanges: z.array(z.object({
    changeNo: z.number(),
    date: z.string(),
    pagesAffected: z.string(),
    enteredBy: z.string(),
  })).optional(),
  reports: z.array(z.object({
    id: z.string(),
    title: z.string(),
    controlSymbol: z.string(),
    paragraphRef: z.string(),
    exempt: z.boolean().optional()
  })).optional(),
  adminSubsections: z.object({
    recordsManagement: z.object({ show: z.boolean(), content: z.string(), order: z.number() }),
    privacyAct: z.object({ show: z.boolean(), content: z.string(), order: z.number() }),
    reportsRequired: z.object({ show: z.boolean(), content: z.string(), order: z.number() })
  }).optional(),
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
           name: 'directiveTitle',
           label: 'Designation Line',
           type: 'text',
           placeholder: 'e.g. MARINE CORPS ORDER 5215.1K',
           description: 'Full designation in ALL CAPS (e.g., MARINE CORPS ORDER 5215.1K). Appears below the date.',
           className: 'col-span-full'
         },
         {
           name: 'distribution.pcn',
           label: 'PCN (Publication Control Number)',
           type: 'text',
           placeholder: 'e.g. 10200000000',
           className: 'md:col-span-1'
         },
         {
           name: 'distribution.statementCode',
           label: 'Distribution Statement',
           type: 'select',
           options: [
             { label: 'A — Public release; unlimited', value: 'A' },
             { label: 'B — U.S. Gov agencies only', value: 'B' },
             { label: 'C — Gov agencies & contractors', value: 'C' },
             { label: 'D — DoD & DoD contractors only', value: 'D' },
             { label: 'E — DoD components only', value: 'E' },
             { label: 'F — Further dissemination as directed', value: 'F' },
             { label: 'X — Export-controlled', value: 'X' }
           ],
           defaultValue: 'A',
           className: 'md:col-span-1',
           description: 'Per DoD 5230.24. Shown at bottom of letterhead page.'
         }
      ]
    },
    {
      id: 'directive-options',
      title: 'Directive Options',
      description: 'Classification, revision, and reserve designation per MCO 5215.1K',
      fields: [
        {
          name: 'classificationPrefix',
          label: 'Classification Prefix',
          type: 'select',
          options: [
            { label: 'None (Unclassified)', value: '' },
            { label: 'C (Confidential)', value: 'C' },
            { label: 'S (Secret)', value: 'S' }
          ],
          defaultValue: '',
          className: 'md:col-span-1',
          description: 'Prefixes SSIC per MCO 5215.1K para 9 (e.g., MCO C5215.1)'
        },
        {
          name: 'revisionLetter',
          label: 'Revision Letter',
          type: 'text',
          placeholder: 'e.g. A, B, K',
          className: 'md:col-span-1',
          description: 'Capital letter suffix (A-Z, skip I/O/Q) per MCO 5215.1K para 21e'
        },
        {
          name: 'isReserveOnly',
          label: 'Reserve Only',
          type: 'checkbox',
          className: 'md:col-span-1',
          description: 'Adds "R" after SSIC per MCO 5215.1K para 22 (e.g., MCO 5215R.15)'
        },
        {
          name: 'fouoDesignation',
          label: 'FOUO Designation',
          type: 'select',
          options: [
            { label: 'None', value: '' },
            { label: 'Full FOUO (all information)', value: 'full' },
            { label: 'Partial FOUO (specific portions)', value: 'partial' }
          ],
          defaultValue: '',
          className: 'md:col-span-1',
          description: 'Per MCO 5215.1K para 10 — marks "FOR OFFICIAL USE ONLY" on pages'
        },
        {
          name: 'fourDigitNumbering',
          label: '4-Digit Numbering',
          type: 'checkbox',
          className: 'md:col-span-1',
          description: 'Per MCO 5215.1K para 34 — for orders exceeding 200 pages (e.g., 1001., 1002.)'
        },
        {
          name: 'chapterNumber',
          label: 'Chapter Number',
          type: 'number',
          placeholder: '1',
          className: 'md:col-span-1',
          description: 'Chapter prefix for 4-digit numbering (1=1001, 2=2001, etc.)',
          condition: (formData: any) => !!formData.fourDigitNumbering
        },
        {
          name: 'showStructuralPages',
          label: 'Structural Pages',
          type: 'checkbox',
          className: 'md:col-span-1',
          description: 'Per MCO 5215.1K para 48 — adds Locator Sheet, Record of Changes, and Table of Contents'
        }
      ]
    }
  ]
};

// 6. Marine Corps Bulletin (MCBul)
export const BulletinSchema = BasicLetterSchema.extend({
  documentType: z.literal('bulletin'),
  // These fields are managed by UnitInfoSection / ClosingBlockSection, not DynamicForm.
  line1: z.string().optional(),
  line2: z.string().optional(),
  line3: z.string().optional(),
  sig: z.string().optional(),
  directiveTitle: z.string().optional(),
  cancellationDate: z.string().min(1, "Cancellation Date is required"),
  cancellationType: z.enum(['fixed', 'contingent']).optional(),
  // Shared directive fields (same as MCO)
  reports: z.array(z.object({
    id: z.string(),
    title: z.string(),
    controlSymbol: z.string(),
    paragraphRef: z.string(),
    exempt: z.boolean().optional()
  })).optional(),
  distribution: z.object({
    type: z.string().optional(),
    pcn: z.string().optional(),
    copyTo: z.array(z.object({
        code: z.string(),
        qty: z.number()
    })).optional(),
    statementCode: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'X', '']).optional(),
    statementReason: z.string().optional(),
    statementDate: z.string().optional(),
    statementAuthority: z.string().optional(),
  }).optional(),
  // Classified directive prefix per MCO 5215.1K para 9
  classificationPrefix: z.enum(['', 'C', 'S']).optional(),
  // Reserve designation per MCO 5215.1K para 22
  isReserveOnly: z.boolean().optional(),
  // FOUO designation per MCO 5215.1K para 10
  fouoDesignation: z.enum(['', 'full', 'partial']).optional(),
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
          name: 'directiveTitle',
          label: 'Designation Line',
          type: 'text',
          placeholder: 'e.g. MARINE CORPS BULLETIN 1500',
          description: 'Full designation in ALL CAPS (e.g., MARINE CORPS BULLETIN 1500). Appears below the date.',
          className: 'col-span-full'
        },
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
        },
        {
          name: 'distribution.pcn',
          label: 'PCN (Publication Control Number)',
          type: 'text',
          placeholder: 'e.g. 10200000000',
          className: 'md:col-span-1'
        },
        {
          name: 'distribution.statementCode',
          label: 'Distribution Statement',
          type: 'select',
          options: [
            { label: 'A — Public release; unlimited', value: 'A' },
            { label: 'B — U.S. Gov agencies only', value: 'B' },
            { label: 'C — Gov agencies & contractors', value: 'C' },
            { label: 'D — DoD & DoD contractors only', value: 'D' },
            { label: 'E — DoD components only', value: 'E' },
            { label: 'F — Further dissemination as directed', value: 'F' },
            { label: 'X — Export-controlled', value: 'X' }
          ],
          defaultValue: 'A',
          className: 'md:col-span-1',
          description: 'Per DoD 5230.24. Shown at bottom of letterhead page.'
        }
      ]
    },
    {
      id: 'directive-options',
      title: 'Directive Options',
      description: 'Classification and reserve designation per MCO 5215.1K',
      fields: [
        {
          name: 'classificationPrefix',
          label: 'Classification Prefix',
          type: 'select',
          options: [
            { label: 'None (Unclassified)', value: '' },
            { label: 'C (Confidential)', value: 'C' },
            { label: 'S (Secret)', value: 'S' }
          ],
          defaultValue: '',
          className: 'md:col-span-1',
          description: 'Prefixes SSIC per MCO 5215.1K para 9 (e.g., MCBul C5215)'
        },
        {
          name: 'isReserveOnly',
          label: 'Reserve Only',
          type: 'checkbox',
          className: 'md:col-span-1',
          description: 'Adds "R" after SSIC per MCO 5215.1K para 22 (e.g., MCBul 5215R)'
        },
        {
          name: 'fouoDesignation',
          label: 'FOUO Designation',
          type: 'select',
          options: [
            { label: 'None', value: '' },
            { label: 'Full FOUO (all information)', value: 'full' },
            { label: 'Partial FOUO (specific portions)', value: 'partial' }
          ],
          defaultValue: '',
          className: 'md:col-span-1',
          description: 'Per MCO 5215.1K para 10 — marks "FOR OFFICIAL USE ONLY" on pages'
        }
      ]
    }
  ]
};

// 7. Page 11 (NAVMC 118(11))
export const Page11Schema = z.object({
  documentType: z.literal('page11'),
  name: z.string().min(1, "Name is required"),
  edipi: z.string().min(1, "DOD ID / EDIPI is required"),
  date: z.string().optional(),
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

// 8. AMHS Message
export const AMHSSchema = z.object({
  documentType: z.literal('amhs'),
  amhsMessageType: z.enum(['GENADMIN', 'MARADMIN', 'ALMAR']),
  amhsClassification: z.enum(['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET']),
  amhsPrecedence: z.enum(['ROUTINE', 'PRIORITY', 'IMMEDIATE', 'FLASH']),
  amhsDtg: z.string().optional(), // Auto-generated, handled separately
  amhsOfficeCode: z.string().optional(),
  originatorCode: z.string().min(1, "Originator (FROM) is required"), // Reusing originatorCode for "FROM" field
  subj: subjFieldRequired(),
  amhsPocs: z.array(z.string()).optional(),
  amhsReferences: z.array(z.object({
    id: z.string(),
    letter: z.string(),
    type: z.string(),
    docId: z.string(),
    title: z.string()
  })).optional(),
  date: z.string().optional()
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

// 9. Memorandum for the Record (MFR)
export const MFRSchema = BasicLetterSchema.omit({ from: true, to: true, ssic: true, originatorCode: true }).extend({
  documentType: z.literal('mfr'),
  from: z.string().optional(),
  to: z.string().optional(),
  ssic: ssicFieldOptional(),
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

// 10. From-To Memorandum
export const FromToMemoSchema = BasicLetterSchema.extend({
  documentType: z.literal('from-to-memo'),
  ssic: ssicFieldOptional(),
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

// 11. Letterhead Memorandum
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

// 12. Coordination Page (MCO 5216.20B, Fig 13-8)
export const CoordinationPageSchema = z.object({
  documentType: z.literal('coordination-page'),
  subj: subjFieldRequired(),
  date: z.string().optional(),
  actionOfficerName: z.string().min(1, "Action Officer name is required."),
  actionOfficerRank: z.string().optional(),
  actionOfficerOfficeCode: z.string().min(1, "Office code is required."),
  actionOfficerPhone: z.string().optional(),
  coordinatingOffices: z.array(z.object({
    office: z.string().min(1, "Office/Agency is required."),
    concurrence: z.enum(['concur', 'nonconcur', 'pending']).default('pending'),
    aoName: z.string().optional(),
    date: z.string().optional(),
    initials: z.string().optional(),
    comments: z.string().optional(),
  })).optional(),
  remarks: z.string().optional(),
});

export const CoordinationPageDefinition: DocumentTypeDefinition = {
  id: 'coordination-page',
  name: 'Coordination Page',
  description: 'Mandatory staffing table for routing packages. Tracks concurrence/non-concurrence per MCO 5216.20B.',
  icon: '🔄',
  schema: CoordinationPageSchema,
  sections: [
    {
      id: 'action',
      title: 'Action Information',
      fields: [
        {
          name: 'subj',
          label: 'Subject',
          type: 'text',
          required: true,
          placeholder: 'SUBJECT OF THE ACTION BEING COORDINATED',
          className: 'col-span-full',
          description: 'Subject of the staffing action (ALL CAPS)'
        },
        {
          name: 'date',
          label: 'Date Prepared',
          type: 'text',
          placeholder: '10 Feb 26',
          className: 'md:col-span-1',
          description: 'DD Mmm YY format'
        },
      ]
    },
    {
      id: 'actionOfficer',
      title: 'Action Officer',
      fields: [
        {
          name: 'actionOfficerName',
          label: 'Name',
          type: 'text',
          required: true,
          placeholder: 'Capt J. M. Doe',
          className: 'md:col-span-1'
        },
        {
          name: 'actionOfficerRank',
          label: 'Rank',
          type: 'text',
          placeholder: 'Capt',
          className: 'md:col-span-1'
        },
        {
          name: 'actionOfficerOfficeCode',
          label: 'Office Code',
          type: 'text',
          required: true,
          placeholder: 'G-3',
          className: 'md:col-span-1'
        },
        {
          name: 'actionOfficerPhone',
          label: 'Phone',
          type: 'text',
          placeholder: '(703) 555-1234',
          className: 'md:col-span-1'
        },
      ]
    },
    {
      id: 'remarks',
      title: 'Remarks',
      fields: [
        {
          name: 'remarks',
          label: 'Remarks',
          type: 'textarea',
          placeholder: 'Additional remarks or notes regarding the coordination...',
          rows: 3,
          className: 'col-span-full'
        }
      ]
    }
  ]
};

// 13. Memorandum of Agreement (MOA)
export const MOASchema = z.object({
  documentType: z.literal('moa'),
  date: z.string().optional(),
  subj: subjFieldRequired(),
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

// 14. Memorandum of Understanding (MOU)
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

// 15. Staffing Papers (Position, Information, Decision Paper)
export const StaffingPaperSchema = z.object({
  documentType: z.enum(['position-paper', 'information-paper', 'decision-paper']),
  subj: subjFieldRequired(),
  date: z.string().min(1, "Date is required"),
  drafterName: z.string().min(1, "Drafter Name is required"),
  drafterRank: z.string().min(1, "Drafter Rank is required"),
  drafterOfficeCode: z.string().min(1, "Office Code is required"),
  drafterPhone: z.string().min(1, "Phone Extension is required"),
  drafterService: z.string().optional(),
  drafterAgency: z.string().optional(),
  classification: z.string().optional(),
});

const StaffingPaperFields: FieldDefinition[] = [
  // Decision Grid Fields (Position/Decision Paper)
  {
    name: 'decisionGrid',
    label: 'Decision Grid',
    type: 'decision-grid',
    required: false,
    className: 'col-span-full',
    description: 'Routing and decision options for Position/Decision Papers'
  },
  {
    name: 'classification',
    label: 'Classification',
    type: 'select',
    options: [
      { label: 'UNCLASSIFIED', value: 'UNCLASSIFIED' },
      { label: 'CUI', value: 'CUI' },
      { label: 'CONFIDENTIAL', value: 'CONFIDENTIAL' },
      { label: 'SECRET', value: 'SECRET' },
      { label: 'TOP SECRET', value: 'TOP SECRET' },
    ],
    defaultValue: 'UNCLASSIFIED',
    className: 'md:col-span-1',
    description: 'Required for Information Paper'
  },
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
    name: 'drafterService',
    label: 'Service/Branch',
    type: 'text',
    placeholder: 'USMC',
    className: 'md:col-span-1',
    description: 'Required for Information Paper',
    required: true
  },
  {
    name: 'drafterAgency',
    label: 'Agency',
    type: 'text',
    placeholder: 'HQMC',
    className: 'md:col-span-1',
    description: 'Required for Information Paper',
    required: true
  },
  {
    name: 'drafterOfficeCode',
    label: 'Office Code/Section',
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
  },
  // Approver Fields (Position Paper)
  {
    name: 'approverName',
    label: 'Approver Name',
    type: 'text',
    placeholder: 'Col I. M. Boss',
    className: 'md:col-span-1',
    description: 'Required for Position/Decision Paper'
  },
  {
    name: 'approverRank',
    label: 'Approver Rank',
    type: 'text',
    placeholder: 'Col',
    className: 'md:col-span-1',
    description: 'Required for Position/Decision Paper'
  },
  {
    name: 'approverOfficeCode',
    label: 'Approver Office',
    type: 'text',
    placeholder: 'G-3',
    className: 'md:col-span-1',
    description: 'Required for Position/Decision Paper'
  },
  {
    name: 'approverPhone',
    label: 'Approver Phone',
    type: 'text',
    placeholder: '555-5678',
    className: 'md:col-span-1',
    description: 'Required for Position/Decision Paper'
  }
];

export const PositionPaperDefinition: DocumentTypeDefinition = {
  id: 'position-paper',
  name: 'Position/Decision Paper',
  description: 'Advocates a specific position or solution.',
  icon: '📍',
  schema: StaffingPaperSchema,
  sections: [
    { id: 'header', title: 'Paper Details', fields: StaffingPaperFields },
    { id: 'footer', title: 'Identification Footer', fields: StaffingPaperFooterFields }
  ]
};

export const InformationPaperDefinition: DocumentTypeDefinition = {
  id: 'information-paper',
  name: 'Information Paper',
  description: 'Provides factual information in concise terms.',
  icon: 'ℹ️',
  schema: StaffingPaperSchema,
  sections: [
    { id: 'header', title: 'Paper Details', fields: StaffingPaperFields },
    { id: 'footer', title: 'Identification Footer', fields: StaffingPaperFooterFields }
  ]
};

export const DecisionPaperDefinition: DocumentTypeDefinition = {
  id: 'decision-paper',
  name: 'Decision Paper',
  description: 'Requests a decision from a senior official.',
  icon: '❓',
  schema: StaffingPaperSchema,
  sections: [
    { id: 'header', title: 'Paper Details', fields: StaffingPaperFields },
    { id: 'footer', title: 'Identification Footer', fields: StaffingPaperFooterFields }
  ]
};

// 16. Business Letter
export const BusinessLetterSchema = z.object({
  documentType: z.literal('business-letter'),
  ssic: ssicFieldRequired(),
  originatorCode: z.string().min(1, "Originator Code is required"),
  date: z.string().min(1, "Date is required"),
  recipientName: z.string().min(1, "Recipient Name is required"),
  recipientTitle: z.string().optional(),
  businessName: z.string().optional(),
  senderAddress: z.string().optional(),
  recipientAddress: z.string().min(1, "Recipient Address is required"),
  attentionLine: z.string().optional(),
  salutation: z.string().min(1, "Salutation is required").transform(val => {
    const trimmed = val.trim();
    if (trimmed && !trimmed.endsWith(':')) {
      return `${trimmed}:`;
    }
    return trimmed;
  }),
  subj: subjFieldOptional(), // Optional, unlike basic letter
  complimentaryClose: z.string().default("Sincerely,"),
  sig: z.string().min(1, "Signer Name is required"),
  signerRank: z.string().optional(),
  signerTitle: z.string().optional(),
  isWindowEnvelope: z.boolean().optional(),
  isShortLetter: z.boolean().optional(),
  isVipMode: z.boolean().optional(),
});

export const BusinessLetterDefinition: DocumentTypeDefinition = {
  id: 'business-letter',
  name: 'Business Letter',
  description: 'Correspondence with non-DoD entities or personal approach.',
  icon: '💼',
  schema: BusinessLetterSchema,
  sections: [
    {
      id: 'header',
      title: 'Identification',
      fields: [
        {
          name: 'ssic',
          label: 'SSIC',
          type: 'combobox',
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
        }
      ]
    },
    {
      id: 'formatting',
      title: 'Formatting Options',
      fields: [
        {
          name: 'isWindowEnvelope',
          label: 'Window Envelope',
          type: 'checkbox',
          description: 'Aligns address block for #10 window envelopes',
          className: 'md:col-span-1'
        },
        {
          name: 'isShortLetter',
          label: 'Short Letter (<8 lines)',
          type: 'checkbox',
          description: 'Applies double spacing and wider margins',
          className: 'md:col-span-1'
        },
        {
          name: 'isVipMode',
          label: 'VIP Mode',
          type: 'checkbox',
          description: 'Changes close to "Very respectfully,"',
          className: 'md:col-span-1'
        }
      ]
    },
    {
      id: 'recipient',
      title: 'Inside Address',
      fields: [
        {
          name: 'recipientName',
          label: 'Recipient Name',
          type: 'text',
          placeholder: 'Mr. John Doe',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'recipientTitle',
          label: 'Title',
          type: 'text',
          placeholder: 'Vice President',
          className: 'md:col-span-1'
        },
        {
          name: 'businessName',
          label: 'Business Name',
          type: 'text',
          placeholder: 'Acme Corp',
          className: 'md:col-span-1'
        },
        {
          name: 'recipientAddress',
          label: 'Address',
          type: 'textarea',
          placeholder: '123 Main St\nCity, State Zip',
          required: true,
          className: 'col-span-full',
          rows: 3
        }
      ]
    },
    {
      id: 'details',
      title: 'Letter Details',
      fields: [
        {
          name: 'attentionLine',
          label: 'Attention Line (Optional)',
          type: 'text',
          placeholder: 'Attention: Human Resources',
          className: 'col-span-full'
        },
        {
          name: 'salutation',
          label: 'Salutation',
          type: 'text',
          placeholder: 'Dear Mr. Doe:',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'subj',
          label: 'Subject Line (Optional)',
          type: 'text',
          placeholder: 'SUBJECT LINE (ALL CAPS)',
          className: 'col-span-full'
        },
        {
          name: 'complimentaryClose',
          label: 'Complimentary Close',
          type: 'text',
          defaultValue: 'Sincerely,',
          required: true,
          className: 'md:col-span-1'
        }
      ]
    },
    {
      id: 'signature',
      title: 'Signature Block',
      fields: [
        {
          name: 'sig',
          label: 'Signer Name',
          type: 'text',
          placeholder: 'I. M. MARINE',
          required: true,
          className: 'md:col-span-1',
          description: 'ALL CAPS'
        },
        {
          name: 'signerRank',
          label: 'Military Grade',
          type: 'text',
          placeholder: 'Colonel',
          className: 'md:col-span-1',
          description: 'Spelled out (e.g. Colonel)'
        },
        {
          name: 'signerTitle',
          label: 'Functional Title',
          type: 'text',
          placeholder: 'Director, Personnel',
          className: 'col-span-full'
        }
      ]
    }
  ]
};

// 17. Executive Correspondence
export const ExecutiveCorrespondenceSchema = z.object({
  documentType: z.literal('executive-correspondence'),
  ssic: ssicFieldOptional(),
  originatorCode: z.string().optional(),
  date: z.string().optional(), // May be left blank per Ch 12-3 para 3
  recipientName: z.string().min(1, "Recipient Name is required"),
  recipientTitle: z.string().optional(),
  organizationName: z.string().optional(),
  recipientAddress: z.string().optional(),
  salutation: z.string().min(1, "Salutation is required").transform(val => {
    const trimmed = val.trim();
    if (trimmed && !trimmed.endsWith(':') && !trimmed.endsWith(',')) {
      return `${trimmed}:`;
    }
    return trimmed;
  }),
  subj: subjFieldOptional(),
  complimentaryClose: z.string().default("Sincerely,"),
  sig: z.string().optional(), // May be omitted for SecDef/DepSecDef/SECNAV/UNSECNAV
  signerTitle: z.string().optional(),
  execFormat: z.enum(['letter', 'standard-memo', 'action-memo', 'info-memo']).default('letter'),
  memoFor: z.string().optional(), // "MEMORANDUM FOR" addressee(s)
  memoFrom: z.string().optional(), // "FROM:" line for info memos
  isCongressional: z.boolean().optional(),
  courtesyCopyTo: z.string().optional(), // Ranking minority member
  omitSignatureBlock: z.boolean().optional(), // For SecDef/DepSecDef signature
  omitDate: z.boolean().optional(), // Date added after signing
  preparedBy: z.string().optional(), // "Prepared by:" line
  preparedByPhone: z.string().optional(),
});

export const ExecutiveCorrespondenceDefinition: DocumentTypeDefinition = {
  id: 'executive-correspondence',
  name: 'Executive Correspondence',
  description: 'Letters and memorandums for HqDON, Congress, OSD, and senior officials.',
  icon: '🏛️',
  schema: ExecutiveCorrespondenceSchema,
  sections: [
    {
      id: 'format',
      title: 'Format & Options',
      fields: [
        {
          name: 'execFormat',
          label: 'Format',
          type: 'select',
          options: [
            { value: 'letter', label: 'Executive Letter' },
            { value: 'standard-memo', label: 'Standard Memorandum' },
            { value: 'action-memo', label: 'Action Memorandum' },
            { value: 'info-memo', label: 'Information Memorandum' },
          ],
          required: true,
          className: 'md:col-span-1',
          description: 'Per SECNAV M-5216.5, Ch 12'
        },
        {
          name: 'isCongressional',
          label: 'Congressional Response',
          type: 'checkbox',
          description: 'Adds courtesy copy to ranking minority member',
          className: 'md:col-span-1'
        },
        {
          name: 'omitDate',
          label: 'Omit Date (Added After Signing)',
          type: 'checkbox',
          description: 'Per Ch 12-3 para 3: date added by Admin after signature',
          className: 'md:col-span-1'
        },
        {
          name: 'omitSignatureBlock',
          label: 'Omit Signature Block',
          type: 'checkbox',
          description: 'For SecDef/DepSecDef/SECNAV/UNSECNAV signature',
          className: 'md:col-span-1'
        },
      ]
    },
    {
      id: 'header',
      title: 'Identification',
      fields: [
        {
          name: 'ssic',
          label: 'SSIC',
          type: 'combobox',
          placeholder: 'Search SSIC...',
          className: 'md:col-span-1'
        },
        {
          name: 'originatorCode',
          label: 'Originator Code',
          type: 'text',
          placeholder: 'e.g., DNS',
          className: 'md:col-span-1'
        },
        {
          name: 'date',
          label: 'Date',
          type: 'date',
          placeholder: 'DD Mmm YY',
          className: 'md:col-span-1',
          description: 'Leave blank if date added after signing'
        }
      ]
    },
    {
      id: 'recipient',
      title: 'Addressee',
      fields: [
        {
          name: 'recipientName',
          label: 'Recipient Name / Title',
          type: 'text',
          placeholder: 'The Honorable John Smith',
          required: true,
          className: 'col-span-full'
        },
        {
          name: 'recipientTitle',
          label: 'Position / Committee',
          type: 'text',
          placeholder: 'Chairman, Committee on Armed Services',
          className: 'col-span-full'
        },
        {
          name: 'organizationName',
          label: 'Organization',
          type: 'text',
          placeholder: 'U.S. House of Representatives',
          className: 'col-span-full'
        },
        {
          name: 'recipientAddress',
          label: 'Address',
          type: 'textarea',
          placeholder: 'Washington, DC 20515',
          className: 'col-span-full',
          rows: 2
        },
        {
          name: 'memoFor',
          label: 'MEMORANDUM FOR (Memo formats)',
          type: 'text',
          placeholder: 'SECRETARY OF DEFENSE',
          className: 'col-span-full',
          description: 'Used for memo formats only'
        },
        {
          name: 'memoFrom',
          label: 'FROM (Info/Action Memo)',
          type: 'text',
          placeholder: 'Thomas Harker, ASN (FM&C)',
          className: 'col-span-full',
          description: 'Used for info/action memo formats'
        }
      ]
    },
    {
      id: 'details',
      title: 'Letter Details',
      fields: [
        {
          name: 'salutation',
          label: 'Salutation',
          type: 'text',
          placeholder: 'Dear Mr. Chairman:',
          required: true,
          className: 'col-span-full',
          description: 'Must be formal per Ch 12-3'
        },
        {
          name: 'subj',
          label: 'Subject (Optional)',
          type: 'text',
          placeholder: 'Subject line',
          className: 'col-span-full'
        },
        {
          name: 'complimentaryClose',
          label: 'Complimentary Close',
          type: 'text',
          defaultValue: 'Sincerely,',
          required: true,
          className: 'md:col-span-1',
          description: 'Sincerely, / Respectfully, / Very respectfully, / Warm regards'
        },
        {
          name: 'courtesyCopyTo',
          label: 'Courtesy Copy (Congressional)',
          type: 'text',
          placeholder: 'The Honorable Jane Doe, Ranking Minority Member',
          className: 'col-span-full',
          description: 'Required for Committee/Subcommittee Chairperson letters'
        }
      ]
    },
    {
      id: 'signature',
      title: 'Signature Block',
      fields: [
        {
          name: 'sig',
          label: 'Signer Name',
          type: 'text',
          placeholder: 'CARLOS DEL TORO',
          className: 'md:col-span-1',
          description: 'Leave blank if omitting signature block'
        },
        {
          name: 'signerTitle',
          label: 'Official Title',
          type: 'text',
          placeholder: 'Secretary of the Navy',
          className: 'md:col-span-1'
        },
        {
          name: 'preparedBy',
          label: 'Prepared By',
          type: 'text',
          placeholder: 'Name, Organization',
          className: 'md:col-span-1',
          description: 'For action/info memos'
        },
        {
          name: 'preparedByPhone',
          label: 'Phone',
          type: 'text',
          placeholder: '(703) 555-1234',
          className: 'md:col-span-1'
        }
      ]
    }
  ]
};

// 18. Change Transmittal (MCO 5215.1K para 40-44)
export const ChangeTransmittalSchema = BasicLetterSchema.extend({
  documentType: z.literal('change-transmittal'),
  // The parent directive being changed
  parentDirectiveTitle: z.string().min(1, "Parent directive title is required (e.g., MCO 5215.1K)"),
  // Change number (Ch 1, Ch 2, etc.)
  changeNumber: z.number().min(1, "Change number is required"),
  // Classification prefix (inherited from parent directive)
  classificationPrefix: z.enum(['', 'C', 'S']).optional(),
  // Reserve designation
  isReserveOnly: z.boolean().optional(),
  // FOUO designation
  fouoDesignation: z.enum(['', 'full', 'partial']).optional(),
  // Distribution statement
  distribution: z.object({
    type: z.string().optional(),
    pcn: z.string().optional(),
    copyTo: z.array(z.object({
        code: z.string(),
        qty: z.number()
    })).optional(),
    statementCode: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'X', '']).optional(),
    statementReason: z.string().optional(),
    statementDate: z.string().optional(),
    statementAuthority: z.string().optional(),
  }).optional(),
});

export const ChangeTransmittalDefinition: DocumentTypeDefinition = {
  id: 'change-transmittal',
  name: 'Change Transmittal',
  description: 'Transmits amendments (page replacements) to an existing order per MCO 5215.1K para 40-44.',
  icon: '📝',
  schema: ChangeTransmittalSchema,
  sections: [
    {
      id: 'header',
      title: 'Change Transmittal Information',
      fields: [
        ...BasicLetterDefinition.sections[0].fields.map(f =>
          f.name === 'to' ? { ...f, defaultValue: 'Distribution List', placeholder: 'Distribution List' } : f
        ),
      ]
    },
    {
      id: 'change-details',
      title: 'Change Details',
      description: 'Identifies the parent directive and change number',
      fields: [
        {
          name: 'parentDirectiveTitle',
          label: 'Parent Directive',
          type: 'text',
          placeholder: 'e.g., MCO 5215.1K',
          required: true,
          className: 'md:col-span-1',
          description: 'The directive being amended (e.g., MCO 5215.1K)'
        },
        {
          name: 'changeNumber',
          label: 'Change Number',
          type: 'number',
          placeholder: '1',
          required: true,
          className: 'md:col-span-1',
          description: 'Sequential change number (Ch 1, Ch 2, etc.)'
        },
        {
          name: 'classificationPrefix',
          label: 'Classification Prefix',
          type: 'select',
          options: [
            { label: 'None (Unclassified)', value: '' },
            { label: 'C (Confidential)', value: 'C' },
            { label: 'S (Secret)', value: 'S' }
          ],
          defaultValue: '',
          className: 'md:col-span-1',
          description: 'Inherited from parent directive'
        },
        {
          name: 'fouoDesignation',
          label: 'FOUO Designation',
          type: 'select',
          options: [
            { label: 'None', value: '' },
            { label: 'Full FOUO', value: 'full' },
            { label: 'Partial FOUO', value: 'partial' }
          ],
          defaultValue: '',
          className: 'md:col-span-1'
        }
      ]
    }
  ]
};

// Create a union of all schemas for type inference
export const DocumentSchema = z.union([
  BasicLetterSchema,
  MultipleAddressLetterSchema,
  EndorsementSchema,
  AAFormSchema,
  MCOSchema,
  BulletinSchema,
  ChangeTransmittalSchema,
  Page11Schema,
  AMHSSchema,
  MFRSchema,
  FromToMemoSchema,
  LetterheadMemoSchema,
  CoordinationPageSchema,
  MOASchema,
  MOUSchema,
  StaffingPaperSchema,
  BusinessLetterSchema,
  ExecutiveCorrespondenceSchema,
]);

// Infer the FormData type from the union schema
export type LetterFormData = z.infer<typeof DocumentSchema>;

// A generic document type that can be one of any of the specific document types
export type GenericDocument = z.infer<typeof DocumentSchema>;

// Registry of all document types
export const DOCUMENT_TYPES: Record<string, DocumentTypeDefinition> = {
  basic: BasicLetterDefinition,
  'multiple-address': MultipleAddressLetterDefinition,
  endorsement: EndorsementDefinition,
  'aa-form': AAFormDefinition,
  mco: MCODefinition,
  bulletin: BulletinDefinition,
  'change-transmittal': ChangeTransmittalDefinition,
  page11: Page11Definition,
  mfr: MFRDefinition,
  'from-to-memo': FromToMemoDefinition,
  'letterhead-memo': LetterheadMemoDefinition,
  amhs: AMHSDefinition,
  moa: MOADefinition,
  mou: MOUDefinition,
  'information-paper': InformationPaperDefinition,
  'position-paper': PositionPaperDefinition,
  'decision-paper': DecisionPaperDefinition,
  'coordination-page': CoordinationPageDefinition,
  'business-letter': BusinessLetterDefinition,
  'executive-correspondence': ExecutiveCorrespondenceDefinition,
};
