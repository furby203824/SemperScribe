import { ParagraphData, FormData } from '@/types';
import { DOCUMENT_TYPES, PdfPipeline } from '@/lib/schemas';
import { generateBasePDFBlob } from '@/lib/pdf-generator';
import { generateNavmc10274 } from '@/services/pdf/navmc10274Generator';
import { generateNavmc11811 } from '@/services/pdf/navmc11811Generator';
import { Navmc11811Data } from '@/types/navmc';
import { mergeAdminSubsections } from '@/lib/naval-format-utils';

interface PdfBuildContext {
  formData: FormData;
  vias: string[];
  references: string[];
  enclosures: string[];
  copyTos: string[];
  paragraphs: ParagraphData[];
  distList?: string[];
}

function buildNavmc10274Data(ctx: PdfBuildContext) {
  return {
    actionNo: ctx.formData.actionNo || '',
    ssic: ctx.formData.ssic || '',
    date: ctx.formData.date || '',
    from: ctx.formData.from || '',
    orgStation: ctx.formData.orgStation || '',
    to: ctx.formData.to || '',
    via: ctx.vias.filter(v => v.trim()).join('\n'),
    subject: ctx.formData.subj || '',
    reference: ctx.references.filter(r => r.trim()).join('\n'),
    enclosure: ctx.enclosures.filter(e => e.trim()).join('\n'),
    supplementalInfo: ctx.paragraphs.map(p => p.content).join('\n'),
    supplementalInfoParagraphs: ctx.paragraphs,
    copyTo: ctx.copyTos.filter(c => c.trim()).join('\n'),
    signature: ctx.formData.sig || '',
  };
}

function buildNavmc11811Data(ctx: PdfBuildContext): Navmc11811Data {
  return {
    name: ctx.formData.name || '',
    edipi: ctx.formData.edipi || '',
    remarksLeft: ctx.formData.remarksLeft || '',
    remarksRight: ctx.formData.remarksRight || '',
  };
}

async function generateStandardPdf(ctx: PdfBuildContext): Promise<Blob> {
  const paragraphsToRender = mergeAdminSubsections(ctx.paragraphs, ctx.formData.adminSubsections);
  return generateBasePDFBlob(
    ctx.formData,
    ctx.vias,
    ctx.references,
    ctx.enclosures,
    ctx.copyTos,
    paragraphsToRender,
    ctx.distList || []
  );
}

async function generateNavmc10274Pdf(ctx: PdfBuildContext): Promise<Blob> {
  const data = buildNavmc10274Data(ctx);
  const pdfBytes = await generateNavmc10274(data);
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function generateNavmc11811Pdf(ctx: PdfBuildContext): Promise<Blob> {
  const data = buildNavmc11811Data(ctx);
  const pdfBytes = await generateNavmc11811(data);
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

const PIPELINE_MAP: Record<PdfPipeline, (ctx: PdfBuildContext) => Promise<Blob>> = {
  standard: generateStandardPdf,
  navmc10274: generateNavmc10274Pdf,
  navmc11811: generateNavmc11811Pdf,
  amhs: async () => new Blob([], { type: 'text/plain' }), // AMHS doesn't use PDF
};

/**
 * Generates a PDF blob for any document type using the pipeline
 * configured in its DocumentFeatures.
 */
export async function generatePdfForDocType(ctx: PdfBuildContext): Promise<Blob> {
  const docType = ctx.formData.documentType;
  const features = DOCUMENT_TYPES[docType]?.features;
  const pipeline: PdfPipeline = features?.pdfPipeline || 'standard';
  const generator = PIPELINE_MAP[pipeline];
  return generator(ctx);
}
