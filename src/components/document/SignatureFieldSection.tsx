'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSignature } from 'lucide-react';

interface SignatureFieldSectionProps {
  onOpenSignaturePlacement: () => void;
}

export function SignatureFieldSection({ onOpenSignaturePlacement }: SignatureFieldSectionProps) {
  return (
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
          onClick={onOpenSignaturePlacement}
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
  );
}
