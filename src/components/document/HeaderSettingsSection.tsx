'use client';

import { FormData } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeaderSettingsSectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export function HeaderSettingsSection({ formData, setFormData }: HeaderSettingsSectionProps) {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Header Type</label>
        <Select
          value={formData.headerType}
          onValueChange={(val: any) => setFormData(prev => ({ ...prev, headerType: val }))}
        >
          <SelectTrigger className="bg-background border-input">
            <SelectValue placeholder="Select Header" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USMC">USMC Standard</SelectItem>
            <SelectItem value="DON">Department of the Navy</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Changes header title text</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Body Font</label>
        <Select
          value={formData.bodyFont}
          onValueChange={(val: any) => setFormData(prev => ({ ...prev, bodyFont: val }))}
        >
          <SelectTrigger className="bg-background border-input">
            <SelectValue placeholder="Select Font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="times">Times New Roman</SelectItem>
            <SelectItem value="courier">Courier New</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Font for document body</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Header Color</label>
        <Select
          value={formData.accentColor || 'black'}
          onValueChange={(val: any) => setFormData(prev => ({ ...prev, accentColor: val }))}
        >
          <SelectTrigger className="bg-background border-input">
            <SelectValue placeholder="Select Color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="black">Black</SelectItem>
            <SelectItem value="blue">Blue</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Color of header text only</p>
      </div>
    </div>
  );
}
