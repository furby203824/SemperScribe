# Document Templates

This directory contains the "Golden Master" templates for all document types supported by the system.
These templates serve as the source of truth for:
1.  **Default Data:** Fully populated examples of valid documents.
2.  **Validation:** Integration with Zod schemas defined in `src/lib/schemas.ts`.
3.  **Formatting:** Guidelines for rendering and text formatting.

## Template Structure

Each template follows the `DocumentTemplate` interface defined in `types.ts`:

```typescript
export interface DocumentTemplate {
  id: string;              // Unique ID (e.g., 'basic-letter-default')
  typeId: string;          // Document Type (e.g., 'basic')
  name: string;            // Human readable name
  description: string;     // Purpose description
  definition: DocumentTypeDefinition; // Link to Schema & UI config
  defaultData: FormData;   // The complete data object
  formatting?: {           // Optional formatting hints
    dateStyle?: string;
    subjectCase?: string;
    font?: string;
  };
}
```

## Usage

### Loading a Template
To load the default data for a specific document type:

```typescript
import { getTemplateForType } from '@/lib/templates';

const template = getTemplateForType('business-letter');
const initialData = template.defaultData;
```

### Validating Against a Template
The template includes the Zod schema in its `definition` property:

```typescript
import { getTemplateForType } from '@/lib/templates';

const template = getTemplateForType('basic');
const result = template.definition.schema.safeParse(someData);

if (result.success) {
  console.log("Valid!");
} else {
  console.error(result.error);
}
```

### Exporting Static Templates
To get a JSON-serializable version (without the schema functions) for export:

```typescript
import { getStaticTemplate } from '@/lib/templates';

const jsonTemplate = getStaticTemplate('mfr');
console.log(JSON.stringify(jsonTemplate, null, 2));
```

## Available Templates

- **Basic Letter** (`basic`)
- **Business Letter** (`business-letter`)
- **Endorsement** (`endorsement`)
- **Memorandum for the Record** (`mfr`)
- **AA Form** (`aa-form`)
- **Position/Decision Paper** (`position-paper`)
- **Information Paper** (`information-paper`)
- **From-To Memorandum** (`from-to-memo`)
- **Letterhead Memorandum** (`letterhead-memo`)
- **Memorandum of Agreement** (`moa`)
- **Memorandum of Understanding** (`mou`)
- **Marine Corps Order** (`mco`)
- **Bulletin** (`bulletin`)
