import React, { useRef, useState, useEffect } from 'react';
import { ParagraphData } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mic, 
  MicOff, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Eraser,
  Indent,
  ArrowRight,
  AlertTriangle,
  Bold,
  Italic,
  Underline,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParagraphItemProps {
  paragraph: ParagraphData;
  index: number;
  totalParagraphs: number;
  activeVoiceInput: number | null;
  citation: string;
  levelColor: string;
  titleBadgeColor: string;
  onUpdateContent: (id: number, content: string) => void;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
  onToggleVoice: (id: number) => void;
  onAddParagraph: (type: 'main' | 'sub' | 'same' | 'up', afterId: number) => void;
  onRemove: (id: number) => void;
  onFocus: (id: number) => void;
  isFocused: boolean;
  documentType?: string;
}

export function ParagraphItem({
  paragraph,
  index,
  totalParagraphs,
  activeVoiceInput,
  citation,
  levelColor,
  titleBadgeColor,
  onUpdateContent,
  onMoveUp,
  onMoveDown,
  onToggleVoice,
  onAddParagraph,
  onRemove,
  onFocus,
  isFocused,
  documentType
}: ParagraphItemProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localContent, setLocalContent] = useState(paragraph.content || '');
  const lastEmitted = useRef(paragraph.content || '');

  // Sync from props if paragraph.content changes externally
  useEffect(() => {
    if (paragraph.content !== lastEmitted.current) {
      setLocalContent(paragraph.content || '');
      lastEmitted.current = paragraph.content || '';
    }
  }, [paragraph.content]);

  // Debounce update to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localContent !== lastEmitted.current) {
        lastEmitted.current = localContent;
        onUpdateContent(paragraph.id, localContent);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localContent, paragraph.id, onUpdateContent]);

  const applyFormat = (type: 'bold' | 'italic' | 'underline') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = localContent || ''; // Ensure string

    if (start === end) return; // No selection

    const selection = text.substring(start, end);
    let formatted = '';

    // Define markers
    const markers = {
      bold: { start: '**', end: '**' },
      italic: { start: '*', end: '*' },
      underline: { start: '<u>', end: '</u>' }
    };

    const marker = markers[type];
    formatted = `${marker.start}${selection}${marker.end}`;

    const newContent = text.substring(0, start) + formatted + text.substring(end);
    setLocalContent(newContent); // Update local state immediately

    // Restore focus and selection
    setTimeout(() => {
        textarea.focus();
        // Adjust selection to wrap the formatted text
        textarea.setSelectionRange(start + marker.start.length, end + marker.start.length);
    }, 0);
  };

  return (
    <Card 
      id={`paragraph-${paragraph.id}`}
      className={cn(
        "transition-all duration-300 border-l-4 shadow-sm hover:shadow-md bg-card text-card-foreground",
        // Dynamic border colors based on level
        paragraph.level === 1 ? 'border-l-primary' :
        paragraph.level === 2 ? 'border-l-primary/80' :
        paragraph.level === 3 ? 'border-l-primary/60' :
        paragraph.level === 4 ? 'border-l-primary/40' : 'border-l-muted',
        isFocused && "ring-2 ring-primary/20 shadow-md"
      )}
      style={{ marginLeft: `${Math.min((paragraph.level - 1) * 24, 48)}px` }}
    >
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <Badge 
              variant="outline" 
              className="text-xs font-mono bg-secondary/10 text-primary border-primary/20 font-bold"
            >
              L{paragraph.level} • {citation}
            </Badge>

            {/* Ensure MOU displays "UNDERSTANDING" for paragraph 4, even if data says "AGREEMENT" due to legacy state */}
            {paragraph.title && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                {documentType === 'mou' && paragraph.title === 'AGREEMENT' ? 'UNDERSTANDING' : paragraph.title}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {index > 0 && (
                <Button
                variant="ghost"
                size="sm"
                onClick={() => onMoveUp(paragraph.id)}
                className="h-8 w-8 p-0 hover:bg-primary/10 text-muted-foreground hover:text-primary"
                title="Move Up"
                >
                <ChevronUp className="h-4 w-4" />
                </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveDown(paragraph.id)}
              disabled={index === totalParagraphs - 1}
              className="h-8 w-8 p-0 hover:bg-primary/10 text-muted-foreground hover:text-primary"
              title="Move Down"
              >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 space-y-3">
        <div className="relative group">
          {/* Formatting Toolbar - Floats top right of textarea or sits above */}
          <div className="flex items-center gap-1 mb-1.5 opacity-100 transition-opacity bg-accent/5 w-fit p-1 rounded-md border border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-primary/10 text-muted-foreground hover:text-primary"
              onClick={() => applyFormat('bold')}
              title="Bold (**text**)"
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-primary/10 text-muted-foreground hover:text-primary"
              onClick={() => applyFormat('italic')}
              title="Italic (*text*)"
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-primary/10 text-muted-foreground hover:text-primary"
              onClick={() => applyFormat('underline')}
              title="Underline (<u>text</u>)"
            >
              <Underline className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onFocus={() => onFocus(paragraph.id)}
            onBlur={() => onFocus(-1)} 
            placeholder="Enter paragraph content..."
            className="min-h-[100px] resize-y focus:ring-2 focus:ring-primary/50 pr-16 text-base font-serif bg-background text-foreground border-border"
          />
          
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors">
            {(localContent || '').length} chars
          </div>
        </div>

        {paragraph.acronymError && (
            <div className="flex items-center text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
            <AlertTriangle className="h-3 w-3 mr-1.5" />
            {paragraph.acronymError}
            </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
          <Button
            variant={activeVoiceInput === paragraph.id ? "destructive" : "outline"}
            size="sm"
            onClick={() => onToggleVoice(paragraph.id)}
            className={cn(
              "flex items-center space-x-1.5 h-8 text-xs",
              activeVoiceInput === paragraph.id && 'animate-pulse'
            )}
          >
            {activeVoiceInput === paragraph.id ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            <span>{activeVoiceInput === paragraph.id ? 'Recording...' : 'Voice'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUpdateContent(paragraph.id, '')}
            disabled={!paragraph.content}
            className="flex items-center space-x-1.5 h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Clear content"
          >
            <Eraser className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(paragraph.id)}
            className="flex items-center space-x-1.5 h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Delete paragraph"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>

          <div className="flex-1"></div>

          <div className="flex items-center bg-muted/20 rounded-md p-1 gap-1 border border-border">
            {!['information-paper', 'position-paper'].includes(documentType || '') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddParagraph('main', paragraph.id)}
                className="h-7 px-2 text-xs font-medium hover:bg-background hover:shadow-sm hover:text-primary"
                title="Add Main Paragraph (Next Number)"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Main
              </Button>
            )}

            {!['information-paper', 'position-paper'].includes(documentType || '') && <div className="w-px h-4 bg-border mx-0.5"></div>}

            {paragraph.level < (['information-paper', 'position-paper'].includes(documentType || '') ? 4 : 8) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddParagraph('sub', paragraph.id)}
                className="h-7 px-2 text-xs hover:bg-background hover:shadow-sm hover:text-primary"
                title="Add Sub-paragraph (Indent)"
              >
                <Indent className="h-3.5 w-3.5 mr-1" />
                Sub
              </Button>
            )}

            {paragraph.level > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddParagraph('same', paragraph.id)}
                className="h-7 px-2 text-xs hover:bg-background hover:shadow-sm hover:text-primary"
                title="Add Sibling Paragraph (Same Level)"
              >
                <ArrowRight className="h-3.5 w-3.5 mr-1" />
                Same
              </Button>
            )}

            {paragraph.level > 2 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddParagraph('up', paragraph.id)}
                    className="h-7 px-2 text-xs hover:bg-background hover:shadow-sm hover:text-primary"
                    title="Add Paragraph Level Up (Outdent)"
                >
                    <ArrowRight className="h-3.5 w-3.5 mr-1 transform rotate-180" />
                    Up
                </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
