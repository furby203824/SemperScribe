import React, { useMemo } from 'react';
import { FormData, AMHSReference } from '@/types';
import { generateFullMessage } from '@/services/amhs/amhsFormatter';
import { Button } from '@/components/ui/button';
import { Copy, Download, FileText, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface AMHSPreviewProps {
  formData: FormData;
  references: AMHSReference[];
  className?: string;
}

export function AMHSPreview({ formData, references, className }: AMHSPreviewProps) {
  const { toast } = useToast();

  const formattedMessage = useMemo(() => {
    return generateFullMessage(formData, references, formData.amhsPocs || []);
  }, [formData, references]);

  const validateMessage = (): boolean => {
    // Basic validation for export actions
    // We allow preview generation even if incomplete, but warn on export
    return true; 
  };

  const copyToClipboard = () => {
    if (!validateMessage()) return;

    navigator.clipboard.writeText(formattedMessage);
    toast({
      title: "Copied to Clipboard",
      description: "Message text is ready to paste into AMHS.",
    });
  };

  const downloadTxt = () => {
    if (!validateMessage()) return;

    const blob = new Blob([formattedMessage], { type: 'text/plain' });
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

  return (
    <aside className={cn("w-[45%] max-w-[900px] min-w-[500px] bg-muted/20 border-l border-border hidden xl:flex flex-col h-full", className)}>
      {/* Header */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <FileText className="w-4 h-4" />
          AMHS Text Preview
        </h3>
        <div className="flex items-center space-x-1">
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={copyToClipboard}
             className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 gap-1.5"
             title="Copy to Clipboard"
           >
             <Copy className="w-3.5 h-3.5" />
             Copy
           </Button>
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={downloadTxt}
             className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 gap-1.5"
             title="Export to .txt"
           >
             <Download className="w-3.5 h-3.5" />
             Export
           </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-black">
        <ScrollArea className="h-full w-full">
            <div className="p-6">
                <pre className="text-green-500 font-mono text-sm whitespace-pre leading-snug">
                    {formattedMessage}
                </pre>
            </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
