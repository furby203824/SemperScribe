'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { FormData, ParagraphData, SavedLetter, ValidationState, AdminSubsections } from '@/types';
import { BusinessLetterForm } from '@/components/letter/BusinessLetterForm';
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
import { DecisionPaperForm } from '@/components/letter/DecisionPaperForm';
import { createDecisionPaperPdf } from '@/services/pdf/decisionPaperGenerator';
import { CoordinationPageForm } from '@/components/letter/CoordinationPageForm';
import { createCoordinationPagePdf } from '@/services/pdf/coordinationPageGenerator';
import { createBusinessLetterPdf } from '@/services/pdf/businessLetterGenerator';
import { createExecutiveMemoPdf } from '@/services/pdf/executiveMemoGenerator';
import { ExecutiveCorrespondenceForm } from '@/components/letter/ExecutiveCorrespondenceForm';
import { Navmc11811Data } from '@/types/navmc';
import { SignaturePlacementModal } from '@/components/SignaturePlacementModal';
import { configureConsole, debugUserAction, debugFormChange } from '@/lib/console-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { DOCUMENT_TYPES, LetterFormData } from '@/lib/schemas';
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
import { BatchGenerateModal } from '@/components/BatchGenerateModal';

// Inner component that uses useSearchParams (requires Suspense boundary)
const initialState: FormData = {
  documentType: 'basic',
  ssic: '',
  originatorCode: '',
  date: new Date().toISOString().split('T')[0],
  from: '',
  to: '',
  subj: '',
  line1: '',
  line2: '',
  line3: '',
  sig: ''
};

function NavalLetterGeneratorInner() {
  // Configure console to suppress browser extension errors
  useEffect(() => {
    configureConsole();
  }, []);

  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>(initialState);

  const handleDynamicFormSubmit = useCallback((data: any) => {
    // Merge dynamic form data into main state
    setFormData(prev => ({
        ...prev,
        ...data,
    }));
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

  // Batch Generate
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Load saved letters
  useEffect(() => {
    const letters = loadSavedLetters();
    setSavedLetters(letters);
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
          // Create a new, valid state object from the incoming data
          const newFormData: LetterFormData = {
            documentType: letterData.letterType || 'basic',
            ssic: letterData.ssic || '',
            subj: letterData.subject || '',
            from: letterData.from || '',
            to: letterData.to || '',
            date: letterData.date || getTodaysDate(),
            originatorCode: letterData.originatorCode || '',
            // Safely add other properties based on documentType if they exist in letterData
            ...(letterData.letterType === 'business-letter' && {
              recipientName: letterData.recipientName || '',
              recipientAddress: letterData.recipientAddress || '',
              salutation: letterData.salutation || '',
              complimentaryClose: letterData.complimentaryClose || '',
            }),
          } as LetterFormData; // Assert as FormData to satisfy TypeScript

          setFormData(newFormData);

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
          
          setFormKey((prev: number) => prev + 1);
        })
        .catch(err => console.error('Failed to load letter from EDMS:', err))
        .finally(() => setIsLoadingFromEDMS(false));
    }
  }, [edmsContext.mode, edmsContext.fileUrl, setParagraphs, setVias, setReferences, setEnclosures, setCopyTos, setDistList]);

  // Handle Cancellation Contingency for MCBul
  useEffect(() => {
    if (formData.documentType === 'bulletin') {
      const needsContingencyPara = formData.cancellationType === 'contingent';
      const hasContingencyPara = paragraphs.some((p: ParagraphData) => p.title === 'Cancellation Contingency');
      
      if (needsContingencyPara && !hasContingencyPara) {
        const newId = (paragraphs.length > 0 ? Math.max(...paragraphs.map((p: ParagraphData) => p.id)) : 0) + 1;
        setParagraphs((prev: ParagraphData[]) => [...prev, {
          id: newId,
          level: 1,
          content: '',
          isMandatory: true,
          title: 'Cancellation Contingency'
        }]);
      } else if (!needsContingencyPara && hasContingencyPara) {
        setParagraphs((prev: ParagraphData[]) => prev.filter((p: ParagraphData) => p.title !== 'Cancellation Contingency'));
      }
    }
  }, [formData.documentType, formData.documentType === 'bulletin' ? formData.cancellationType : undefined, paragraphs, setParagraphs]);

  // VIP Mode Logic for Business Letter
  useEffect(() => {
    if (formData.documentType === 'business-letter' && formData.isVipMode) {
        setFormData(prev => {
            if (prev.documentType !== 'business-letter') return prev;
            // To avoid loops, only update if the value is not already set
            if (prev.complimentaryClose !== 'Very respectfully,') {
                return { ...prev, complimentaryClose: 'Very respectfully,' };
            }
            return prev;
        });
    } else if (formData.documentType === 'business-letter' && !formData.isVipMode) {
        // This condition is tricky. We only want to revert if it was 'Very respectfully,'
        // which might have been set by VIP mode. A simple check is enough.
        setFormData(prev => {
            if (prev.documentType !== 'business-letter') return prev;
            if (prev.complimentaryClose === 'Very respectfully,') {
                return { ...prev, complimentaryClose: 'Sincerely,' };
            }
            return prev;
        });
    }
  }, [formData.documentType, formData.documentType === 'business-letter' ? formData.isVipMode : undefined]);

  // Sync Reports to Admin Subsections
  useEffect(() => {
    if (formData.documentType === 'mco') {
      let content = 'None.';
      const validReports = Array.isArray(formData.reports) ? formData.reports.filter((r: { title: string; }) => r.title) : [];
      
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
        setFormData(prev => {
            if (prev.documentType === 'mco') {
                const currentSubsections = prev.adminSubsections || {
                    reportsRequired: { content: '', order: 1, show: false },
                    privacyAct: { content: '', order: 2, show: false },
                    recordsManagement: { content: '', order: 3, show: false },
                };

                return {
                    ...prev,
                    adminSubsections: {
                        ...currentSubsections,
                        reportsRequired: {
                            ...currentSubsections.reportsRequired,
                            content,
                        },
                    },
                };
            }
            return prev;
        });
      }
    }
  }, [formData.documentType, formData.documentType === 'mco' ? formData.reports : undefined, formData.documentType === 'mco' ? formData.adminSubsections : undefined]);

  // Manual Preview Generation
  const handleUpdatePreview = useCallback(async () => {
    setIsGeneratingPreview(true);
    try {
      let blob: Blob | undefined = undefined;

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
      } else if (formData.documentType === 'decision-paper') {
        const pdfBytes = await createDecisionPaperPdf(formData as any);
        blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      } else if (formData.documentType === 'coordination-page') {
        const pdfBytes = await createCoordinationPagePdf(formData as any);
        blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      } else if (formData.documentType === 'business-letter') {
        const pdfBytes = await createBusinessLetterPdf(formData as any);
        blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      } else if (formData.documentType === 'executive-correspondence' && formData.execFormat && formData.execFormat !== 'letter') {
        // Executive memo formats (action-memo, info-memo, standard-memo) use dedicated generator
        const pdfBytes = await createExecutiveMemoPdf({ ...formData, paragraphs } as any);
        blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      } else if (['basic', 'multiple-address', 'endorsement', 'mco', 'bulletin', 'mfr', 'from-to-memo', 'letterhead-memo', 'moa', 'mou', 'position-paper', 'information-paper', 'executive-correspondence'].includes(formData.documentType)) {
        // Standard Naval Letter logic for applicable types
        if (!formData.subj && !('originatorCode' in formData && formData.originatorCode)) {
            setIsGeneratingPreview(false);
            return;
        }

        const paragraphsToRender = (formData.documentType === 'mco' && formData.adminSubsections) 
            ? mergeAdminSubsections(paragraphs, formData.adminSubsections)
            : paragraphs;

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
                     if (pageCount > 2) {
                         toast({ title: "Exceeds 2-Page Limit", description: "Position Papers must strictly not exceed 2 pages.", variant: "destructive", duration: 6000 });
                     } else if (pageCount === 2) {
                         toast({ title: "Approaching Limit (2 Pages)", description: "Position Papers are preferred to be 1 page.", variant: "default", duration: 4000 });
                     }
                 } else {
                     if (pageCount > 1) {
                         toast({ title: "Content Exceeds One Page", description: `${formData.documentType.replace('-', ' ').toUpperCase()}s must be strictly one page.`, variant: "destructive", duration: 5000 });
                     }
                 }
             } catch (err) {
                 console.error("Failed to check page count", err);
             }
        }
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      }
    } catch (e) {
      console.error("Preview generation failed", e);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [formData, vias, references, enclosures, copyTos, paragraphs, distList, toast]);

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
        if (prev.documentType !== 'mco') return prev;

        const currentSubsections = prev.adminSubsections || {
            reportsRequired: { content: '', order: 1, show: false },
            privacyAct: { content: '', order: 2, show: false },
            recordsManagement: { content: '', order: 3, show: false },
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
        }
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
    } else if (newType === 'executive-correspondence') {
      newParagraphs = []; // Exec correspondence starts with empty paragraphs
    } else if (newType === 'decision-paper') {
      newParagraphs = []; // No paragraphs for decision paper
    } else if (newType === 'coordination-page') {
      newParagraphs = []; // No paragraphs for coordination page
    }

    setFormData(prev => {
      // To prevent creating an invalid state, we build a new state object from scratch
      const newDocState: { [key: string]: any } = {
        documentType: newType,
        date: ('date' in prev && prev.date) ? prev.date : getTodaysDate(),
      };

      // Carry over common fields that exist in most naval letter types
      const commonFields = ['ssic', 'originatorCode', 'from', 'to', 'subj'];
      commonFields.forEach(field => {
        if (field in prev) {
          newDocState[field] = prev[field as keyof typeof prev];
        }
      });

      return newDocState as LetterFormData;
    });
    
    setParagraphs(newParagraphs);
  };

  const renderStandardForm = () => {
    if (!formData.documentType || formData.documentType === 'amhs') {
      return <LandingPage />;
    }

    const documentInfo = DOCUMENT_TYPES[formData.documentType] || DOCUMENT_TYPES.basic;

    return (
      <>
        {/* Document Type Header */}
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-6 flex items-center gap-4">
          <div className="text-4xl text-primary">{documentInfo.icon}</div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{documentInfo.name}</h2>
            <p className="text-muted-foreground">{documentInfo.description}</p>
          </div>
        </div>

        {/* Header Settings (Hidden for certain types) */}
        {!['aa-form', 'page11', 'from-to-memo', 'moa', 'mou', 'position-paper', 'information-paper'].includes(formData.documentType) && formData.documentType !== 'endorsement' && 'bodyFont' in formData && (
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-6 grid grid-cols-1 gap-6">
              <Select
                value={formData.bodyFont}
                onValueChange={(val: string) => setFormData(prev => ({ ...prev, bodyFont: val }))}
              >
              </Select>
          </div>
        )}

        {/* Unit Info / Letterhead */}
        {!['page11', 'from-to-memo', 'mfr', 'position-paper', 'information-paper', 'aa-form', 'moa', 'mou', 'business-letter', 'amhs'].includes(formData.documentType) && (
          <UnitInfoSection
            formData={formData}
            setFormData={setFormData}
            setCurrentUnitCode={setCurrentUnitCode}
            setCurrentUnitName={setCurrentUnitName}
          />
        )}

        {/* Dynamic Form for core fields */}
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-6">
            <DynamicForm
              key={`${formData.documentType}-${formKey}`}
              documentType={documentInfo}
              onSubmit={handleDynamicFormSubmit}
              defaultValues={formData}
            >
              {formData.documentType === 'business-letter' && <BusinessLetterForm />}
              {formData.documentType === 'executive-correspondence' && <ExecutiveCorrespondenceForm />}
              {formData.documentType === 'decision-paper' && <DecisionPaperForm />}
              {formData.documentType === 'coordination-page' && <CoordinationPageForm />}
            </DynamicForm>
        </div>

        {/* Endorsement-Specific Fields */}
        {formData.documentType === 'endorsement' && (
          <Card className="border-primary/20 shadow-md overflow-hidden mb-6">
            <CardHeader className="bg-secondary text-secondary-foreground border-b border-secondary/10 p-4 flex flex-row items-center gap-2">
              <FileSignature className="w-5 h-5" />
              <CardTitle className="text-lg font-bold font-headline tracking-wide">Endorsement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
               <StructuredReferenceInput formData={formData} setFormData={setFormData} />
            </CardContent>
          </Card>
        )}

        {/* Sections with shared logic but conditional display */}
        {!['moa', 'mou', 'business-letter', 'executive-correspondence', 'position-paper', 'information-paper'].includes(formData.documentType) && (
            <ViaSection vias={vias} setVias={setVias} />
        )}
        {!['moa', 'mou', 'business-letter', 'executive-correspondence', 'position-paper', 'information-paper', 'aa-form'].includes(formData.documentType) && (
            <ReferencesSection references={references} setReferences={setReferences} formData={formData} setFormData={setFormData} />
        )}
        {!['moa', 'mou', 'position-paper', 'information-paper', 'aa-form'].includes(formData.documentType) && (
            <EnclosuresSection enclosures={enclosures} setEnclosures={setEnclosures} formData={formData} setFormData={setFormData} />
        )}

        {/* Content Body / Paragraphs (not for page 11) */}
        {!['page11', 'aa-form', 'decision-paper', 'coordination-page'].includes(formData.documentType) && (
            <ParagraphSection
                paragraphs={paragraphs}
                documentType={formData.documentType}
                activeVoiceInput={activeVoiceInput}
                toggleVoiceInput={toggleVoiceInput}

                addParagraph={addParagraph}
                removeParagraph={removeParagraph}
                updateParagraphContent={updateParagraphContent}
                moveParagraphUp={moveParagraphUp}
                moveParagraphDown={moveParagraphDown}
                getUiCitation={getUiCitation}
                validateParagraphNumbering={validateParagraphNumbering}
            />
        )}

        {/* Closing / Signature sections */}
        {!['page11', 'moa', 'mou', 'business-letter', 'executive-correspondence', 'position-paper', 'information-paper', 'aa-form'].includes(formData.documentType) && (
            <ClosingBlockSection formData={formData} setFormData={setFormData} copyTos={copyTos} setCopyTos={setCopyTos} distList={distList} setDistList={setDistList} />
        )}
        {(formData.documentType === 'business-letter' || formData.documentType === 'executive-correspondence') && <CopyToSection copyTos={copyTos} setCopyTos={setCopyTos} />}
      </>
    );
  };

  const saveLetter = () => {
    debugUserAction('Save Letter', {
      subject: ('subj' in formData && formData.subj ? formData.subj : '').substring(0, 30) + (('subj' in formData && formData.subj ? formData.subj : '').length > 30 ? '...' : ''),
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

        // Reset to the default initial state
        setFormData(initialState);
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

  const renderFormContent = () => {
    switch (formData.documentType) {
      case 'amhs':
        return <AMHSEditor formData={formData} onUpdate={(data) => setFormData(prev => ({ ...prev, ...data }))} />;
      case 'basic':
      case 'multiple-address':
      case 'endorsement':
      case 'mco':
      case 'bulletin':
      case 'mfr':
      case 'from-to-memo':
      case 'letterhead-memo':
      case 'moa':
      case 'mou':
      case 'position-paper':
      case 'information-paper':
      case 'business-letter':
      case 'executive-correspondence':
      case 'decision-paper':
      case 'coordination-page':
      case 'page11':
      case 'aa-form':
        // All these are handled by the generic structure below
        return renderStandardForm();
      default:
        return <LandingPage />;
    }
  };

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
      onBatchGenerate={() => setShowBatchModal(true)}
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
      {renderFormContent()}
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
      <BatchGenerateModal
        open={showBatchModal}
        onOpenChange={setShowBatchModal}
        formData={formData}
        paragraphs={paragraphs}
        vias={vias}
        references={references}
        enclosures={enclosures}
        copyTos={copyTos}
        distList={distList}
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
