import React, { useState } from 'react';
import {
  FileText,
  Anchor,
  BookOpen,
  PenTool,
  Info,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  Scale,
  Mail,
  ScrollText,
  ClipboardList,
  Notebook
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ParagraphData } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { DISCLAIMERS } from '@/lib/security-utils';

interface SidebarProps {
  className?: string;
  documentType: string;
  onDocumentTypeChange: (type: string) => void;
  paragraphs?: ParagraphData[];
}

export function Sidebar({ className, documentType, onDocumentTypeChange, paragraphs = [] }: SidebarProps) {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  
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
                    active={documentType === 'talking-paper'}
                    onClick={() => onDocumentTypeChange('talking-paper')}
                    label="Talking Paper"
                  />
                  <DocumentTypeButton
                    active={documentType === 'briefing-paper'}
                    onClick={() => onDocumentTypeChange('briefing-paper')}
                    label="Briefing Paper"
                  />
                  <DocumentTypeButton
                    active={documentType === 'position-paper'}
                    onClick={() => onDocumentTypeChange('position-paper')}
                    label="Position Paper"
                  />
                  <DocumentTypeButton
                    active={documentType === 'trip-report'}
                    onClick={() => onDocumentTypeChange('trip-report')}
                    label="Trip Report"
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
      
      <div className="p-4 border-t border-border bg-secondary/5">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/5"
          onClick={() => window.open('https://semperadmin.github.io/Sentinel/#detail/naval-letter-formatter/todo', '_blank')}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>

        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/5 mt-2"
          onClick={() => setIsDisclaimerOpen(true)}
        >
          <ShieldAlert className="w-4 h-4 mr-2" />
          Disclaimers & Warnings
        </Button>
      </div>

      {/* Disclaimer Modal */}
      <Dialog open={isDisclaimerOpen} onOpenChange={setIsDisclaimerOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              <ShieldAlert className="w-6 h-6 mr-2 text-orange-500" />
              Application Disclaimers
            </DialogTitle>
            <DialogDescription>
              Please review the following security, privacy, and legal information.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4 mt-4 border rounded-md p-4 bg-muted/20">
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="text-lg font-semibold mb-2 flex items-center text-foreground">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                  1. Privacy & Data Handling (PII/PHI)
                </h3>
                <div className="space-y-2">
                  <p className="text-muted-foreground"><strong>Context:</strong> Displayed when the application detects Personally Identifiable Information (SSN, EDIPI) or Protected Health Information (Medical keywords) in a document.</p>
                  <div className="bg-yellow-500/10 p-3 rounded border-l-4 border-yellow-500">
                    <p className="font-bold text-yellow-600">Sensitive Data Detected!</p>
                    <p className="text-yellow-600/80 text-xs mt-1">{DISCLAIMERS.PII_WARNING.message}</p>
                  </div>
                  
                  <p className="text-muted-foreground mt-4"><strong>Context:</strong> Displayed at the bottom of administrative forms.</p>
                  <div className="bg-destructive/10 p-3 rounded border border-destructive/20">
                    <p className="font-bold text-destructive text-xs">{DISCLAIMERS.FOUO_FOOTER.line1}</p>
                    <p className="text-destructive/80 text-xs mb-2">{DISCLAIMERS.FOUO_FOOTER.text1}</p>
                    <p className="font-bold text-destructive text-xs">{DISCLAIMERS.FOUO_FOOTER.line2}</p>
                    <p className="text-destructive/80 text-xs">{DISCLAIMERS.FOUO_FOOTER.text2}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2 flex items-center text-foreground">
                  <ShieldAlert className="w-5 h-5 mr-2 text-orange-500" />
                  2. Security & Classification
                </h3>
                <p className="text-muted-foreground"><strong>Context:</strong> Displayed when a user selects a classification level other than "Unclassified".</p>
                <div className="bg-orange-500/10 p-3 rounded border-l-4 border-orange-500">
                  <p className="font-bold text-orange-600">{DISCLAIMERS.CLASSIFIED_WARNING.title}</p>
                  <p className="text-orange-600/80 text-xs mt-1">{DISCLAIMERS.CLASSIFIED_WARNING.message}</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2 flex items-center text-foreground">
                  <Scale className="w-5 h-5 mr-2 text-blue-500" />
                  3. Legal & Warranty (MIT License)
                </h3>
                <p className="text-muted-foreground"><strong>Context:</strong> General software license covering the application codebase.</p>
                <div className="bg-muted p-3 rounded font-mono text-xs text-muted-foreground">
                  <p className="font-bold mb-1">No Warranty</p>
                  <p>{DISCLAIMERS.LEGAL_WARRANTY}</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2 text-foreground">4. Operational Security (OPSEC)</h3>
                <p className="text-muted-foreground"><strong>Context:</strong> Implicit in the design of the "Local-First" architecture.</p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Local Processing:</strong> {DISCLAIMERS.OPSEC.localProcessing}
                  </li>
                  <li>
                    <strong>User Responsibility:</strong> {DISCLAIMERS.OPSEC.userResponsibility}
                  </li>
                </ul>
              </section>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button onClick={() => setIsDisclaimerOpen(false)}>I Understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
