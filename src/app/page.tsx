'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { ParagraphData, SavedLetter, ValidationState, FormData } from '@/types';
import { ModernAppShell } from '@/components/layout/ModernAppShell';
import { UnitInfoSection } from '@/components/letter/UnitInfoSection';
import { ParagraphSection } from '@/components/letter/ParagraphSection';
import { ClosingBlockSection } from '@/components/letter/ClosingBlockSection';
import { ViaSection } from '@/components/letter/ViaSection';
import { ReferencesSection } from '@/components/letter/ReferencesSection';
import { EnclosuresSection } from '@/components/letter/EnclosuresSection';
import { ReportsSection } from '@/components/letter/ReportsSection';
import { DistributionStatementSection } from '@/components/letter/DistributionStatementSection';
import { DistributionSection } from '@/components/letter/DistributionSection';
import { StructuredReferenceInput } from '@/components/letter/StructuredReferenceInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileSignature } from 'lucide-react';
import { useEDMSContext, isEditMode } from '@/hooks/useEDMSContext';
import { UNITS } from '@/lib/units';
import { getTodaysDate } from '@/lib/date-utils';
import { getMCOParagraphs, getMCBulParagraphs, getExportFilename, mergeAdminSubsections } from '@/lib/naval-format-utils';
import { validateSSIC, validateSubject, validateFromTo } from '@/lib/validation-utils';
import { loadSavedLetters, saveLetterToStorage, findLetterById } from '@/lib/storage-utils';
import { generateBasePDFBlob, generatePDFBlob, getPDFPageCount, addMultipleSignaturesToBlob, ManualSignaturePosition } from '@/lib/pdf-generator';
import { generateDocxBlob } from '@/lib/docx-generator';
import { SignaturePlacementModal, SignaturePosition } from '@/components/SignaturePlacementModal';
import { configureConsole, logError, debugUserAction, debugFormChange } from '@/lib/console-utils';
import { getDoDSealBufferSync } from '@/lib/dod-seal';
import { createFormattedParagraph } from '@/lib/paragraph-formatter';
import { DOC_SETTINGS } from '@/lib/doc-settings';
import { generateNavmc10274 } from '@/services/pdf/navmc10274Generator';
import { generateNavmc11811 } from '@/services/pdf/navmc11811Generator';
import { Navmc11811Data } from '@/types/navmc';
import { openBlobInNewTab } from '@/lib/blob-utils';
import { getBasePath } from '@/lib/path-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { DOCUMENT_TYPES } from '@/lib/schemas';
import { AMHSEditor } from '@/components/amhs/AMHSEditor';
import { AMHSPreview } from '@/components/amhs/AMHSPreview';
import { LandingPage } from '@/components/layout/LandingPage';
import { generateFullMessage } from '@/services/amhs/amhsFormatter';
import { useToast } from '@/hooks/use-toast';

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
    box11: ''
  });

  const handleDynamicFormSubmit = useCallback((data: any) => {
    // Merge dynamic form data into main state
    setFormData(prev => ({
        ...prev,
        ...data,
        // Ensure complex objects are merged correctly if needed
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

  const [paragraphs, setParagraphs] = useState<ParagraphData[]>([{ id: 1, level: 1, content: '', acronymError: '' }]);
  const [savedLetters, setSavedLetters] = useState<SavedLetter[]>([]);

  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  // Voice recognition state
  const [voiceRecognition, setVoiceRecognition] = useState<any>(null);
  const [activeVoiceInput, setActiveVoiceInput] = useState<number | null>(null);

  // Key to force form remount on import
  const [formKey, setFormKey] = useState(0);

  // Signature placement state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signaturePdfBlob, setSignaturePdfBlob] = useState<Blob | null>(null);
  const [signaturePdfPageCount, setSignaturePdfPageCount] = useState(1);
  const [signaturePosition, setSignaturePosition] = useState<ManualSignaturePosition | null>(null);

  // Refs
  const activeVoiceInputRef = useRef<number | null>(null);
  const paragraphsRef = useRef<ParagraphData[]>(paragraphs);

  // EDMS Integration
  const edmsContext = useEDMSContext();
  const [currentUnitCode, setCurrentUnitCode] = useState<string | undefined>(undefined);
  const [currentUnitName, setCurrentUnitName] = useState<string | undefined>(undefined);
  const [isLoadingFromEDMS, setIsLoadingFromEDMS] = useState(false);

  // Update refs when state changes
  useEffect(() => {
    activeVoiceInputRef.current = activeVoiceInput;
  }, [activeVoiceInput]);
  
  useEffect(() => {
    paragraphsRef.current = paragraphs;
  }, [paragraphs]);

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

  // Sync Reports to Admin Subsections
  useEffect(() => {
    if (formData.documentType === 'mco' || formData.documentType === 'order') {
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
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
      } else if (formData.documentType === 'navmc10274') {
         // Placeholder for AA Form if needed later, or use base generator if it supports it
         // For now, fall back to base or implement specific if known. 
         // Assuming base for now or separate generator. 
         // The user asked for Pg 11 specifically.
         // Let's check if generateNavmc10274 is available (it is imported).
         const pdfBytes = await generateNavmc10274({
            actionNo: formData.actionNo || '',
            ssic: formData.ssic || '',
            date: formData.date || '',
            from: formData.from || '',
            orgStation: formData.orgStation || '',
            to: formData.to || '',
            via: vias[0] || '', // Simple mapping for now
            subject: formData.subj || '',
            reference: references[0] || '',
            enclosure: enclosures[0] || '',
            supplementalInfo: '', // Need to map this from somewhere if it exists
            copyTo: copyTos[0] || '',
            isDraft: true
         });
         blob = new Blob([pdfBytes], { type: 'application/pdf' });
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
          paragraphsToRender
        );
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
  }, [formData, vias, references, enclosures, copyTos, paragraphs]);

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
      newParagraphs = getMCBulParagraphs(false);
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
      paragraphs,
    };

    const updatedLetters = saveLetterToStorage(newLetter, savedLetters);
    setSavedLetters(updatedLetters);
  };

  // Paragraph Management Logic
  const addParagraph = (type: 'main' | 'sub' | 'same' | 'up', afterId: number) => {
    const currentParagraph = paragraphs.find(p => p.id === afterId);
    if (!currentParagraph) return;

    let newLevel = 1;
    switch (type) {
      case 'main': newLevel = 1; break;
      case 'same': newLevel = currentParagraph.level; break;
      case 'sub': newLevel = Math.min(currentParagraph.level + 1, 8); break;
      case 'up': newLevel = Math.max(currentParagraph.level - 1, 1); break;
    }

    const newId = (paragraphs.length > 0 ? Math.max(...paragraphs.map(p => p.id)) : 0) + 1;
    const currentIndex = paragraphs.findIndex(p => p.id === afterId);
    const newParagraphs = [...paragraphs];
    newParagraphs.splice(currentIndex + 1, 0, { id: newId, level: newLevel, content: '' });

    setParagraphs(newParagraphs);
  };

  const removeParagraph = (id: number) => {
    const paragraphToRemove = paragraphs.find(p => p.id === id);
    if (paragraphToRemove?.isMandatory) {
      alert("This paragraph is mandatory for the selected document type and cannot be removed.");
      return;
    }

    if (paragraphs.length <= 1) {
      if (paragraphs[0].id === id) {
        updateParagraphContent(id, '');
        return;
      }
    }

    const newParagraphs = paragraphs.filter(p => p.id !== id);
    const numberingErrors = validateParagraphNumbering(newParagraphs);
    if (numberingErrors.length > 0) {
      const proceed = window.confirm(
        `Removing this paragraph may create numbering issues:\n\n${numberingErrors.join('\n')}\n\nDo you want to proceed?`
      );
      if (!proceed) return;
    }

    setParagraphs(newParagraphs);
  };

  const updateParagraphContent = (id: number, content: string) => {
    const cleanedContent = content
      .replace(/\u00A0/g, ' ')
      .replace(/\u2007/g, ' ')
      .replace(/\u202F/g, ' ')
      .replace(/[\r\n]/g, ' ');

    const newParagraphs = paragraphs.map(p => p.id === id ? { ...p, content: cleanedContent } : p)
    setParagraphs(newParagraphs);
    // validateAcronyms(newParagraphs); // Temporarily removed for performance or re-implement if needed
  };

  const moveParagraphUp = (id: number) => {
    const currentIndex = paragraphs.findIndex(p => p.id === id);
    if (currentIndex > 0) {
      const currentPara = paragraphs[currentIndex];
      const paraAbove = paragraphs[currentIndex - 1];
      if (currentPara.level > paraAbove.level) return;

      const newParagraphs = [...paragraphs];
      [newParagraphs[currentIndex - 1], newParagraphs[currentIndex]] = [newParagraphs[currentIndex], newParagraphs[currentIndex - 1]];
      setParagraphs(newParagraphs);
    }
  };

  const moveParagraphDown = (id: number) => {
    const currentIndex = paragraphs.findIndex(p => p.id === id);
    if (currentIndex < paragraphs.length - 1) {
      const newParagraphs = [...paragraphs];
      [newParagraphs[currentIndex], newParagraphs[currentIndex + 1]] = [newParagraphs[currentIndex + 1], newParagraphs[currentIndex]];
      setParagraphs(newParagraphs);
    }
  };

  // Helper functions for paragraph UI
  const getUiCitation = (paragraph: ParagraphData, index: number, allParagraphs: ParagraphData[]): string => {
    const { level } = paragraph;

    const getCitationPart = (targetLevel: number, parentIndex: number) => {
      let listStartIndex = 0;
      if (targetLevel > 1) {
        for (let i = parentIndex - 1; i >= 0; i--) {
          if (allParagraphs[i].level < targetLevel) {
            listStartIndex = i + 1;
            break;
          }
        }
      }

      let count = 0;
      for (let i = listStartIndex; i <= parentIndex; i++) {
        if (allParagraphs[i].level === targetLevel) {
          count++;
        }
      }

      switch (targetLevel) {
        case 1: return `${count}.`;
        case 2: return `${String.fromCharCode(96 + count)}`;
        case 3: return `(${count})`;
        case 4: return `(${String.fromCharCode(96 + count)})`;
        case 5: return `${count}.`;
        case 6: return `${String.fromCharCode(96 + count)}.`;
        case 7: return `(${count})`;
        case 8: return `(${String.fromCharCode(96 + count)})`;
        default: return '';
      }
    };

    if (level === 1) return getCitationPart(1, index);
    if (level === 2) {
      let parentCitation = '';
      for (let i = index - 1; i >= 0; i--) {
        if (allParagraphs[i].level === 1) {
          parentCitation = getCitationPart(1, i).replace('.', '');
          break;
        }
      }
      return `${parentCitation}${getCitationPart(2, index)}`;
    }

    let citationPath = [];
    let parentLevel = level - 1;
    for (let i = index - 1; i >= 0; i--) {
      const p = allParagraphs[i];
      if (p.level === parentLevel) {
        citationPath.unshift(getCitationPart(p.level, i).replace(/[.()]/g, ''));
        parentLevel--;
        if (parentLevel === 0) break;
      }
    }
    citationPath.push(getCitationPart(level, index));
    return citationPath.join('');
  };

  const validateParagraphNumbering = useCallback((allParagraphs: ParagraphData[]): string[] => {
    const errors: string[] = [];
    const levelGroups: { [key: string]: number[] } = {};

    allParagraphs.forEach((paragraph, index) => {
      const { level } = paragraph;
      let parentPath = '';
      let currentLevel = level - 1;
      for (let i = index - 1; i >= 0 && currentLevel > 0; i--) {
        if (allParagraphs[i].level === currentLevel) {
          const citation = getUiCitation(allParagraphs[i], i, allParagraphs);
          parentPath = citation.replace(/[.()]/g, '') + parentPath;
          currentLevel--;
        }
      }
      const groupKey = `${parentPath}_level${level}`;
      if (!levelGroups[groupKey]) levelGroups[groupKey] = [];
      levelGroups[groupKey].push(index);
    });

    Object.entries(levelGroups).forEach(([groupKey, indices]) => {
      if (indices.length === 1) {
        const index = indices[0];
        const paragraph = allParagraphs[index];
        const citation = getUiCitation(paragraph, index, allParagraphs);
        if (paragraph.level > 1) {
          errors.push(`Paragraph ${citation} requires at least one sibling paragraph at the same level.`);
        }
      }
    });
    return errors;
  }, []);

  // Voice Recognition
  const initializeVoiceRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = function(event: any) {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript && activeVoiceInputRef.current !== null) {
          const currentParagraph = paragraphsRef.current.find(p => p.id === activeVoiceInputRef.current);
          if (currentParagraph) {
            const newContent = currentParagraph.content + (currentParagraph.content ? ' ' : '') + finalTranscript;
            updateParagraphContent(activeVoiceInputRef.current, newContent);
          }
        }
      };

      recognition.onerror = function(event: any) {
        logError('Voice Recognition', event.error);
        setActiveVoiceInput(null);
      };
      
      recognition.onend = function() {
        setActiveVoiceInput(null);
      };
      
      setVoiceRecognition(recognition);
    }
  }, []);

  useEffect(() => {
    initializeVoiceRecognition();
  }, []);

  const toggleVoiceInput = (paragraphId: number) => {
    if (!voiceRecognition) {
      alert('Voice recognition not supported in this browser');
      return;
    }
    if (activeVoiceInput === paragraphId) {
      voiceRecognition.stop();
      setActiveVoiceInput(null);
    } else {
      if (activeVoiceInput !== null) voiceRecognition.stop();
      setActiveVoiceInput(paragraphId);
      voiceRecognition.start();
    }
  };

  const downloadPDF = async (formData: FormData, vias: string[], references: string[], enclosures: string[], copyTos: string[], paragraphs: ParagraphData[], withSignature?: ManualSignaturePosition) => {
    try {
      // Merge Admin Subsections for export
      const paragraphsToRender = mergeAdminSubsections(paragraphs, formData.adminSubsections);

      let blob: Blob;
      if (withSignature) {
        // Generate PDF with signature field at specified position
        blob = await generatePDFBlob(formData, vias, references, enclosures, copyTos, paragraphsToRender, withSignature);
      } else {
        // Generate base PDF without signature field
        blob = await generateBasePDFBlob(formData, vias, references, enclosures, copyTos, paragraphsToRender);
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
  };

  // Signature placement workflow handlers
  const handleOpenSignaturePlacement = async () => {
    try {
      let blob: Blob;

      if (formData.documentType === 'aa-form') {
        // ... (AA Form logic remains same)
        // Generate AA Form PDF
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
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
      } else if (formData.documentType === 'page11') {
        // ... (Page 11 logic remains same)
        const navmcData: Navmc11811Data = {
          name: formData.name || '',
          edipi: formData.edipi || '',
          remarksLeft: formData.remarksLeft || '',
          remarksRight: formData.remarksRight || ''
        };
        const pdfBytes = await generateNavmc11811(navmcData);
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
      } else {
        // Generate standard letter PDF
        // Merge Admin Subsections
        const paragraphsToRender = mergeAdminSubsections(paragraphs, formData.adminSubsections);
        blob = await generateBasePDFBlob(formData, vias, references, enclosures, copyTos, paragraphsToRender);
      }

      const pageCount = await getPDFPageCount(blob);
      setSignaturePdfBlob(blob);
      setSignaturePdfPageCount(pageCount);
      setShowSignatureModal(true);
    } catch (error) {
      console.error('Error preparing signature placement:', error);
      alert('Failed to prepare PDF for signature placement.');
    }
  };

  const handleSignatureConfirm = async (positions: SignaturePosition[]) => {
    try {
      setShowSignatureModal(false);

      let baseBlob: Blob;

      // Generate appropriate PDF based on document type
      if (formData.documentType === 'aa-form') {
         // ... AA Form logic
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
        baseBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      } else if (formData.documentType === 'page11') {
        // ... Page 11 logic
        const navmcData: Navmc11811Data = {
          name: formData.name || '',
          edipi: formData.edipi || '',
          remarksLeft: formData.remarksLeft || '',
          remarksRight: formData.remarksRight || ''
        };
        const pdfBytes = await generateNavmc11811(navmcData);
        baseBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      } else {
        // Generate standard letter PDF
        // Merge Admin Subsections
        const paragraphsToRender = mergeAdminSubsections(paragraphs, formData.adminSubsections);
        baseBlob = await generateBasePDFBlob(formData, vias, references, enclosures, copyTos, paragraphsToRender);
      }

      // Convert SignaturePositions to ManualSignaturePositions
      const manualPositions: ManualSignaturePosition[] = positions.map(pos => ({
        page: pos.page,
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height
      }));

      // Add all signature fields
      const signedBlob = await addMultipleSignaturesToBlob(baseBlob, manualPositions);

      // Download the PDF
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
  };

  const handleSignatureCancel = () => {
    setShowSignatureModal(false);
    setSignaturePdfBlob(null);
  };

  const generateDocument = async (format: 'docx' | 'pdf') => {
    if (format === 'pdf') {
      // Check if this is an AA Form
      if (formData.documentType === 'aa-form') {
        try {
          // Map formData to Navmc10274Data
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
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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
          alert('Failed to generate AA Form PDF. Please check the console for details.');
        }
      } else if (formData.documentType === 'page11') {
        try {
          const navmcData: Navmc11811Data = {
            name: formData.name || '',
            edipi: formData.edipi || '',
            remarksLeft: formData.remarksLeft || '',
            remarksRight: formData.remarksRight || ''
          };
          const pdfBytes = await generateNavmc11811(navmcData);
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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
          alert('Failed to generate Page 11 PDF. Please check the console for details.');
        }
      } else {
        // Standard letter PDF generation
        await downloadPDF(formData, vias, references, enclosures, copyTos, paragraphs);
      }
    } else {
       try {
         // Merge Admin Subsections for MCOs/Orders
         const paragraphsToRender = (formData.documentType === 'mco' || formData.documentType === 'order')
            ? mergeAdminSubsections(paragraphs, formData.adminSubsections)
            : paragraphs;

         const blob = await generateDocxBlob(formData, vias, references, enclosures, copyTos, paragraphsToRender);
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
  };

  // New Handlers for HeaderActions
  const handleImport = (inputData: any) => {
    try {
        // Handle both flat structures (SavedLetter) and nested NLDP structures
        const data = inputData.data ? inputData.data : inputData;
        const formDataToMerge = data.formData || data;

        setFormData(prev => ({
            ...prev,
            ...formDataToMerge,
        }));
        
        if (data.paragraphs) setParagraphs(data.paragraphs);
        if (data.vias) setVias(data.vias);
        if (data.references) setReferences(data.references);
        if (data.enclosures) setEnclosures(data.enclosures);
        if (data.copyTos) setCopyTos(data.copyTos);

        // Re-validate known fields
        if (formDataToMerge.ssic) handleValidateSSIC(formDataToMerge.ssic);
        if (formDataToMerge.subj) handleValidateSubject(formDataToMerge.subj);
        if (formDataToMerge.from) handleValidateFromTo(formDataToMerge.from, 'from');
        if (formDataToMerge.to) handleValidateFromTo(formDataToMerge.to, 'to');

        // Force form remount
        setFormKey(prev => prev + 1);

        debugUserAction('Import Data', { source: 'File/Template' });
    } catch (error) {
        console.error('Import failed', error);
        alert('Failed to import data structure.');
    }
  };

  const handleLoadDraft = (id: string) => {
      const letter = findLetterById(id, savedLetters);
      if (letter) {
          handleImport(letter);
      }
  };

  const handleLoadTemplateUrl = async (url: string) => {
      try {
          // Prepend basePath to template URL for correct path resolution
          const basePath = getBasePath();
          const fullUrl = url.startsWith('/') ? `${basePath}${url}` : url;
          const res = await fetch(fullUrl);
          if (!res.ok) throw new Error(`Failed to load template: ${res.statusText}`);
          const data = await res.json();
          handleImport(data);
          debugUserAction('Load Template', { url: fullUrl });
      } catch (error) {
          console.error('Template load failed', error);
          alert('Failed to load template. Please try again.');
      }
  };

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
            box11: '',
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
        setValidation({
            ssic: { isValid: false, message: '' },
            subj: { isValid: false, message: '' },
            from: { isValid: false, message: '' },
            to: { isValid: false, message: '' }
        });
        setFormKey(prev => prev + 1);
      }
  };

  const handleCopyAMHS = () => {
    const message = generateFullMessage(formData, formData.amhsReferences || [], formData.amhsPocs || []);
    navigator.clipboard.writeText(message);
    toast({
      title: "Copied to Clipboard",
      description: "Message text is ready to paste into AMHS.",
    });
  };

  const handleExportAMHS = () => {
    const message = generateFullMessage(formData, formData.amhsReferences || [], formData.amhsPocs || []);
    const blob = new Blob([message], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const msgType = formData.amhsMessageType || 'MSG';
    a.download = `SEMPERADMIN_${msgType}_${dateStr}.txt`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportNldp = () => {
    const exportData = {
      metadata: {
        packageId: `export_${Date.now()}`,
        formatVersion: "1.0.0",
        createdAt: new Date().toISOString(),
        author: {
          name: formData.from || "Unknown"
        },
        package: {
          title: formData.subj || "Untitled Package",
          description: "Exported from Naval Letter Formatter",
          subject: formData.subj,
          documentType: formData.documentType
        }
      },
      data: {
        formData,
        vias,
        references,
        enclosures,
        copyTos,
        paragraphs
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Naval_Package_${formData.ssic || 'Draft'}.nldp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    debugUserAction('Export Data', { format: 'nldp' });
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
      onUpdatePreview={handleUpdatePreview}
      onCopyAMHS={handleCopyAMHS}
      onExportAMHS={handleExportAMHS}
      customRightPanel={
        formData.documentType === 'amhs' ? (
          <AMHSPreview 
            formData={formData} 
            references={formData.amhsReferences || []} 
          />
        ) : undefined
      }
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
              {formData.documentType !== 'aa-form' && formData.documentType !== 'page11' && (
                <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Header Type</label>
            <Select
              value={formData.headerType}
              onValueChange={(val: any) => setFormData(prev => ({ ...prev, headerType: val }))}
            >
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="Select Header" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USMC">USMC Standard</SelectItem>
                <SelectItem value="DON">Department of the Navy</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Changes header title text</p>
          </div>

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

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Header Color</label>
            <Select
              value={formData.accentColor || 'black'}
              onValueChange={(val: any) => setFormData(prev => ({ ...prev, accentColor: val }))}
            >
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="Select Color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="black">Black</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Color of header text only</p>
          </div>
        </div>
      )}

      {/* Unit Info / Letterhead - Hide for Page 11 */ }
      {formData.documentType !== 'page11' && (
        <UnitInfoSection
          formData={formData}
          setFormData={setFormData}
          setCurrentUnitCode={setCurrentUnitCode}
          setCurrentUnitName={setCurrentUnitName}
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
      <ViaSection vias={vias} setVias={setVias} />
      <ReferencesSection 
        references={references} 
        setReferences={setReferences} 
        formData={formData}
        setFormData={setFormData}
      />
      <EnclosuresSection 
        enclosures={enclosures} 
        setEnclosures={setEnclosures} 
        formData={formData}
        setFormData={setFormData}
      />

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

      {formData.documentType !== 'page11' && (
        <ClosingBlockSection
          formData={formData}
          setFormData={setFormData}
          copyTos={copyTos}
          setCopyTos={setCopyTos}
        />
      )}

      {(formData.documentType === 'mco' || formData.documentType === 'bulletin') && (
        <DistributionSection 
          distribution={formData.distribution || { type: 'none' }}
          onUpdateDistribution={(dist) => setFormData(prev => ({ ...prev, distribution: dist }))}
        />
      )}


      {/* Digital Signature Section */}
      <Card className="shadow-sm border-border mb-6 border-l-4 border-l-primary">
        <CardHeader className="pb-3 bg-secondary text-secondary-foreground rounded-t-lg">
          <CardTitle className="flex items-center text-lg font-semibold font-headline tracking-wide">
            <FileSignature className="mr-2 h-5 w-5 text-primary-foreground" />
            Digital Signature Field
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Add a digital signature field to your PDF for CAC/PKI signing in Adobe Reader.
          </p>
          <button
            type="button"
            onClick={handleOpenSignaturePlacement}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <FileSignature className="mr-2 h-4 w-4" />
            Place Signature Field & Download PDF
          </button>
          <p className="text-xs text-muted-foreground italic">
            This will generate a PDF preview where you can draw the signature box location.
          </p>
        </CardContent>
      </Card>

      </>
      )}

      {/* Signature Placement Modal */}
      <SignaturePlacementModal
        open={showSignatureModal}
        onClose={handleSignatureCancel}
        onConfirm={handleSignatureConfirm}
        pdfBlob={signaturePdfBlob}
        totalPages={signaturePdfPageCount}
      />
    </>
  )}
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
