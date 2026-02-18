import React from 'react';
import {
  FileText,
  BookOpen,
  PenTool,
  Info,
  MessageSquare,
  Mail,
  ScrollText,
  ClipboardList,
  Notebook,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ParagraphData } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface SidebarProps {
  className?: string;
  documentType: string;
  onDocumentTypeChange: (type: string) => void;
  paragraphs?: ParagraphData[];
}

export function Sidebar({ className, documentType, onDocumentTypeChange, paragraphs = [] }: SidebarProps) {
  // Filter for top-level paragraphs only for the navigation
  const topLevelParagraphs = paragraphs.filter(p => p.level === 1);

  return (
    <aside className={cn("w-64 bg-card border-r border-border hidden md:flex flex-col h-full", className)}>
      <ScrollArea className="flex-1">
        {/* Document Type Selector */}
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Document Type</h3>
          <Accordion
            type="multiple"
            defaultValue={[]}
            className="w-full"
          >
            {/* Standard Letter Group */}
            <AccordionItem value="standard-letter" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold text-foreground hover:no-underline">
                <span className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-primary" />
                  Standard Letter
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-1 pl-2">
                  <DocumentTypeButton
                    active={documentType === 'basic'}
                    onClick={() => onDocumentTypeChange('basic')}
                    label="Basic Letter"
                  />
                  <DocumentTypeButton
                    active={documentType === 'multiple-address'}
                    onClick={() => onDocumentTypeChange('multiple-address')}
                    label="Multiple-Address Letter"
                  />
                  <DocumentTypeButton
                    active={documentType === 'endorsement'}
                    onClick={() => onDocumentTypeChange('endorsement')}
                    label="Endorsement"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Memorandums Group */}
            <AccordionItem value="memorandums" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold text-foreground hover:no-underline">
                <span className="flex items-center">
                  <Notebook className="w-4 h-4 mr-2 text-primary" />
                  Memorandums
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-1 pl-2">
                  <DocumentTypeButton
                    active={documentType === 'mfr'}
                    onClick={() => onDocumentTypeChange('mfr')}
                    label="Memorandum for the Record"
                  />
                  <DocumentTypeButton
                    active={documentType === 'from-to-memo'}
                    onClick={() => onDocumentTypeChange('from-to-memo')}
                    label="From-To Memorandum"
                  />
                  <DocumentTypeButton
                    active={documentType === 'letterhead-memo'}
                    onClick={() => onDocumentTypeChange('letterhead-memo')}
                    label="Letterhead Memorandum"
                  />
                  <DocumentTypeButton
                    active={documentType === 'moa'}
                    onClick={() => onDocumentTypeChange('moa')}
                    label="Memorandum of Agreement"
                  />
                  <DocumentTypeButton
                    active={documentType === 'mou'}
                    onClick={() => onDocumentTypeChange('mou')}
                    label="Memorandum of Understanding"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Staffing Papers Group */}
            <AccordionItem value="staffing-papers" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold text-foreground hover:no-underline">
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-primary" />
                  Staffing Papers
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-1 pl-2">
                  <DocumentTypeButton
                    active={documentType === 'information-paper'}
                    onClick={() => onDocumentTypeChange('information-paper')}
                    label="Information Paper"
                  />
                  <DocumentTypeButton
                    active={documentType === 'position-paper'}
                    onClick={() => onDocumentTypeChange('position-paper')}
                    label="Position Paper"
                  />
                  <DocumentTypeButton
                    active={documentType === 'decision-paper'}
                    onClick={() => onDocumentTypeChange('decision-paper')}
                    label="Decision Paper"
                  />
                  <DocumentTypeButton
                    active={documentType === 'coordination-page'}
                    onClick={() => onDocumentTypeChange('coordination-page')}
                    label="Coordination Page"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* External & Executive Group */}
            <AccordionItem value="external-executive" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold text-foreground hover:no-underline">
                <span className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-2 text-primary" />
                  External & Executive
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-1 pl-2">
                  <DocumentTypeButton
                    active={documentType === 'business-letter'}
                    onClick={() => onDocumentTypeChange('business-letter')}
                    label="Business Letter"
                  />
                  <DocumentTypeButton
                    active={documentType === 'executive-correspondence'}
                    onClick={() => onDocumentTypeChange('executive-correspondence')}
                    label="Executive Correspondence"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Directives Group */}
            <AccordionItem value="directives" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold text-foreground hover:no-underline">
                <span className="flex items-center">
                  <ScrollText className="w-4 h-4 mr-2 text-primary" />
                  Directives
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-1 pl-2">
                  <DocumentTypeButton
                    active={documentType === 'mco'}
                    onClick={() => onDocumentTypeChange('mco')}
                    label="Marine Corps Order"
                  />
                  <DocumentTypeButton
                    active={documentType === 'bulletin'}
                    onClick={() => onDocumentTypeChange('bulletin')}
                    label="Marine Corps Bulletin"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Forms Group */}
            <AccordionItem value="forms" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold text-foreground hover:no-underline">
                <span className="flex items-center">
                  <ClipboardList className="w-4 h-4 mr-2 text-primary" />
                  Forms
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-1 pl-2">
                  <DocumentTypeButton
                    active={documentType === 'aa-form'}
                    onClick={() => onDocumentTypeChange('aa-form')}
                    label="AA Form (NAVMC 10274)"
                  />
                  <DocumentTypeButton
                    active={documentType === 'page11'}
                    onClick={() => onDocumentTypeChange('page11')}
                    label="Pg. 11 (NAVMC 118(11))"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* AMHS - Single Item Group */}
          <div className="border-none mt-1">
            <button
              onClick={() => onDocumentTypeChange('amhs')}
              className={cn(
                "w-full flex items-center py-2 text-sm font-semibold hover:no-underline transition-all text-left",
                documentType === 'amhs' ? "text-primary" : "text-foreground hover:text-primary/80"
              )}
            >
              <MessageSquare className="w-4 h-4 mr-2 text-primary" />
              AMHS Message
            </button>
          </div>
        </div>

        {/* Document Structure */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Document Structure</h3>
          <nav className="space-y-1">
            <StructureItem icon={<Info className="w-4 h-4" />} label="Header Info" href="#header" />
            <StructureItem icon={<BookOpen className="w-4 h-4" />} label="References" href="#references" />
            
            {/* Dynamic Body Navigation */}
            <div className="pt-2 pb-1">
              <div className="text-[10px] font-bold text-muted-foreground px-2 uppercase mb-1">Body</div>
              {topLevelParagraphs.length > 0 ? (
                topLevelParagraphs.map((para, index) => (
                  <StructureItem 
                    key={para.id}
                    label={`${index + 1}. ${para.title || 'Paragraph'}`}
                    href={`#paragraph-${para.id}`} 
                    isSubItem 
                  />
                ))
              ) : (
                <StructureItem label="1. Paragraph" href="#paragraph-1" isSubItem />
              )}
            </div>

            <StructureItem icon={<PenTool className="w-4 h-4" />} label="Closing Block" href="#closing" />
          </nav>
        </div>
      </ScrollArea>
    </aside>
  );
}

function DocumentTypeButton({ active, onClick, label, isSpecial }: { active: boolean, onClick: () => void, label: string, isSpecial?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center px-2 py-1.5 text-sm font-medium rounded-md group transition-colors",
        active 
          ? "text-primary bg-primary/10 border border-primary/20 shadow-sm" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
      )}
    >
      <span className={cn(
        "w-4 h-4 rounded-full border mr-2 flex items-center justify-center transition-colors",
        active 
          ? "border-primary bg-primary text-primary-foreground" 
          : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
      )}>
        {active && <span className="w-1.5 h-1.5 rounded-full bg-background"></span>}
      </span>
      {label}
    </button>
  );
}

function StructureItem({ icon, label, href, isSubItem }: { icon?: React.ReactNode, label: string, href: string, isSubItem?: boolean }) {
  return (
    <a 
      href={href} 
      className={cn(
        "flex items-center px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md group transition-colors",
        isSubItem && "pl-8 border-l-2 border-transparent hover:border-muted-foreground/30"
      )}
    >
      {icon && <span className="text-muted-foreground/70 group-hover:text-foreground mr-2">{icon}</span>}
      {label}
    </a>
  );
}
