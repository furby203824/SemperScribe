
import React, { useState, useEffect } from 'react';
import { FormData } from '@/types';
import { autoUppercase } from '@/lib/string-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PenLine, UserCheck } from 'lucide-react';
import { CopyToSection } from './CopyToSection';

interface ClosingBlockSectionProps {
  formData: Pick<FormData, 'sig' | 'delegationText' | 'documentType' | 'distribution'>;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  copyTos: string[];
  setCopyTos: (copies: string[]) => void;
}

export function ClosingBlockSection({
  formData,
  setFormData,
  copyTos,
  setCopyTos,
}: ClosingBlockSectionProps) {
  const [showDelegation, setShowDelegation] = useState(false);
  const isAAForm = formData.documentType === 'aa-form';
  const isDirective = formData.documentType === 'mco' || formData.documentType === 'bulletin';

  useEffect(() => {
    setShowDelegation(!!formData.delegationText);
  }, [formData.delegationText]);

  const updateDelegationType = (type: string) => {
    let text = '';
    switch (type) {
      case 'by_direction': text = 'By direction'; break;
      case 'acting_commander': text = 'Acting Commander'; break;
      case 'acting_title': text = 'Acting'; break;
      case 'signing_for': text = 'For'; break;
      default: text = '';
    }
    setFormData(prev => ({ ...prev, delegationText: text }));
  };

  return (
    <Card className="shadow-sm border-border border-l-4 border-l-primary">
      <CardHeader className="pb-3 bg-secondary text-secondary-foreground rounded-t-lg">
        <CardTitle className="text-lg flex items-center font-headline tracking-wide">
          <PenLine className="mr-2 h-5 w-5 text-primary-foreground" />
          Closing Block
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2">
          <Label htmlFor="signature-name" className="text-base font-semibold flex items-center">
            Signature Name
          </Label>
          <div className="relative">
            <UserCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="signature-name"
              className="pl-9"
              placeholder="F. M. LASTNAME"
              value={formData.sig}
              onChange={(e) => setFormData(prev => ({ ...prev, sig: autoUppercase(e.target.value) }))}
            />
          </div>
        </div>
        
        {!isAAForm && (
          <div className="space-y-4 pt-4 border-t border-border">
            <Label className="text-base font-semibold flex items-center">
              Delegation of Signature Authority?
            </Label>
            
            <RadioGroup 
              value={showDelegation ? "yes" : "no"} 
              onValueChange={(val) => setShowDelegation(val === "yes")}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="delegation-yes" />
                <Label htmlFor="delegation-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="delegation-no" />
                <Label htmlFor="delegation-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>

            {showDelegation && (
              <div className="space-y-4 p-4 bg-secondary/5 rounded-lg border border-secondary/10 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Delegation Authority Type</Label>
                  <Select onValueChange={updateDelegationType}>
                    <SelectTrigger className="bg-background border-input focus:ring-primary">
                      <SelectValue placeholder="Select delegation type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="by_direction">By direction</SelectItem>
                      <SelectItem value="acting_commander">Acting Commander</SelectItem>
                      <SelectItem value="acting_title">Acting</SelectItem>
                      <SelectItem value="signing_for">For (Signing for another)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        {!isDirective && !isAAForm && (
           <div className="pt-6 border-t border-border">
             <CopyToSection copyTos={copyTos} setCopyTos={setCopyTos} />
           </div>
        )}
      </CardContent>
    </Card>
  );
}
