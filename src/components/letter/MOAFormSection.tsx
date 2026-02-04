
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormData } from '@/types';
import { Handshake } from 'lucide-react';

interface MOAFormSectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export function MOAFormSection({ formData, setFormData }: MOAFormSectionProps) {
  const moaData = formData.moaData || {
    activityA: '',
    activityB: '',
    seniorSigner: { name: '', title: '', activity: '' },
    juniorSigner: { name: '', title: '', activity: '' }
  };

  const updateMoaData = (field: string, value: any) => {
    const newMoaData = { ...moaData };
    
    // Handle nested updates
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'seniorSigner' || parent === 'juniorSigner') {
        newMoaData[parent] = {
          ...newMoaData[parent],
          [child]: value
        };
      }
    } else {
      // @ts-ignore
      newMoaData[field] = value;
    }

    setFormData(prev => ({
      ...prev,
      moaData: newMoaData
    }));
  };

  return (
    <Card className="border-primary/20 shadow-md overflow-hidden">
      <CardHeader className="bg-secondary text-secondary-foreground border-b border-secondary/10 p-4 flex flex-row items-center gap-2">
        <Handshake className="w-5 h-5" />
        <CardTitle className="text-lg font-bold font-headline tracking-wide">
          {formData.documentType === 'moa' ? 'Agreement Details' : 'Understanding Details'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Activities Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Participating Activities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Junior Activity (Activity B)</Label>
              <Input
                value={moaData.activityB}
                onChange={(e) => updateMoaData('activityB', e.target.value)}
                placeholder="e.g. NAVAL SUPPORT ACTIVITY"
              />
              <p className="text-xs text-muted-foreground">Appears second in header, signs on LEFT.</p>
            </div>
            <div className="space-y-2">
              <Label>Senior Activity (Activity A)</Label>
              <Input
                value={moaData.activityA}
                onChange={(e) => updateMoaData('activityA', e.target.value)}
                placeholder="e.g. NAVAL DISTRICT WASHINGTON"
              />
              <p className="text-xs text-muted-foreground">Appears first in header, signs on RIGHT.</p>
            </div>
          </div>
        </div>

        {/* Signatories Section */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Signatories</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Junior Signer (Left) */}
            <div className="space-y-3 p-3 bg-muted/20 rounded-md border border-border/50">
              <div className="font-medium text-center border-b pb-2 mb-2">Junior Official (Signs Left)</div>
              
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={moaData.juniorSigner.name}
                  onChange={(e) => updateMoaData('juniorSigner.name', e.target.value)}
                  placeholder="I. M. JUNIOR"
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={moaData.juniorSigner.title}
                  onChange={(e) => updateMoaData('juniorSigner.title', e.target.value)}
                  placeholder="Commanding Officer"
                />
              </div>
              <div className="space-y-2">
                <Label>Activity</Label>
                <Input
                  value={moaData.juniorSigner.activity}
                  onChange={(e) => updateMoaData('juniorSigner.activity', e.target.value)}
                  placeholder="Activity Name"
                />
              </div>
            </div>

            {/* Senior Signer (Right) */}
            <div className="space-y-3 p-3 bg-muted/20 rounded-md border border-border/50">
              <div className="font-medium text-center border-b pb-2 mb-2">Senior Official (Signs Right)</div>
              
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={moaData.seniorSigner.name}
                  onChange={(e) => updateMoaData('seniorSigner.name', e.target.value)}
                  placeholder="I. M. SENIOR"
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={moaData.seniorSigner.title}
                  onChange={(e) => updateMoaData('seniorSigner.title', e.target.value)}
                  placeholder="Commanding General"
                />
              </div>
              <div className="space-y-2">
                <Label>Activity</Label>
                <Input
                  value={moaData.seniorSigner.activity}
                  onChange={(e) => updateMoaData('seniorSigner.activity', e.target.value)}
                  placeholder="Activity Name"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
