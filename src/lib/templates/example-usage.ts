import { getTemplateForType, getStaticTemplate } from './index';

/**
 * Example usage of the Document Template System
 */

function runExample() {
  console.log("--- Document Template System Example ---\n");

  // 1. Load a Business Letter Template
  console.log("1. Loading Business Letter Template...");
  const bizTemplate = getTemplateForType('business-letter');
  
  console.log(`Loaded: ${bizTemplate.name}`);
  console.log(`Description: ${bizTemplate.description}`);
  console.log(`Default Subject: ${bizTemplate.defaultData.subj}`);
  
  // 2. Validate the Default Data (Should always be true)
  console.log("\n2. Validating Default Data...");
  const validationResult = bizTemplate.definition.schema.safeParse(bizTemplate.defaultData);
  
  if (validationResult.success) {
    console.log("✅ Default data is valid according to schema.");
  } else {
    console.error("❌ Default data failed validation:", validationResult.error);
  }

  // 3. Simulate Invalid Data
  console.log("\n3. Testing Validation with Invalid Data...");
  const invalidData = { ...bizTemplate.defaultData, date: '' }; // Date is required
  const invalidResult = bizTemplate.definition.schema.safeParse(invalidData);
  
  if (!invalidResult.success) {
    console.log("✅ Correctly caught invalid data.");
    console.log("Error:", invalidResult.error.issues[0].message);
  }

  // 4. Export to JSON
  console.log("\n4. Exporting Static Template to JSON...");
  const staticJson = getStaticTemplate('business-letter');
  console.log(JSON.stringify(staticJson, null, 2).substring(0, 200) + "...");
}

// Run if called directly (in a test environment)
runExample();

export { runExample };
