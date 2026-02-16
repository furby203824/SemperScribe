
import fs from 'fs';
import path from 'path';
import { DOCUMENT_TEMPLATES } from '../src/lib/templates';
import { NLDPFile } from '../src/lib/nldp-format';

// Mapping for human-readable filenames
const FILENAME_MAP: Record<string, string> = {
  'basic': 'usmc-basic-letter',
  'business-letter': 'business-letter',
  'endorsement': 'endorsement',
  'mfr': 'memorandum-for-record',
  'aa-form': 'aa-form',
  'position-paper': 'position-paper',
  'information-paper': 'information-paper',
  'from-to-memo': 'from-to-memo',
  'letterhead-memo': 'letterhead-memo',
  'moa': 'memorandum-of-agreement',
  'mou': 'memorandum-of-understanding',
  'mco': 'marine-corps-order',
  'bulletin': 'marine-corps-bulletin'
};

const OUTPUT_DIR = path.join(process.cwd(), 'public/templates/global');
const INDEX_FILE = path.join(OUTPUT_DIR, 'index.json');

// Helper to generate NLDP structure
function createNLDP(template: any): NLDPFile {
  // Destructure the merged defaultData to separate arrays from formData
  const { 
    vias, 
    references, 
    enclosures, 
    copyTos, 
    paragraphs, 
    ...formData 
  } = template.defaultData;

  return {
    metadata: {
      packageId: `nldp_${Date.now()}_${template.typeId}`,
      formatVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      author: {
        name: 'System Template',
        unit: 'HQMC'
      },
      package: {
        title: template.name,
        description: template.description,
        subject: formData.subj || 'TEMPLATE',
        documentType: template.typeId as any,
        tags: ['template', 'standard']
      },
      checksums: {
        dataHash: '', // skipped for generation
        crc32: ''    // skipped for generation
      }
    },
    data: {
      formData: formData as any,
      vias: vias || [],
      references: references || [],
      enclosures: enclosures || [],
      copyTos: copyTos || [],
      paragraphs: paragraphs || []
    }
  };
}

async function generate() {
  console.log(`Generating templates in ${OUTPUT_DIR}...`);

  // 1. Read existing index to preserve manual entries if needed (optional, but good practice)
  // For now, we will overwrite or append. Let's start fresh with our comprehensive list + existing special ones.
  
  const existingIndex = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  // Filter out the "standard" ones we are about to regenerate to avoid duplicates
  // Keep the "special" ones like CDDM or Page 11 examples if they aren't covered by our base types
  const specialTemplates = existingIndex.filter((item: any) => 
    !Object.keys(FILENAME_MAP).includes(item.documentType) && 
    !['usmc-basic-letter'].includes(item.id) // Remove old basic letter
  );

  const newIndexEntries: any[] = [];

  for (const [key, template] of Object.entries(DOCUMENT_TEMPLATES)) {
    if (!FILENAME_MAP[key]) continue; // Skip aliases like 'page11' placeholder for now if not mapped

    const filename = `${FILENAME_MAP[key]}.nldp`;
    const filePath = path.join(OUTPUT_DIR, filename);
    const nldp = createNLDP(template);

    fs.writeFileSync(filePath, JSON.stringify(nldp, null, 2));
    console.log(`Created: ${filename}`);

    newIndexEntries.push({
      id: FILENAME_MAP[key],
      title: template.name,
      description: template.description,
      documentType: template.typeId,
      url: `/templates/global/${filename}`
    });
  }

  // Merge and Write Index
  // Put new standard templates first, then special examples
  const finalIndex = [...newIndexEntries, ...specialTemplates];
  
  fs.writeFileSync(INDEX_FILE, JSON.stringify(finalIndex, null, 2));
  console.log(`Updated index.json with ${finalIndex.length} templates.`);
}

generate().catch(console.error);
