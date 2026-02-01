import React from 'react';
import { Sidebar } from './Sidebar';
import { LivePreview } from './LivePreview';
import { HeaderActions } from './HeaderActions';
import { cn } from '@/lib/utils';
import { Settings, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParagraphData, SavedLetter } from '@/types';
import { getBasePath } from '@/lib/path-utils';

interface ModernAppShellProps {
  children: React.ReactNode;
  documentType: string;
  onDocumentTypeChange: (type: string) => void;
  previewUrl?: string;
  isGeneratingPreview?: boolean;
  onExportDocx: () => void;
  onGeneratePdf: () => void;
  onSave: () => void;
  paragraphs?: ParagraphData[];
  // New props for HeaderActions
  onLoadDraft: (id: string) => void;
  onImport: (data: any) => void;
  onClearForm: () => void;
  savedLetters: SavedLetter[];
  onLoadTemplateUrl: (url: string) => void;
  currentUnitCode?: string;
  currentUnitName?: string;
  onExportNldp: () => void;
  onUpdatePreview: () => void;
}

export function ModernAppShell({ 
  children, 
  documentType, 
  onDocumentTypeChange,
  previewUrl,
  isGeneratingPreview,
  onExportDocx,
  onGeneratePdf,
  onSave,
  paragraphs,
  onLoadDraft,
  onImport,
  onClearForm,
  savedLetters,
  onLoadTemplateUrl,
  currentUnitCode,
  currentUnitName,
  onExportNldp,
  onUpdatePreview
}: ModernAppShellProps) {
  const [showPreview, setShowPreview] = React.useState(true);
  const [logoSrc, setLogoSrc] = React.useState('/logo.png');

  React.useEffect(() => {
    // Get basePath on client-side for proper logo loading
    const basePath = getBasePath();
    setLogoSrc(`${basePath}/logo.png`);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Top Header / Toolbar */}
      <header className="h-16 bg-secondary text-primary-foreground border-b border-secondary-foreground/10 flex items-center justify-between px-4 z-20 shrink-0 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-primary/50 shadow-sm bg-white/10">
              <img
                src={logoSrc}
                alt="USMC Seal"
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-primary-foreground font-bold text-lg leading-tight tracking-tight font-headline">Semper Scribe</h1>
            </div>
          </div>

          <div className="h-8 w-px bg-primary-foreground/20 hidden sm:block mx-2"></div>

          <div className="hidden sm:flex items-center space-x-2 text-sm">
            <span className="px-2 py-1 rounded bg-primary text-primary-foreground font-medium border border-primary-foreground/20 text-xs shadow-sm">
              {documentType === 'navmc10274' ? 'AA FORM' : documentType.toUpperCase()}
            </span>
            <span className="text-primary-foreground/50">/</span>
            <span className="text-primary-foreground/70 font-medium text-xs">Draft</span>
          </div>
        </div>
        
        <HeaderActions
          className="text-primary-foreground"
          onSave={onSave}
          onLoadDraft={onLoadDraft}
          onImport={onImport}
          onExportDocx={onExportDocx}
          onGeneratePdf={onGeneratePdf}
          onClearForm={onClearForm}
          savedLetters={savedLetters}
          onLoadTemplateUrl={onLoadTemplateUrl}
          documentType={documentType}
          currentUnitCode={currentUnitCode}
          currentUnitName={currentUnitName}
          isGenerating={isGeneratingPreview}
          onExportNldp={onExportNldp}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview(!showPreview)}
        />
      </header>

      {/* Main Content Area (3-Pane Grid) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Sidebar */}
        <Sidebar 
          documentType={documentType} 
          onDocumentTypeChange={onDocumentTypeChange} 
          paragraphs={paragraphs}
        />

        {/* Center Pane: Editor */}
        <main className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-6 lg:p-8 relative scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
             {children}
          </div>
        </main>

        {/* Right Pane: Live Preview */}
        {showPreview && (
          <LivePreview 
            previewUrl={previewUrl}
            isLoading={isGeneratingPreview}
            onUpdatePreview={onUpdatePreview}
          />
        )}
      </div>
    </div>
  );
}
