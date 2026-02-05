
/**
 * Paragraph Section Component
 * Manages the body paragraphs with multi-level indentation, voice input, and validation
 * Modernized UI based on Marine Corps Directives Formatter
 */

import { ParagraphData, AdminSubsections } from '@/types';
import { ParagraphItem } from './ParagraphItem';
import { 
  Indent,
  AlertTriangle,
  FileText,
  ShieldAlert,
  BookOpen,
  FileWarning
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import React, { useState } from 'react';

interface ParagraphSectionProps {
  paragraphs: ParagraphData[];
  documentType: string;
  adminSubsections?: AdminSubsections;
  onUpdateAdminSubsection?: (key: keyof AdminSubsections, field: 'show' | 'content' | 'order', value: any) => void;
  activeVoiceInput: number | null;
  validateParagraphNumbering: (paragraphs: ParagraphData[]) => string[];
  getUiCitation: (paragraph: ParagraphData, index: number, allParagraphs: ParagraphData[]) => string;
  moveParagraphUp: (id: number) => void;
  moveParagraphDown: (id: number) => void;
  updateParagraphContent: (id: number, content: string) => void;
  toggleVoiceInput: (id: number) => void;
  addParagraph: (type: 'main' | 'sub' | 'same' | 'up', afterId: number) => void;
  removeParagraph: (id: number) => void;
}

export function ParagraphSection({
  paragraphs,
  documentType,
  adminSubsections,
  onUpdateAdminSubsection,
  activeVoiceInput,
  validateParagraphNumbering,
  getUiCitation,
  moveParagraphUp,
  moveParagraphDown,
  updateParagraphContent,
  toggleVoiceInput,
  addParagraph,
  removeParagraph
}: ParagraphSectionProps) {
  const numberingErrors = validateParagraphNumbering(paragraphs);
  const [focusedId, setFocusedId] = useState<number | null>(null);

  const isDirective = documentType === 'order' || documentType === 'bulletin' || documentType === 'directive';
  const showAdminSubsections = isDirective && adminSubsections && onUpdateAdminSubsection;

  // Updated to use more neutral/theme-compatible colors
  const getLevelColor = (level: number) => {
    const colors = {
      1: 'bg-background border-border', // Main level
      2: 'bg-muted/30 border-border/80', // First indent
      3: 'bg-muted/50 border-border/60', // Second indent
      4: 'bg-muted/70 border-border/40', // Third indent
      5: 'bg-muted/90 border-border/20', // Deep indent
    };
    return colors[level as keyof typeof colors] || 'bg-background border-border';
  };

  return (
    <Card className="mb-8 border-border shadow-sm border-l-4 border-l-primary">
      <CardHeader className="pb-3 bg-secondary text-secondary-foreground rounded-t-lg">
        <CardTitle className="text-lg font-semibold flex items-center font-headline tracking-wide">
          <Indent className="mr-2 h-5 w-5 text-primary-foreground" />
          Body Paragraphs
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {numberingErrors.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Paragraph Numbering Issues</h3>
                <div className="mt-2 text-sm text-yellow-700 space-y-1">
                  {numberingErrors.map((error, index) => (
                    <p key={index}>• {error}</p>
                  ))}
                </div>
                <p className="mt-2 text-xs text-yellow-600 font-medium">
                  Rule: Sequence must be preserved (1, 2... a, b... (1), (2)...).
                </p>
              </div>
            </div>
          </div>
        )}

        {showAdminSubsections && adminSubsections && onUpdateAdminSubsection && (
          <div className="p-4 bg-muted/20 rounded-lg border border-border">
            <h3 className="text-sm font-semibold mb-4 flex items-center text-primary">
              <BookOpen className="w-4 h-4 mr-2" />
              Directive Administration Statements
            </h3>
            
            <div className="space-y-6">
              {/* Records Management */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Records Management</Label>
                    <p className="text-xs text-muted-foreground">Mandatory for all Orders (MCO 5210.1)</p>
                  </div>
                  <Switch
                    checked={adminSubsections.recordsManagement.show}
                    onCheckedChange={(checked) => onUpdateAdminSubsection('recordsManagement', 'show', checked)}
                  />
                </div>
                {adminSubsections.recordsManagement.show && (
                  <Textarea
                    value={adminSubsections.recordsManagement.content}
                    onChange={(e) => onUpdateAdminSubsection('recordsManagement', 'content', e.target.value)}
                    className="min-h-[100px] text-sm bg-background"
                    placeholder="Records created as a result of this Order shall be managed..."
                  />
                )}
              </div>

              <Separator />

              {/* Privacy Act */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Privacy Act Statement</Label>
                    <p className="text-xs text-muted-foreground">Required if PII is collected/handled</p>
                  </div>
                  <Switch
                    checked={adminSubsections.privacyAct.show}
                    onCheckedChange={(checked) => onUpdateAdminSubsection('privacyAct', 'show', checked)}
                  />
                </div>
                {adminSubsections.privacyAct.show && (
                  <Textarea
                    value={adminSubsections.privacyAct.content}
                    onChange={(e) => onUpdateAdminSubsection('privacyAct', 'content', e.target.value)}
                    className="min-h-[100px] text-sm bg-background"
                    placeholder="Any misuse or unauthorized disclosure of Personally Identifiable Information (PII)..."
                  />
                )}
              </div>

              <Separator />

               {/* Reports Required */}
               <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Reports Required</Label>
                    <p className="text-xs text-muted-foreground">List any reports required by this directive</p>
                  </div>
                  <Switch
                    checked={adminSubsections.reportsRequired.show}
                    onCheckedChange={(checked) => onUpdateAdminSubsection('reportsRequired', 'show', checked)}
                  />
                </div>
                {adminSubsections.reportsRequired.show && (
                  <Textarea
                    value={adminSubsections.reportsRequired.content}
                    onChange={(e) => onUpdateAdminSubsection('reportsRequired', 'content', e.target.value)}
                    className="min-h-[60px] text-sm bg-background"
                    placeholder="None."
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {paragraphs.map((paragraph, index) => {
            const citation = getUiCitation(paragraph, index, paragraphs);
            
            return (
              <ParagraphItem
            key={paragraph.id}
            paragraph={paragraph}
            index={index}
            totalParagraphs={paragraphs.length}
            activeVoiceInput={activeVoiceInput}
            citation={getUiCitation(paragraph, index, paragraphs)}
            levelColor={getLevelColor(paragraph.level)}
            titleBadgeColor="bg-primary/10 text-primary border border-primary/20"
            onUpdateContent={updateParagraphContent}
            onMoveUp={moveParagraphUp}
            onMoveDown={moveParagraphDown}
            onToggleVoice={toggleVoiceInput}
            onAddParagraph={addParagraph}
            onRemove={removeParagraph}
            onFocus={setFocusedId}
            isFocused={focusedId === paragraph.id}
            documentType={documentType}
          />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
