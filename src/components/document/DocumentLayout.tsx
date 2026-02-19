'use client';

import { ParagraphData, FormData } from '@/types';
import { DocumentFeatures, DOCUMENT_TYPES } from '@/lib/schemas';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { AMHSEditor } from '@/components/amhs/AMHSEditor';
import { LandingPage } from '@/components/layout/LandingPage';
import { UnitInfoSection } from '@/components/letter/UnitInfoSection';
import { ParagraphSection } from '@/components/letter/ParagraphSection';
import { ClosingBlockSection } from '@/components/letter/ClosingBlockSection';
import { MultipleToSection } from '@/components/letter/MultipleToSection';
import { ViaSection } from '@/components/letter/ViaSection';
import { ReferencesSection } from '@/components/letter/ReferencesSection';
import { EnclosuresSection } from '@/components/letter/EnclosuresSection';
import { MOAFormSection } from '@/components/letter/MOAFormSection';
import { ReportsSection } from '@/components/letter/ReportsSection';
import { DistributionStatementSection } from '@/components/letter/DistributionStatementSection';
import { DistributionSection } from '@/components/letter/DistributionSection';
import { SignaturePlacementModal } from '@/components/SignaturePlacementModal';
import { HeaderSettingsSection } from './HeaderSettingsSection';
import { EndorsementDetailsSection } from './EndorsementDetailsSection';
import { DirectiveTitleSection } from './DirectiveTitleSection';
import { SignatureFieldSection } from './SignatureFieldSection';

interface DocumentLayoutProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  formKey: number;
  // Unit info
  setCurrentUnitCode: (code: string | undefined) => void;
  setCurrentUnitName: (name: string | undefined) => void;
  // Lists
  vias: string[];
  setVias: React.Dispatch<React.SetStateAction<string[]>>;
  references: string[];
  setReferences: React.Dispatch<React.SetStateAction<string[]>>;
  enclosures: string[];
  setEnclosures: React.Dispatch<React.SetStateAction<string[]>>;
  copyTos: string[];
  setCopyTos: React.Dispatch<React.SetStateAction<string[]>>;
  distList: string[];
  setDistList: React.Dispatch<React.SetStateAction<string[]>>;
  // Paragraphs
  paragraphs: ParagraphData[];
  activeVoiceInput: number | null;
  validateParagraphNumbering: (paragraphs: ParagraphData[]) => { id: number; message: string }[];
  getUiCitation: (paragraph: ParagraphData, index: number, allParagraphs: ParagraphData[]) => string;
  moveParagraphUp: (id: number) => void;
  moveParagraphDown: (id: number) => void;
  updateParagraphContent: (id: number, content: string) => void;
  toggleVoiceInput: (id: number) => void;
  addParagraph: (type: string, afterId?: number) => void;
  removeParagraph: (id: number) => void;
  // Signature
  handleOpenSignaturePlacement: () => void;
  showSignatureModal: boolean;
  handleSignatureCancel: () => void;
  handleSignatureConfirm: (positions: any) => void;
  signaturePdfBlob: Blob | null;
  signaturePdfPageCount: number;
  // Dynamic form
  handleDynamicFormSubmit: (data: any) => void;
}

export function DocumentLayout({
  formData,
  setFormData,
  formKey,
  setCurrentUnitCode,
  setCurrentUnitName,
  vias,
  setVias,
  references,
  setReferences,
  enclosures,
  setEnclosures,
  copyTos,
  setCopyTos,
  distList,
  setDistList,
  paragraphs,
  activeVoiceInput,
  validateParagraphNumbering,
  getUiCitation,
  moveParagraphUp,
  moveParagraphDown,
  updateParagraphContent,
  toggleVoiceInput,
  addParagraph,
  removeParagraph,
  handleOpenSignaturePlacement,
  showSignatureModal,
  handleSignatureCancel,
  handleSignatureConfirm,
  signaturePdfBlob,
  signaturePdfPageCount,
  handleDynamicFormSubmit,
}: DocumentLayoutProps) {
  // Show landing page when no document type is selected
  if (!formData.documentType) {
    return <LandingPage />;
  }

  const docTypeDef = DOCUMENT_TYPES[formData.documentType] || DOCUMENT_TYPES['basic'];
  const features: DocumentFeatures = docTypeDef.features;

  return (
    <>
      {/* Document Type Header */}
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-6 flex items-center gap-4">
        <div className="text-4xl text-primary">
          {docTypeDef.icon || DOCUMENT_TYPES['basic'].icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {docTypeDef.name || DOCUMENT_TYPES['basic'].name}
          </h2>
          <p className="text-muted-foreground">
            {docTypeDef.description || DOCUMENT_TYPES['basic'].description}
          </p>
        </div>
      </div>

      {/* AMHS Editor - Exclusive View */}
      {features.isAMHS ? (
        <AMHSEditor
          formData={formData}
          onUpdate={(data) => setFormData(prev => ({ ...prev, ...data }))}
        />
      ) : (
        <>
          {features.showHeaderSettings && (
            <HeaderSettingsSection formData={formData} setFormData={setFormData} />
          )}

          {features.showUnitInfo && (
            <UnitInfoSection
              formData={formData}
              setFormData={setFormData}
              setCurrentUnitCode={setCurrentUnitCode}
              setCurrentUnitName={setCurrentUnitName}
            />
          )}

          {features.showMOAForm && (
            <MOAFormSection formData={formData} setFormData={setFormData} />
          )}

          {features.showEndorsementDetails && (
            <EndorsementDetailsSection formData={formData} setFormData={setFormData} />
          )}

          {/* Dynamic Header Form based on Document Type */}
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-6">
            <DynamicForm
              key={`${formData.documentType}-${formKey}`}
              documentType={docTypeDef}
              onSubmit={handleDynamicFormSubmit}
              defaultValues={formData}
            />
          </div>

          {features.showMultipleTo && (
            <MultipleToSection
              recipients={formData.distribution?.recipients || ['']}
              setRecipients={(recipients) => setFormData(prev => ({
                ...prev,
                distribution: { ...prev.distribution, recipients }
              }))}
              toDistribution={!!formData.distribution?.toDistribution}
              setToDistribution={(value) => setFormData(prev => ({
                ...prev,
                distribution: { ...prev.distribution, toDistribution: value }
              }))}
            />
          )}

          {features.showDirectiveTitle && (
            <DirectiveTitleSection formData={formData} setFormData={setFormData} />
          )}

          {features.showVia && (
            <ViaSection vias={vias} setVias={setVias} />
          )}

          {features.showReferences && (
            <ReferencesSection
              references={references}
              setReferences={setReferences}
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {features.showEnclosures && (
            <EnclosuresSection
              enclosures={enclosures}
              setEnclosures={setEnclosures}
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {features.showDistribution && (
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

          {features.showParagraphs && (
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

          {features.showClosingBlock && (
            <ClosingBlockSection
              formData={formData}
              setFormData={setFormData}
              copyTos={copyTos}
              setCopyTos={setCopyTos}
              distList={distList}
              setDistList={setDistList}
            />
          )}

          {features.showDistribution && (
            <DistributionSection
              distribution={formData.distribution || { type: 'none' }}
              onUpdateDistribution={(dist) => setFormData(prev => ({ ...prev, distribution: dist }))}
            />
          )}

          {features.showSignature && (
            <>
              <SignatureFieldSection onOpenSignaturePlacement={handleOpenSignaturePlacement} />
              <SignaturePlacementModal
                open={showSignatureModal}
                onClose={handleSignatureCancel}
                onConfirm={handleSignatureConfirm}
                pdfBlob={signaturePdfBlob}
                totalPages={signaturePdfPageCount}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
