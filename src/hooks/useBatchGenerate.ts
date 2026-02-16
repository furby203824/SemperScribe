'use client';

import { useState, useCallback } from 'react';
import { FormData, ParagraphData } from '@/types';
import {
  MergeField,
  applyMergeRecord,
  generateCsvTemplate,
  parseCsv,
  validateCsvColumns,
  CsvParseResult,
} from '@/lib/merge-utils';
import { generateBasePDFBlob } from '@/lib/pdf-generator';
import { generateNavmc10274 } from '@/services/pdf/navmc10274Generator';
import { generateNavmc11811 } from '@/services/pdf/navmc11811Generator';
import { mergeAdminSubsections, getExportFilename } from '@/lib/naval-format-utils';
import { Navmc11811Data } from '@/types/navmc';
import JSZip from 'jszip';

export type BatchStatus = 'idle' | 'generating' | 'done' | 'error';

export interface BatchProgress {
  current: number;
  total: number;
  currentLabel: string;
  errors: { row: number; label: string; error: string }[];
}

export function useBatchGenerate() {
  const [status, setStatus] = useState<BatchStatus>('idle');
  const [progress, setProgress] = useState<BatchProgress>({ current: 0, total: 0, currentLabel: '', errors: [] });

  /**
   * Build a single PDF blob for one merged document.
   */
  const buildSinglePdf = useCallback(async (
    formData: FormData,
    vias: string[],
    references: string[],
    enclosures: string[],
    copyTos: string[],
    paragraphs: ParagraphData[],
    distList: string[],
  ): Promise<Blob> => {
    if (formData.documentType === 'aa-form') {
      const aaFormData = {
        actionNo: formData.actionNo || '',
        ssic: formData.ssic || '',
        date: formData.date || '',
        from: formData.from || '',
        orgStation: formData.orgStation || '',
        to: formData.to || '',
        via: vias.filter(v => v.trim()).join('\n'),
        subject: formData.subj || '',
        reference: references.filter(r => r.trim()).join('\n'),
        enclosure: enclosures.filter(e => e.trim()).join('\n'),
        supplementalInfo: paragraphs.map(p => p.content).join('\n'),
        supplementalInfoParagraphs: paragraphs,
        copyTo: copyTos.filter(c => c.trim()).join('\n'),
        signature: formData.sig || '',
      };
      const pdfBytes = await generateNavmc10274(aaFormData);
      return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    }

    if (formData.documentType === 'page11') {
      const navmcData: Navmc11811Data = {
        name: formData.name || '',
        edipi: formData.edipi || '',
        remarksLeft: formData.remarksLeft || '',
        remarksRight: formData.remarksRight || '',
      };
      const pdfBytes = await generateNavmc11811(navmcData);
      return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    }

    const paragraphsToRender = mergeAdminSubsections(paragraphs, formData.adminSubsections);
    return generateBasePDFBlob(formData, vias, references, enclosures, copyTos, paragraphsToRender, distList);
  }, []);

  /**
   * Export a CSV template for the given merge fields.
   */
  const exportCsvTemplate = useCallback((mergeFields: MergeField[]) => {
    const csv = generateCsvTemplate(mergeFields);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'merge_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, []);

  /**
   * Import and parse a CSV file. Returns parsed result.
   */
  const importCsv = useCallback(async (file: File): Promise<CsvParseResult> => {
    const text = await file.text();
    return parseCsv(text);
  }, []);

  /**
   * Validate imported CSV against expected merge fields.
   */
  const validateImport = useCallback((
    csvHeaders: string[],
    mergeFields: MergeField[]
  ) => {
    return validateCsvColumns(csvHeaders, mergeFields);
  }, []);

  /**
   * Run the batch: for each row in the CSV, substitute merge fields,
   * generate a PDF, and bundle everything into a ZIP.
   */
  const runBatch = useCallback(async (
    templateFormData: FormData,
    templateParagraphs: ParagraphData[],
    vias: string[],
    references: string[],
    enclosures: string[],
    copyTos: string[],
    distList: string[],
    mergeFields: MergeField[],
    rows: Record<string, string>[],
  ): Promise<void> => {
    setStatus('generating');
    setProgress({ current: 0, total: rows.length, currentLabel: 'Starting...', errors: [] });

    const zip = new JSZip();
    const errors: { row: number; label: string; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const record = rows[i];

      // Use the TO field or row number as a label for the filename
      const label = record['TO'] || record['NAME'] || record['SIGNATURE'] || `row_${i + 1}`;
      const safeLabel = label.replace(/[^A-Za-z0-9_\- ]/g, '').replace(/\s+/g, '_').slice(0, 60);

      setProgress(prev => ({
        ...prev,
        current: i,
        currentLabel: `Generating: ${label} (${i + 1}/${rows.length})`,
      }));

      try {
        // Apply merge substitutions
        const { formData: mergedFormData, paragraphs: mergedParagraphs } = applyMergeRecord(
          templateFormData,
          templateParagraphs,
          record,
          mergeFields,
        );

        // Generate PDF
        const blob = await buildSinglePdf(
          mergedFormData,
          vias,
          references,
          enclosures,
          copyTos,
          mergedParagraphs,
          distList,
        );

        // Determine filename
        const baseFilename = getExportFilename(mergedFormData, 'pdf').replace('.pdf', '');
        const filename = `${baseFilename}_${safeLabel}.pdf`;

        // Add to ZIP
        const arrayBuffer = await blob.arrayBuffer();
        zip.file(filename, arrayBuffer);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push({ row: i + 1, label, error: errorMsg });
      }
    }

    setProgress(prev => ({
      ...prev,
      current: rows.length,
      currentLabel: 'Creating ZIP archive...',
      errors,
    }));

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch_export_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setStatus('done');
      setProgress(prev => ({ ...prev, currentLabel: `Done! ${rows.length - errors.length} of ${rows.length} documents generated.` }));
    } catch (err) {
      setStatus('error');
      setProgress(prev => ({ ...prev, currentLabel: `ZIP creation failed: ${err}` }));
    }
  }, [buildSinglePdf]);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress({ current: 0, total: 0, currentLabel: '', errors: [] });
  }, []);

  return {
    status,
    progress,
    exportCsvTemplate,
    importCsv,
    validateImport,
    runBatch,
    reset,
  };
}
