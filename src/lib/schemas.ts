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

// 2. Endorsement
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
    })).optional()
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

// Registry of all document types
export const DOCUMENT_TYPES: Record<string, DocumentTypeDefinition> = {
  basic: BasicLetterDefinition,
  endorsement: EndorsementDefinition,
  'aa-form': AAFormDefinition,
  mco: MCODefinition,
  bulletin: BulletinDefinition,
  page11: Page11Definition
};
