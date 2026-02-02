import React from 'react';
import { FormData, AMHSReference } from '@/types';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { AMHSDefinition } from '@/lib/schemas';
import { ReferenceManager } from './ReferenceManager';
import { POCManager } from './POCManager';
import { MessageBodyEditor } from './MessageBodyEditor';

interface AMHSEditorProps {
  formData: FormData;
  onUpdate: (data: Partial<FormData>) => void;
}

export function AMHSEditor({ formData, onUpdate }: AMHSEditorProps) {
  
  const handleReferencesChange = (refs: AMHSReference[]) => {
    onUpdate({ amhsReferences: refs });
  };

  const handlePocsChange = (pocs: string[]) => {
    onUpdate({ amhsPocs: pocs });
  };

  const handleBodyChange = (text: string) => {
    onUpdate({ amhsTextBody: text });
  };

  const handleFormChange = (data: any) => {
    onUpdate(data);
  };

  if (!AMHSDefinition) {
    console.error("AMHSDefinition is undefined. Check schemas.ts export.");
    return <div className="p-4 text-destructive border border-destructive rounded bg-destructive/10">
      Error: AMHS Definition failed to load. Please refresh or check console.
    </div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Metadata & Header */}
      <DynamicForm
        documentType={AMHSDefinition}
        onSubmit={handleFormChange}
        defaultValues={formData}
      />
      
      {/* References */}
      <ReferenceManager 
        references={formData.amhsReferences || []} 
        onChange={handleReferencesChange} 
      />

      {/* POCs */}
      <POCManager 
        pocs={formData.amhsPocs || []} 
        onChange={handlePocsChange} 
      />
      
      {/* Body */}
      <MessageBodyEditor 
        value={formData.amhsTextBody || ''} 
        onChange={handleBodyChange} 
      />
    </div>
  );
}
