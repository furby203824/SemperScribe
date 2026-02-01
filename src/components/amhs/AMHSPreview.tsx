import React, { useMemo } from 'react';
import { FormData, AMHSReference } from '@/types';
import { generateFullMessage } from '@/services/amhs/amhsFormatter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface AMHSPreviewProps {
  formData: FormData;
  references: AMHSReference[];
}

export function AMHSPreview({ formData, references }: AMHSPreviewProps) {
  const { toast } = useToast();

  const formattedMessage = useMemo(() => {
    return generateFullMessage(formData, references, formData.amhsPocs || []);
  }, [formData, references]);

  const validateMessage = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.originatorCode?.trim() && !formData.from?.trim()) {
      errors.push("Originator (FROM) is required");
    }
    if (!formData.subj?.trim()) errors.push("Subject is required");
    if (!formData.amhsTextBody?.trim()) errors.push("Message text is required");
    if (!formData.amhsDtg?.trim()) errors.push("DTG is required");

    references.forEach((ref, idx) => {
      const letter = String.fromCharCode(65 + idx);
      if (ref.title && !ref.docId) {
        errors.push(`Reference ${letter} has title but missing document identifier`);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors[0] + (errors.length > 1 ? ` (+${errors.length - 1} more)` : ""),
        variant: "destructive",
      });
      return false;
    }

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
    <Card className="w-full border-primary/50 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
      <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20">
        <CardTitle className="text-lg flex items-center gap-2 text-primary">
          <FileText className="h-5 w-5" />
          Message Preview
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" /> Copy
          </Button>
          <Button size="sm" onClick={downloadTxt}>
            <Download className="h-4 w-4 mr-2" /> Download .TXT
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-black text-green-500 p-6 font-mono text-sm overflow-x-auto whitespace-pre leading-snug min-h-[500px] border-t border-primary/20">
          {formattedMessage}
        </div>
      </CardContent>
    </Card>
  );
}
