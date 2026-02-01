import React from 'react';
import { FormData, AMHSReference } from '@/types';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { AMHSDefinition } from '@/lib/schemas';
import { ReferenceManager } from './ReferenceManager';
import { POCManager } from './POCManager';
import { MessageBodyEditor } from './MessageBodyEditor';
import { AMHSPreview } from './AMHSPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    return <div className="p-4 text-destructive">Error: AMHS Definition failed to load. Please check schema definitions.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Edit Message</TabsTrigger>
          <TabsTrigger value="preview">Preview & Export</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="space-y-6 mt-6">
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
        </TabsContent>
        
        <TabsContent value="preview" className="mt-6">
          <AMHSPreview 
            formData={formData} 
            references={formData.amhsReferences || []} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
