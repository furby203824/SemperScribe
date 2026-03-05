import { describe, it, expect } from 'vitest';
import {
  DOCUMENT_TYPES,
  DLAMemorandumSchema,
  DLABusinessLetterSchema,
  DLAMemorandumDefinition,
  DLABusinessLetterDefinition,
} from '@/lib/schemas';
import { DOCUMENT_TEMPLATES } from '@/lib/templates';
import { runProofreadChecks } from '@/lib/proofread-checks';

describe('DLA Correspondence Schemas', () => {
  describe('DLA Memorandum Schema', () => {
    it('accepts valid DLA memorandum data with Title Case subject', () => {
      const validData = {
        documentType: 'dla-memorandum',
        date: 'March 5, 2026',
        memorandumFor: 'Director, Defense Logistics Agency',
        subj: 'Preparing a Memorandum',
        line1: '',
        line2: '',
        line3: '',
      };
      const result = DLAMemorandumSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts ALL CAPS subject for DLA memorandum (backwards compatible)', () => {
      const data = {
        documentType: 'dla-memorandum',
        date: 'March 5, 2026',
        memorandumFor: 'Director, DLA',
        subj: 'ALL CAPS SUBJECT',
        line1: '',
        line2: '',
        line3: '',
      };
      const result = DLAMemorandumSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing MEMORANDUM FOR', () => {
      const invalidData = {
        documentType: 'dla-memorandum',
        date: 'March 5, 2026',
        memorandumFor: '',
        subj: 'Test Subject',
        line1: '',
        line2: '',
        line3: '',
      };
      const result = DLAMemorandumSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects empty subject', () => {
      const invalidData = {
        documentType: 'dla-memorandum',
        date: 'March 5, 2026',
        memorandumFor: 'Director, DLA',
        subj: '',
        line1: '',
        line2: '',
        line3: '',
      };
      const result = DLAMemorandumSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('accepts optional THROUGH field', () => {
      const data = {
        documentType: 'dla-memorandum',
        date: 'March 5, 2026',
        memorandumFor: 'Director, DLA',
        through: 'Deputy Director, DLA',
        subj: 'Test Subject',
        line1: '',
        line2: '',
        line3: '',
      };
      const result = DLAMemorandumSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts optional signerFullName with rank and title', () => {
      const data = {
        documentType: 'dla-memorandum',
        date: 'March 5, 2026',
        memorandumFor: 'Director, DLA',
        subj: 'Test Subject',
        signerFullName: 'JOHN M. HANCOCK',
        signerRank: 'Lieutenant General, USAF',
        signerTitle: 'Director',
        line1: '',
        line2: '',
        line3: '',
      };
      const result = DLAMemorandumSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('DLA Business Letter Schema', () => {
    it('accepts valid DLA business letter data', () => {
      const validData = {
        documentType: 'dla-business-letter',
        date: 'March 5, 2026',
        subj: 'BUSINESS LETTER SUBJECT',
        line1: '',
        line2: '',
        line3: '',
      };
      const result = DLABusinessLetterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts full business letter with recipient', () => {
      const data = {
        documentType: 'dla-business-letter',
        date: 'March 5, 2026',
        recipientName: 'Mr. John Doe',
        recipientTitle: 'Vice President',
        businessName: 'Acme Corp',
        recipientAddress: '123 Main St\nAnytown, VA 22030',
        salutation: 'Dear Mr. Doe:',
        subj: 'CONTRACT RENEWAL',
        complimentaryClose: 'Sincerely,',
        signerFullName: 'JANE M. SMITH',
        line1: '',
        line2: '',
        line3: '',
      };
      const result = DLABusinessLetterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

describe('DLA Document Type Definitions', () => {
  it('DLA Memorandum is registered in DOCUMENT_TYPES', () => {
    expect(DOCUMENT_TYPES['dla-memorandum']).toBeDefined();
    expect(DOCUMENT_TYPES['dla-memorandum'].id).toBe('dla-memorandum');
    expect(DOCUMENT_TYPES['dla-memorandum'].name).toBe('Standard Memorandum (DLA)');
  });

  it('DLA Business Letter is registered in DOCUMENT_TYPES', () => {
    expect(DOCUMENT_TYPES['dla-business-letter']).toBeDefined();
    expect(DOCUMENT_TYPES['dla-business-letter'].id).toBe('dla-business-letter');
    expect(DOCUMENT_TYPES['dla-business-letter'].name).toBe('Business Letter (DLA)');
  });

  it('DLA Memorandum features are correct', () => {
    const features = DLAMemorandumDefinition.features;
    expect(features.showVia).toBe(false);
    expect(features.showEndorsementDetails).toBe(false);
    expect(features.showReferences).toBe(true);
    expect(features.showEnclosures).toBe(true);
    expect(features.showParagraphs).toBe(true);
    expect(features.showSignature).toBe(true);
    expect(features.category).toBe('dla-correspondence');
    expect(features.pdfPipeline).toBe('standard');
  });

  it('DLA Business Letter features are correct', () => {
    const features = DLABusinessLetterDefinition.features;
    expect(features.showVia).toBe(false);
    expect(features.category).toBe('dla-correspondence');
  });
});

describe('DLA Templates', () => {
  it('DLA Memorandum template is registered', () => {
    const template = DOCUMENT_TEMPLATES['dla-memorandum'];
    expect(template).toBeDefined();
    expect(template.typeId).toBe('dla-memorandum');
    expect(template.defaultData.headerType).toBe('DLA');
    expect(template.defaultData.memorandumFor).toBeTruthy();
    expect(template.defaultData.signerFullName).toBeTruthy();
  });

  it('DLA Memorandum template has rank and title defaults', () => {
    const template = DOCUMENT_TEMPLATES['dla-memorandum'];
    expect(template.defaultData.signerRank).toBeTruthy();
    expect(template.defaultData.signerTitle).toBeTruthy();
  });

  it('DLA Memorandum template uses Title Case subject', () => {
    const template = DOCUMENT_TEMPLATES['dla-memorandum'];
    expect(template.formatting?.subjectCase).toBe('titlecase');
    // Subject should not be ALL CAPS
    expect(template.defaultData.subj).not.toBe(template.defaultData.subj?.toUpperCase());
  });

  it('DLA Business Letter template is registered', () => {
    const template = DOCUMENT_TEMPLATES['dla-business-letter'];
    expect(template).toBeDefined();
    expect(template.typeId).toBe('dla-business-letter');
    expect(template.defaultData.headerType).toBe('DLA');
    expect(template.defaultData.salutation).toBeTruthy();
    expect(template.defaultData.signerFullName).toBeTruthy();
  });

  it('DLA templates use civilian date style', () => {
    expect(DOCUMENT_TEMPLATES['dla-memorandum'].formatting?.dateStyle).toBe('civilian');
    expect(DOCUMENT_TEMPLATES['dla-business-letter'].formatting?.dateStyle).toBe('civilian');
  });
});

describe('DLA Proofreading Checks', () => {
  const baseMemoData = {
    documentType: 'dla-memorandum',
    date: 'March 5, 2026',
    memorandumFor: 'Director, DLA',
    subj: 'Preparing a Memorandum',
    signerFullName: 'JOHN M. HANCOCK',
    headerType: 'DLA',
    line1: 'DEFENSE LOGISTICS AGENCY',
  };

  it('passes signature check with signerFullName', () => {
    const checks = runProofreadChecks(
      baseMemoData as any,
      [{ id: 1, level: 1, content: 'Test paragraph.' }],
      [],
      [],
    );
    const sigCheck = checks.find(c => c.id === 'signature');
    expect(sigCheck).toBeDefined();
    expect(sigCheck?.status).toBe('pass');
    expect(sigCheck?.detail).toContain('JOHN M. HANCOCK');
  });

  it('warns when signerFullName is missing', () => {
    const noSigData = { ...baseMemoData, signerFullName: '' };
    const checks = runProofreadChecks(
      noSigData as any,
      [{ id: 1, level: 1, content: 'Test paragraph.' }],
      [],
      [],
    );
    const sigCheck = checks.find(c => c.id === 'signature');
    expect(sigCheck?.status).toBe('warn');
  });

  it('skips SSIC check for DLA types', () => {
    const checks = runProofreadChecks(
      baseMemoData as any,
      [{ id: 1, level: 1, content: 'Test paragraph.' }],
      [],
      [],
    );
    const ssicCheck = checks.find(c => c.id === 'ssic-format');
    expect(ssicCheck).toBeUndefined();
  });

  it('checks Title Case subject for DLA memo (passes with capitalized first letter)', () => {
    const checks = runProofreadChecks(
      baseMemoData as any,
      [{ id: 1, level: 1, content: 'Test paragraph.' }],
      [],
      [],
    );
    const subjCheck = checks.find(c => c.id === 'subject-caps');
    expect(subjCheck).toBeDefined();
    expect(subjCheck?.status).toBe('pass');
    expect(subjCheck?.label).toContain('Title Case');
  });

  it('warns on DLA memo subject starting with lowercase', () => {
    const lowercaseData = { ...baseMemoData, subj: 'lowercase subject' };
    const checks = runProofreadChecks(
      lowercaseData as any,
      [{ id: 1, level: 1, content: 'Test paragraph.' }],
      [],
      [],
    );
    const subjCheck = checks.find(c => c.id === 'subject-caps');
    expect(subjCheck).toBeDefined();
    expect(subjCheck?.status).toBe('warn');
  });

  it('DLA business letter still checks ALL CAPS subject', () => {
    const bizLetterData = {
      ...baseMemoData,
      documentType: 'dla-business-letter',
      subj: 'lowercase subject',
    };
    const checks = runProofreadChecks(
      bizLetterData as any,
      [{ id: 1, level: 1, content: 'Test paragraph.' }],
      [],
      [],
    );
    const subjCheck = checks.find(c => c.id === 'subject-caps');
    expect(subjCheck).toBeDefined();
    expect(subjCheck?.status).toBe('fail');
  });
});
