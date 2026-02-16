'use client';

import { useState, useCallback } from 'react';
import { FormData, ParagraphData } from '@/types';
import { Navmc11811Data } from '@/types/navmc';
import { generateBasePDFBlob, generatePDFBlob, getPDFPageCount, addMultipleSignaturesToBlob, ManualSignaturePosition } from '@/lib/pdf-generator';
import { generateDocxBlob } from '@/lib/docx-generator';
import { generateNavmc10274 } from '@/services/pdf/navmc10274Generator';
import { generateNavmc11811 } from '@/services/pdf/navmc11811Generator';
import { getExportFilename, mergeAdminSubsections } from '@/lib/naval-format-utils';
import { SignaturePosition } from '@/types';

/**
 * Hook for document generation (PDF, DOCX) and signature placement workflow.
 */
export function useDocumentExport() {
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signaturePdfBlob, setSignaturePdfBlob] = useState<Blob | null>(null);
  const [signaturePdfPageCount, setSignaturePdfPageCount] = useState(1);

  /**
   * Build a base PDF blob for a given document type and data.
   */
  const buildPdfBlob = useCallback(async (
    formData: FormData,
    vias: string[],
    references: string[],
    enclosures: string[],
    copyTos: string[],
    paragraphs: ParagraphData[],
    distList: string[]
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
   * Download a PDF (optionally with a signature field).
   */
  const downloadPDF = useCallback(async (
    formData: FormData,
    vias: string[],
    references: string[],
    enclosures: string[],
    copyTos: string[],
    paragraphs: ParagraphData[],
    withSignature?: ManualSignaturePosition,
    distList?: string[]
  ) => {
    try {
      const paragraphsToRender = mergeAdminSubsections(paragraphs, formData.adminSubsections);
      let blob: Blob;
      if (withSignature) {
        blob = await generatePDFBlob(formData, vias, references, enclosures, copyTos, paragraphsToRender, distList || [], withSignature);
      } else {
        blob = await generateBasePDFBlob(formData, vias, references, enclosures, copyTos, paragraphsToRender, distList || []);
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getExportFilename(formData, 'pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please check the console for details.');
    }
  }, []);

  /**
   * Generate and download document in the specified format.
   */
  const generateDocument = useCallback(async (
    format: 'docx' | 'pdf',
    formData: FormData,
    vias: string[],
    references: string[],
    enclosures: string[],
    copyTos: string[],
    paragraphs: ParagraphData[],
    distList: string[]
  ) => {
    if (format === 'pdf') {
      if (formData.documentType === 'aa-form') {
        try {
          const blob = await buildPdfBlob(formData, vias, references, enclosures, copyTos, paragraphs, distList);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = getExportFilename(formData, 'pdf');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error generating AA Form PDF:', error);
          alert('Failed to generate AA Form PDF.');
        }
      } else if (formData.documentType === 'page11') {
        try {
          const blob = await buildPdfBlob(formData, vias, references, enclosures, copyTos, paragraphs, distList);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `NAVMC_118(11)_${formData.name?.replace(/\s+/g, '_') || 'Page11'}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error generating Page 11 PDF:', error);
          alert('Failed to generate Page 11 PDF.');
        }
      } else {
        await downloadPDF(formData, vias, references, enclosures, copyTos, paragraphs, undefined, distList);
      }
    } else {
      try {
        const paragraphsToRender = (formData.documentType === 'mco' || (formData.documentType as string) === 'order')
          ? mergeAdminSubsections(paragraphs, formData.adminSubsections)
          : paragraphs;

        const blob = await generateDocxBlob(formData, vias, references, enclosures, copyTos, paragraphsToRender, distList);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = getExportFilename(formData, 'docx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error generating Docx:', error);
        alert('Failed to generate Word document.');
      }
    }
  }, [buildPdfBlob, downloadPDF]);

  /**
   * Open the signature placement modal.
   */
  const handleOpenSignaturePlacement = useCallback(async (
    formData: FormData,
    vias: string[],
    references: string[],
    enclosures: string[],
    copyTos: string[],
    paragraphs: ParagraphData[],
    distList: string[]
  ) => {
    try {
      const blob = await buildPdfBlob(formData, vias, references, enclosures, copyTos, paragraphs, distList);
      const pageCount = await getPDFPageCount(blob);
      setSignaturePdfBlob(blob);
      setSignaturePdfPageCount(pageCount);
      setShowSignatureModal(true);
    } catch (error) {
      console.error('Error preparing signature placement:', error);
      alert('Failed to prepare PDF for signature placement.');
    }
  }, [buildPdfBlob]);

  /**
   * Confirm signature placement and download the signed PDF.
   */
  const handleSignatureConfirm = useCallback(async (
    positions: SignaturePosition[],
    formData: FormData,
    vias: string[],
    references: string[],
    enclosures: string[],
    copyTos: string[],
    paragraphs: ParagraphData[],
    distList: string[]
  ) => {
    try {
      setShowSignatureModal(false);
      const baseBlob = await buildPdfBlob(formData, vias, references, enclosures, copyTos, paragraphs, distList);

      const manualPositions: ManualSignaturePosition[] = positions.map(pos => ({
        page: pos.page,
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        signerName: pos.signerName,
        reason: pos.reason,
        contactInfo: pos.contactInfo,
      }));

      const signedBlob = await addMultipleSignaturesToBlob(baseBlob, manualPositions);
      const filename = getExportFilename(formData, 'pdf');

      const url = window.URL.createObjectURL(signedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSignaturePdfBlob(null);
    } catch (error) {
      console.error('Error adding signature:', error);
      alert('Failed to add signature fields to PDF.');
    }
  }, [buildPdfBlob]);

  const handleSignatureCancel = useCallback(() => {
    setShowSignatureModal(false);
    setSignaturePdfBlob(null);
  }, []);

  return {
    showSignatureModal,
    signaturePdfBlob,
    signaturePdfPageCount,
    generateDocument,
    handleOpenSignaturePlacement,
    handleSignatureConfirm,
    handleSignatureCancel,
  };
}
