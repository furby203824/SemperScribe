'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { ParagraphData, SavedLetter, ValidationState, FormData, AdminSubsections } from '@/types';
import { ModernAppShell } from '@/components/layout/ModernAppShell';
import { UnitInfoSection } from '@/components/letter/UnitInfoSection';
import { ParagraphSection } from '@/components/letter/ParagraphSection';
import { ClosingBlockSection } from '@/components/letter/ClosingBlockSection';
import { ViaSection } from '@/components/letter/ViaSection';
import { ReferencesSection } from '@/components/letter/ReferencesSection';
import { EnclosuresSection } from '@/components/letter/EnclosuresSection';
import { MOAFormSection } from '@/components/letter/MOAFormSection';
import { DecisionGridSection } from '@/components/letter/DecisionGridSection';
import { ReportsSection } from '@/components/letter/ReportsSection';
import { DistributionStatementSection } from '@/components/letter/DistributionStatementSection';
import { DistributionSection } from '@/components/letter/DistributionSection';
import { StructuredReferenceInput } from '@/components/letter/StructuredReferenceInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileSignature } from 'lucide-react';
import { useEDMSContext, isEditMode } from '@/hooks/useEDMSContext';
import { UNITS } from '@/lib/units';
import { getTodaysDate } from '@/lib/date-utils';
import { getMCOParagraphs, getMCBulParagraphs, getMOAParagraphs, getInformationPaperParagraphs, getPositionPaperParagraphs, getBusinessLetterParagraphs, mergeAdminSubsections } from '@/lib/naval-format-utils';
import { validateSSIC, validateSubject, validateFromTo } from '@/lib/validation-utils';
import { loadSavedLetters, saveLetterToStorage } from '@/lib/storage-utils';
import { generateBasePDFBlob, getPDFPageCount } from '@/lib/pdf-generator';
import { generateNavmc10274 } from '@/services/pdf/navmc10274Generator';
import { generateNavmc11811 } from '@/services/pdf/navmc11811Generator';
import { Navmc11811Data } from '@/types/navmc';
import { SignaturePlacementModal } from '@/components/SignaturePlacementModal';
import { configureConsole, debugUserAction, debugFormChange } from '@/lib/console-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { DOCUMENT_TYPES } from '@/lib/schemas';
import { AMHSEditor } from '@/components/amhs/AMHSEditor';
import { AMHSPreview } from '@/components/amhs/AMHSPreview';
import { LandingPage } from '@/components/layout/LandingPage';
import { useToast } from '@/hooks/use-toast';
import { getStateFromUrl, clearShareParam } from '@/lib/url-state';
import { useParagraphs } from '@/hooks/useParagraphs';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useDocumentExport } from '@/hooks/useDocumentExport';
import { useImportExport } from '@/hooks/useImportExport';

import { CopyToSection } from '@/components/letter/CopyToSection';

// Inner component that uses useSearchParams (requires Suspense boundary)
function NavalLetterGeneratorInner() {
  // Configure console to suppress browser extension errors
  useEffect(() => {
    configureConsole();
  }, []);

  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    documentType: '',
    endorsementLevel: '',
    basicLetterReference: '',
    basicLetterSsic: '',
    referenceWho: '',
    referenceType: '',
    referenceDate: '',
    startingReferenceLevel: 'a',
    startingEnclosureNumber: '1',
    line1: '', line2: '', line3: '', ssic: '', originatorCode: '', date: '', from: '', to: '', subj: '', sig: '', delegationText: '',
    startingPageNumber: 1,
    previousPackagePageCount: 0,
    headerType: 'USMC',
    bodyFont: 'times',
    directiveTitle: '',
    cancellationDate: '',
    cancellationType: 'fixed',
    distribution: { type: 'none' },
    reports: [],
    adminSubsections: {
      recordsManagement: { show: false, content: '', order: 0 },
      privacyAct: { show: false, content: '', order: 0 },
      reportsRequired: { show: false, content: 'None.', order: 0 }
    },
    actionNo: '',
    orgStation: '',
    name: '',
    edipi: '',
  });

  const handleDynamicFormSubmit = useCallback((data: any) => {
    // Merge dynamic form data into main state
    setFormData(prev => {
        // Defensive check: Ensure Unit Info fields are not accidentally overwritten
        // if the dynamic form sends empty values for them (which it shouldn't, but for safety).
        // Only allow overwrite if the new value is truthy or if we are sure it's intentional.
        // Since DynamicForm schemas don't manage these fields, we preserve previous values if data tries to clear them.
        
        const protectedFields = ['line1', 'line2', 'line3'];
        const safeData = { ...data };
        
        protectedFields.forEach(field => {
            // If prev has a value, and data has a falsy value (undefined/empty), preserve prev
            if (prev[field as keyof FormData] && !safeData[field]) {
                delete safeData[field];
            }
        });

        return {
            ...prev,
            ...safeData,
        };
    });
    debugFormChange('Dynamic Form Update', data);
  }, []);

  const [validation, setValidation] = useState<ValidationState>({
    ssic: { isValid: false, message: '' },
    subj: { isValid: false, message: '' },
    from: { isValid: false, message: '' },
    to: { isValid: false, message: '' }
  });

  const [vias, setVias] = useState<string[]>(['']);
  const [references, setReferences] = useState<string[]>(['']);
  const [enclosures, setEnclosures] = useState<string[]>(['']);
  const [copyTos, setCopyTos] = useState<string[]>(['']);
  const [distList, setDistList] = useState<string[]>(['']);

  // Paragraph management (extracted hook)
  const {
    paragraphs, setParagraphs,
    addParagraph, removeParagraph, updateParagraphContent,
    moveParagraphUp, moveParagraphDown,
    getUiCitation, validateParagraphNumbering,
  } = useParagraphs();

  const [savedLetters, setSavedLetters] = useState<SavedLetter[]>([]);

  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Voice input (extracted hook)
  const { activeVoiceInput, toggleVoiceInput } = useVoiceInput(paragraphs, updateParagraphContent);

  // Key to force form remount on import
  const [formKey, setFormKey] = useState(0);

  // Document export (extracted hook)
  const {
    generateDocument: generateDocumentFromHook,
    handleOpenSignaturePlacement,
    showSignatureModal,
    signaturePdfBlob,
    signaturePdfPageCount,
    handleSignatureConfirm,
    handleSignatureCancel
  } = useDocumentExport();

  // EDMS Integration
  const edmsContext = useEDMSContext();
  const [currentUnitCode, setCurrentUnitCode] = useState<string | undefined>(undefined);
  const [currentUnitName, setCurrentUnitName] = useState<string | undefined>(undefined);
  const [isLoadingFromEDMS, setIsLoadingFromEDMS] = useState(false);

  // Load saved letters
  useEffect(() => {
    const letters = loadSavedLetters();
    setSavedLetters(letters);
  }, []);

  // Set today's date
  useEffect(() => {
    setFormData(prev => ({ ...prev, date: getTodaysDate() }));
  }, []);

  // Auto-select unit from EDMS
  useEffect(() => {
    if (edmsContext.isLinked && edmsContext.unitCode) {
      const matchedUnit = UNITS.find(u => u.ruc === edmsContext.unitCode);
      if (matchedUnit) {
        setFormData(prev => ({
          ...prev,
          line1: matchedUnit.unitName.toUpperCase(),
          line2: matchedUnit.streetAddress.toUpperCase(),
          line3: `${matchedUnit.cityState} ${matchedUnit.zip}`.toUpperCase(),
        }));
        setCurrentUnitCode(matchedUnit.ruc);
        setCurrentUnitName(matchedUnit.unitName.toUpperCase());
      }
    }
  }, [edmsContext.isLinked, edmsContext.unitCode]);

  // Load existing letter from EDMS
  useEffect(() => {
    if (isEditMode(edmsContext)) {
      setIsLoadingFromEDMS(true);
      fetch(edmsContext.fileUrl)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
          return res.json();
        })
        .then(letterData => {
          setFormData(prev => ({
            ...prev,
            ssic: letterData.ssic || '',
            subj: letterData.subject || '',
            from: letterData.from || '',
            to: letterData.to || '',
            date: letterData.date || prev.date,
            sig: letterData.signature || '',
            originatorCode: letterData.originatorCode || '',
            documentType: letterData.letterType || 'basic',
            headerType: letterData.headerType || 'USMC',
            line1: letterData.unit?.line1 || prev.line1,
            line2: letterData.unit?.line2 || prev.line2,
            line3: letterData.unit?.line3 || prev.line3,
          }));

          if (letterData.via?.length) setVias(letterData.via);
          if (letterData.references?.length) setReferences(letterData.references);
          if (letterData.enclosures?.length) setEnclosures(letterData.enclosures);
          if (letterData.copyTos?.length) setCopyTos(letterData.copyTos);
          if (letterData.distList?.length) setDistList(letterData.distList);
          if (letterData.paragraphs?.length) setParagraphs(letterData.paragraphs);

          if (letterData.ssic) handleValidateSSIC(letterData.ssic);
          if (letterData.subject) handleValidateSubject(letterData.subject);
          if (letterData.from) handleValidateFromTo(letterData.from, 'from');
          if (letterData.to) handleValidateFromTo(letterData.to, 'to');
          
          setFormKey(prev => prev + 1);
        })
        .catch(err => console.error('Failed to load letter from EDMS:', err))
        .finally(() => setIsLoadingFromEDMS(false));
    }
  }, [edmsContext.mode, edmsContext.fileUrl]);

  // Handle Cancellation Contingency for MCBul
  useEffect(() => {
    if (formData.documentType === 'bulletin') {
      const needsContingencyPara = formData.cancellationType === 'contingent';
      const hasContingencyPara = paragraphs.some(p => p.title === 'Cancellation Contingency');
      
      if (needsContingencyPara && !hasContingencyPara) {
        const newId = (paragraphs.length > 0 ? Math.max(...paragraphs.map(p => p.id)) : 0) + 1;
        setParagraphs(prev => [...prev, {
          id: newId,
          level: 1,
          content: '',
          isMandatory: true,
          title: 'Cancellation Contingency'
        }]);
      } else if (!needsContingencyPara && hasContingencyPara) {
        setParagraphs(prev => prev.filter(p => p.title !== 'Cancellation Contingency'));
      }
    }
  }, [formData.documentType, formData.cancellationType, paragraphs]);

  // VIP Mode Logic for Business Letter
  useEffect(() => {
    if (formData.documentType === 'business-letter') {
        if (formData.isVipMode) {
            setFormData(prev => ({ ...prev, complimentaryClose: 'Very respectfully,' }));
        } else if (formData.complimentaryClose === 'Very respectfully,') {
            setFormData(prev => ({ ...prev, complimentaryClose: 'Sincerely,' }));
        }
    }
  }, [formData.documentType, formData.isVipMode]);

  // Sync Reports to Admin Subsections
  useEffect(() => {
    if (formData.documentType === 'mco') {
      let content = 'None.';
      const validReports = formData.reports?.filter(r => r.title) || [];
      
      if (validReports.length > 0) {
        const reportTexts = validReports.map(r => {
          if (r.exempt) {
            return `${r.title} is exempt from reports control.`;
          }
          return `${r.title} (Report Control Symbol ${r.controlSymbol || 'TBD'})`;
        });
        content = reportTexts.join(' ');
      }

      // Only update if content changed to avoid infinite loop
      if (formData.adminSubsections?.reportsRequired?.content !== content) {
         setFormData(prev => ({
            ...prev,
            adminSubsections: {
                ...prev.adminSubsections!,
                reportsRequired: {
                    ...prev.adminSubsections!.reportsRequired,
                    content
                }
            }
         }));
      }
    }
  }, [formData.reports, formData.documentType]);

  // Manual Preview Generation
  const handleUpdatePreview = useCallback(async () => {
    setIsGeneratingPreview(true);
    try {
      let blob: Blob;

      if (formData.documentType === 'page11') {
        const page11Data: Navmc11811Data = {
          name: formData.name || '',
          edipi: formData.edipi || '',
          remarksLeft: formData.remarksLeft,
          remarksRight: formData.remarksRight
        };
        const pdfBytes = await generateNavmc11811(page11Data);
        blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      } else if (formData.documentType === 'aa-form') {
         const pdfBytes = await generateNavmc10274({
            actionNo: formData.actionNo || '',
            ssic: formData.ssic || '',
            date: formData.date || '',
            from: formData.from || '',
            orgStation: formData.orgStation || '',
            to: formData.to || '',
            via: vias[0] || '',
            subject: formData.subj || '',
            reference: references[0] || '',
            enclosure: enclosures[0] || '',
            supplementalInfo: '',
            copyTo: copyTos[0] || '',
            isDraft: true
         });
         blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      } else {
        // Standard Naval Letter
        // Skip if critical data is missing
        if (!formData.subj && !formData.from) {
            setIsGeneratingPreview(false);
            return;
        }

        // Merge Admin Subsections for preview
        const paragraphsToRender = mergeAdminSubsections(paragraphs, formData.adminSubsections);

        blob = await generateBasePDFBlob(
          formData,
          vias,
          references,
          enclosures,
          copyTos,
          paragraphsToRender,
          distList
        );

        // Check for One Page Limit for Staffing Papers
        if (['position-paper', 'information-paper'].includes(formData.documentType)) {
             try {
                 const pageCount = await getPDFPageCount(blob);
                 if (formData.documentType === 'position-paper') {
                     // MCO 5216.20B: 1 Page Preferred, 2 Pages Max
                     if (pageCount > 2) {
                         toast({
                             title: "Exceeds 2-Page Limit",
                             description: "Position Papers must strictly not exceed 2 pages. Move detailed analysis to Tabs.",
                             variant: "destructive",
                             duration: 6000,
                         });
                     } else if (pageCount === 2) {
                         toast({
                             title: "Approaching Limit (2 Pages)",
                             description: "Position Papers are preferred to be 1 page. Ensure complexity justifies the 2nd page.",
                             variant: "default",
                             duration: 4000,
                         });
                     }
                 } else {
                     // Other staffing papers usually 1 page
                     if (pageCount > 1) {
                         toast({
                             title: "Content Exceeds One Page",
                             description: `${formData.documentType.replace('-', ' ').toUpperCase()}s must be strictly one page. Please reduce content.`,
                             variant: "destructive",
                             duration: 5000,
                         });
                     }
                 }
             } catch (err) {
                 console.error("Failed to check page count", err);
             }
        }
      }

      const url = URL.createObjectURL(blob);
      setPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (e) {
      console.error("Preview generation failed", e);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [formData, vias, references, enclosures, copyTos, paragraphs, distList]);

  // Initial Preview Generation
  useEffect(() => {
    handleUpdatePreview();
  }, []); // Only run on mount

  // Handlers
  const handleValidateSSIC = (value: string) => {
    setValidation(prev => ({ ...prev, ssic: validateSSIC(value) }));
  };

  const handleValidateSubject = (value: string) => {
    setValidation(prev => ({ ...prev, subj: validateSubject(value) }));
  };

  const handleValidateFromTo = (value: string, field: 'from' | 'to') => {
    setValidation(prev => ({ ...prev, [field]: validateFromTo(value) }));
  };

  // Import/Export operations (extracted hook)
  const {
    handleImport, handleLoadDraft, handleLoadTemplateUrl,
    handleExportNldp, handleShareLink, handleCopyAMHS, handleExportAMHS,
  } = useImportExport({
    formData, setFormData, paragraphs, setParagraphs,
    vias, setVias, references, setReferences,
    enclosures, setEnclosures, copyTos, setCopyTos,
    distList, setDistList, setFormKey, setValidation,
    savedLetters, toast,
  });

  const handleUpdateAdminSubsection = (key: keyof AdminSubsections, field: 'show' | 'content' | 'order', value: any) => {
    setFormData(prev => {
        const currentSubsections = prev.adminSubsections || {
            recordsManagement: { show: false, content: '', order: 0 },
            privacyAct: { show: false, content: '', order: 0 },
            reportsRequired: { show: false, content: 'None.', order: 0 }
        };
        
        return {
            ...prev,
            adminSubsections: {
                ...currentSubsections,
                [key]: {
                    ...currentSubsections[key],
                    [field]: value
                }
            }
        };
    });
  };

  const handleDocumentTypeChange = (newType: string) => {
    let newParagraphs: ParagraphData[] = [{ id: 1, level: 1, content: '', acronymError: '' }];
    if (newType === 'mco') {
      newParagraphs = getMCOParagraphs();
    } else if (newType === 'bulletin') {
      newParagraphs = getMCBulParagraphs();
    } else if (newType === 'moa' || newType === 'mou') {
      newParagraphs = getMOAParagraphs(newType as 'moa' | 'mou');
    } else if (newType === 'information-paper') {
      newParagraphs = getInformationPaperParagraphs();
    } else if (newType === 'position-paper') {
      newParagraphs = getPositionPaperParagraphs();
    } else if (newType === 'business-letter') {
      newParagraphs = getBusinessLetterParagraphs();
    } else {
       if (formData.documentType === 'mco' || formData.documentType === 'bulletin') {
          newParagraphs = [{ id: 1, level: 1, content: '', acronymError: '' }];
       } else {
          newParagraphs = paragraphs;
       }
    }

    setFormData(prev => ({
      ...prev,
      documentType: newType as FormData['documentType'],
      endorsementLevel: newType === 'basic' ? '' : prev.endorsementLevel,
      basicLetterReference: newType === 'basic' ? '' : prev.basicLetterReference,
      referenceWho: newType === 'basic' ? '' : prev.referenceWho,
      referenceType: newType === 'basic' ? '' : prev.referenceType,
      referenceDate: newType === 'basic' ? '' : prev.referenceDate,
      startingReferenceLevel: 'a',
      startingEnclosureNumber: '1',
      startingPageNumber: 1,
      previousPackagePageCount: 0,
    }));
    
    setParagraphs(newParagraphs);
  };

  const saveLetter = () => {
    debugUserAction('Save Letter', {
      subject: formData.subj.substring(0, 30) + (formData.subj.length > 30 ? '...' : ''),
      paragraphCount: paragraphs.length
    });

    const now = new Date();
    const newLetter: SavedLetter = {
      ...formData,
      id: now.toISOString(),
      savedAt: now.toLocaleString(),
      vias,
      references,
      enclosures,
      copyTos,
      distList,
      paragraphs,
    };

    const updatedLetters = saveLetterToStorage(newLetter, savedLetters);
    setSavedLetters(updatedLetters);
  };

  // Thin wrappers for hook-based document generation
  const generateDocument = (format: 'docx' | 'pdf') =>
    generateDocumentFromHook(format, formData, vias, references, enclosures, copyTos, paragraphs, distList);

  const handleAddSignature = useCallback(() => {
    handleOpenSignaturePlacement(
        formData,
        vias,
        references,
        enclosures,
        copyTos,
        paragraphs,
        distList
    );
  }, [handleOpenSignaturePlacement, formData, vias, references, enclosures, copyTos, paragraphs, distList]);

  const handleClearForm = () => {
      if (window.confirm('Are you sure you want to clear the form? All unsaved progress will be lost.')) {
        const currentType = formData.documentType;

        setFormData({
            documentType: currentType,
            endorsementLevel: '',
            basicLetterReference: '',
            referenceWho: '',
            referenceType: '',
            referenceDate: '',
            startingReferenceLevel: 'a',
            startingEnclosureNumber: '1',
            line1: '', line2: '', line3: '', ssic: '', originatorCode: '', date: getTodaysDate(), from: '', to: '', subj: '', sig: '', delegationText: '',
            startingPageNumber: 1,
            previousPackagePageCount: 0,
            headerType: 'USMC',
            bodyFont: 'times',
            directiveTitle: '',
            cancellationDate: '',
            cancellationType: 'fixed',
            distribution: { type: 'none' },
            reports: [],
            actionNo: '',
            orgStation: '',
            name: '',
            edipi: '',
            // AMHS Specific
            amhsMessageType: 'GENADMIN',
            amhsClassification: 'UNCLASSIFIED',
            amhsPrecedence: 'ROUTINE',
            amhsDtg: '',
            amhsOfficeCode: '',
            amhsPocs: [],
            amhsReferences: [],
            amhsTextBody: ''
        });
        setParagraphs([{ id: 1, level: 1, content: '', acronymError: '' }]);
        setVias(['']);
        setReferences(['']);
        setEnclosures(['']);
        setCopyTos(['']);
        setDistList(['']);
        setValidation({
            ssic: { isValid: false, message: '' },
            subj: { isValid: false, message: '' },
            from: { isValid: false, message: '' },
            to: { isValid: false, message: '' }
        });
        setFormKey(prev => prev + 1);
      }
  };

  // Load shared state from URL on mount
  useEffect(() => {
    const sharedState = getStateFromUrl();
    if (sharedState) {
      setFormData(sharedState.formData);
      if (sharedState.paragraphs) setParagraphs(sharedState.paragraphs);
      if (sharedState.references) setReferences(sharedState.references);
      if (sharedState.enclosures) setEnclosures(sharedState.enclosures);
      if (sharedState.vias) setVias(sharedState.vias);
      if (sharedState.copyTos) setCopyTos(sharedState.copyTos);
      if (sharedState.distList) setDistList(sharedState.distList);
      clearShareParam();
      toast({
        title: "Document Loaded",
        description: "Shared document has been loaded. You can view and edit it.",
      });
      setFormKey(prev => prev + 1);
    }
  }, []);

  return (
    <ModernAppShell
      documentType={formData.documentType}
      onDocumentTypeChange={handleDocumentTypeChange}
      previewUrl={previewUrl}
      isGeneratingPreview={isGeneratingPreview}
      onExportDocx={() => generateDocument('docx')}
      onGeneratePdf={() => generateDocument('pdf')}
      onSave={saveLetter}
      paragraphs={paragraphs}
      onLoadDraft={handleLoadDraft}
      onImport={handleImport}
      onClearForm={handleClearForm}
      savedLetters={savedLetters}
      onLoadTemplateUrl={handleLoadTemplateUrl}
      currentUnitCode={currentUnitCode}
      currentUnitName={currentUnitName}
      onExportNldp={handleExportNldp}
      onShareLink={handleShareLink}
      onUpdatePreview={handleUpdatePreview}
      onCopyAMHS={handleCopyAMHS}
      onExportAMHS={handleExportAMHS}
      onAddSignature={handleAddSignature}
      customRightPanel={
        formData.documentType === 'amhs' ? (
          <AMHSPreview
            formData={formData}
            references={formData.amhsReferences || []}
          />
        ) : undefined
      }
      formData={formData}
    >
      {!formData.documentType ? (
        <LandingPage />
      ) : (
        <>
          {/* Document Type Header */}
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-6 flex items-center gap-4">
            <div className="text-4xl text-primary">
              {DOCUMENT_TYPES[formData.documentType]?.icon || DOCUMENT_TYPES['basic'].icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {DOCUMENT_TYPES[formData.documentType]?.name || DOCUMENT_TYPES['basic'].name}
              </h2>
              <p className="text-muted-foreground">
                {DOCUMENT_TYPES[formData.documentType]?.description || DOCUMENT_TYPES['basic'].description}
              </p>
            </div>
          </div>

          {/* AMHS Editor - Exclusive View */}
          {formData.documentType === 'amhs' ? (
            <AMHSEditor 
              formData={formData} 
              onUpdate={(data) => setFormData(prev => ({ ...prev, ...data }))} 
            />
          ) : (
            <>
              {/* Header Settings (Hidden for AA Form, Page 11, and AMHS) */}
              {/* Header Settings (Hidden for AA Form, Page 11, AMHS, From-To Memo, MOA, MOU, and Staffing Papers) */}
      {formData.documentType !== 'aa-form' && formData.documentType !== 'page11' && formData.documentType !== 'from-to-memo' && formData.documentType !== 'moa' && formData.documentType !== 'mou' && !['position-paper', 'information-paper'].includes(formData.documentType) && (
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-6 grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Body Font</label>
            <Select
              value={formData.bodyFont}
              onValueChange={(val: any) => setFormData(prev => ({ ...prev, bodyFont: val }))}
            >
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="Select Font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="times">Times New Roman</SelectItem>
                <SelectItem value="courier">Courier New</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Font for document body</p>
          </div>
        </div>
      )}

      {/* Unit Info / Letterhead - Hide for Page 11, From-To Memo, MFR, and Staffing Papers */ }
      {formData.documentType !== 'page11' && formData.documentType !== 'from-to-memo' && formData.documentType !== 'mfr' && !['position-paper', 'information-paper'].includes(formData.documentType) && (
        <UnitInfoSection
          formData={formData}
          setFormData={setFormData}
          setCurrentUnitCode={setCurrentUnitCode}
          setCurrentUnitName={setCurrentUnitName}
        />
      )}

      {/* MOA/MOU Form Section */}
      {(formData.documentType === 'moa' || formData.documentType === 'mou') && (
        <MOAFormSection 
            key={`${formData.documentType}-${formKey}`} 
            formData={formData} 
            setFormData={setFormData} 
        />
      )}


      {/* Endorsement-Specific Fields */}
      {formData.documentType === 'endorsement' && (
        <Card className="border-primary/20 shadow-md overflow-hidden mb-6">
          <CardHeader className="bg-secondary text-secondary-foreground border-b border-secondary/10 p-4 flex flex-row items-center gap-2">
            <FileSignature className="w-5 h-5" />
            <CardTitle className="text-lg font-bold font-headline tracking-wide">Endorsement Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Endorsement Level Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Endorsement Level <span className="text-destructive">*</span></Label>
              <Select
                value={formData.endorsementLevel}
                onValueChange={(val) => setFormData(prev => ({ ...prev, endorsementLevel: val as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select endorsement level..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRST">FIRST ENDORSEMENT</SelectItem>
                  <SelectItem value="SECOND">SECOND ENDORSEMENT</SelectItem>
                  <SelectItem value="THIRD">THIRD ENDORSEMENT</SelectItem>
                  <SelectItem value="FOURTH">FOURTH ENDORSEMENT</SelectItem>
                  <SelectItem value="FIFTH">FIFTH ENDORSEMENT</SelectItem>
                  <SelectItem value="SIXTH">SIXTH ENDORSEMENT</SelectItem>
                  <SelectItem value="SEVENTH">SEVENTH ENDORSEMENT</SelectItem>
                  <SelectItem value="EIGHTH">EIGHTH ENDORSEMENT</SelectItem>
                  <SelectItem value="NINTH">NINTH ENDORSEMENT</SelectItem>
                  <SelectItem value="TENTH">TENTH ENDORSEMENT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Basic Letter Reference Builder */}
            {formData.endorsementLevel && (
              <div className="space-y-4">
                <StructuredReferenceInput formData={formData} setFormData={setFormData} />

                <div className="p-4 bg-secondary/5 border border-secondary/10 rounded-lg text-sm font-mono text-muted-foreground flex items-center gap-2">
                  <span className="font-bold text-primary">Preview:</span>
                  {formData.endorsementLevel} ENDORSEMENT on {formData.basicLetterReference || "[Basic Letter Reference]"}
                </div>
              </div>
            )}

            {/* Page Numbering and Sequencing */}
            {formData.endorsementLevel && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                {/* Page Numbering Section */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="bg-secondary/20 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                    Page Numbering
                  </h4>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Last Page # of Previous Document</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.previousPackagePageCount}
                      onChange={(e) => {
                        const newPrevCount = parseInt(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          previousPackagePageCount: newPrevCount,
                          startingPageNumber: newPrevCount + 1
                        }))
                      }}
                    />
                    <p className="text-xs text-muted-foreground italic">
                      Enter the last page number of the document you are endorsing.
                    </p>
                  </div>

                  <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/10">
                    <p className="text-sm text-foreground font-medium">
                      Endorsement starts on page <span className="font-bold text-lg text-primary">{formData.startingPageNumber}</span>
                    </p>
                  </div>
                </div>

                {/* Identifier Sequencing Section */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="bg-secondary/20 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    Identifier Sequencing
                  </h4>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Start References At Letter</Label>
                    <Select
                      value={formData.startingReferenceLevel}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, startingReferenceLevel: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)).map(char => (
                          <SelectItem key={char} value={char}>{char}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground italic">
                      If basic letter has refs (a) and (b), start here at (c).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Start Enclosures At Number</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.startingEnclosureNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, startingEnclosureNumber: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground italic">
                      If basic letter has encl (1), start here at (2).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dynamic Header Form based on Document Type */}
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-6">
        <DynamicForm
          key={`${formData.documentType}-${formKey}`} // Force re-render when type changes or data is imported
          documentType={DOCUMENT_TYPES[formData.documentType] || DOCUMENT_TYPES['basic']}
          onSubmit={handleDynamicFormSubmit}
          defaultValues={formData}
        />
      </div>

      {/* Directive Title Input for MCO/Bulletin */}
      {(formData.documentType === 'mco' || formData.documentType === 'bulletin') && (
        <Card className="shadow-sm border-border mb-6 border-l-4 border-l-amber-500">
          <CardHeader className="pb-3 bg-secondary text-secondary-foreground rounded-t-lg">
            <CardTitle className="text-lg font-semibold font-headline tracking-wide">
              Directive Title
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Full Directive Title <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                value={formData.directiveTitle || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, directiveTitle: e.target.value }))}
                placeholder="e.g., MARINE CORPS ORDER 5210.11F"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                This title will appear underlined between the date and From line. Examples: MCO 5210.11F, NAVMC DIR 5000.1, MCBul 1020
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legacy Sections wrapped to fit layout */}
      {/* Hide Via for MOA/MOU, Staffing Papers, and Business Letter */}
      {formData.documentType !== 'moa' && formData.documentType !== 'mou' && formData.documentType !== 'business-letter' && !['position-paper', 'information-paper'].includes(formData.documentType) && (
        <ViaSection vias={vias} setVias={setVias} />
      )}

      {/* Hide References for MOA/MOU, Staffing Papers, and Business Letter */}
      {formData.documentType !== 'moa' && formData.documentType !== 'mou' && formData.documentType !== 'business-letter' && !['position-paper', 'information-paper'].includes(formData.documentType) && (
        <ReferencesSection 
          references={references} 
          setReferences={setReferences} 
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {/* Hide Enclosures for MOA/MOU and Staffing Papers */}
      {formData.documentType !== 'moa' && formData.documentType !== 'mou' && !['position-paper', 'information-paper'].includes(formData.documentType) && (
        <EnclosuresSection 
          enclosures={enclosures} 
          setEnclosures={setEnclosures} 
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {formData.documentType === 'position-paper' && (
        <DecisionGridSection
          data={formData.decisionGrid || { recommenders: [], finalDecision: { role: 'CMC', options: ['Approved', 'Disapproved'] } }}
          mode={formData.decisionMode || 'SINGLE'}
          onDataChange={(data) => setFormData(prev => ({ ...prev, decisionGrid: data }))}
          onModeChange={(mode) => setFormData(prev => ({ ...prev, decisionMode: mode }))}
        />
      )}

      {(formData.documentType === 'mco' || formData.documentType === 'bulletin') && (
        <>
          <DistributionStatementSection
            distribution={formData.distribution || { type: 'none' }}
            onUpdateDistribution={(distribution) => setFormData(prev => ({ ...prev, distribution }))}
          />
          <ReportsSection
            reports={formData.reports || []}
            onUpdateReports={(reports) => setFormData(prev => ({ ...prev, reports }))}
          />
        </>
      )}

      {formData.documentType !== 'page11' && (
        <ParagraphSection 
          paragraphs={paragraphs}
          documentType={formData.documentType}
          activeVoiceInput={activeVoiceInput}
          validateParagraphNumbering={validateParagraphNumbering}
          getUiCitation={getUiCitation}
          moveParagraphUp={moveParagraphUp}
          moveParagraphDown={moveParagraphDown}
          updateParagraphContent={updateParagraphContent}
          toggleVoiceInput={toggleVoiceInput}
          addParagraph={addParagraph}
          removeParagraph={removeParagraph}
        />
      )}

      {/* Hide Closing Block for MOA/MOU, Staffing Papers, and Business Letter (it uses dynamic fields) */}
      {formData.documentType !== 'page11' && formData.documentType !== 'moa' && formData.documentType !== 'mou' && formData.documentType !== 'business-letter' && !['position-paper', 'information-paper'].includes(formData.documentType) && (
        <ClosingBlockSection
          formData={formData}
          setFormData={setFormData}
          copyTos={copyTos}
          setCopyTos={setCopyTos}
          distList={distList}
          setDistList={setDistList}
        />
      )}

      {/* Standalone Copy To Section for Business Letter */}
      {formData.documentType === 'business-letter' && (
        <CopyToSection copyTos={copyTos} setCopyTos={setCopyTos} />
      )}

      {(formData.documentType === 'mco' || formData.documentType === 'bulletin') && (
        <DistributionSection 
          distribution={formData.distribution || { type: 'none' }}
          onUpdateDistribution={(dist) => setFormData(prev => ({ ...prev, distribution: dist }))}
        />
      )}


    </>
  )}
    </>
  )}
      <SignaturePlacementModal
        open={showSignatureModal}
        onClose={handleSignatureCancel}
        onConfirm={(positions) => handleSignatureConfirm(
            positions,
            formData,
            vias,
            references,
            enclosures,
            copyTos,
            paragraphs,
            distList
        )}
        pdfBlob={signaturePdfBlob}
        totalPages={signaturePdfPageCount}
      />
    </ModernAppShell>
  );
}

export default function NavalLetterGenerator() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <NavalLetterGeneratorInner />
    </Suspense>
  );
}
