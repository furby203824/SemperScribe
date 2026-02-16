'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DocumentTypeDefinition, FieldDefinition } from '@/lib/schemas';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DynamicFormProps {
  documentType: DocumentTypeDefinition;
  onSubmit: (data: any) => void;
  defaultValues?: any;
}

export function DynamicForm({ documentType, onSubmit, defaultValues }: DynamicFormProps) {
  // Calculate allowed top-level keys based on document definitions
  const allowedTopLevelKeys = React.useMemo(() => {
    const keys = new Set<string>(['documentType']);
    documentType.sections.forEach(section => {
      section.fields.forEach(field => {
         const topLevel = field.name.split('.')[0];
         keys.add(topLevel);
      });
    });
    return keys;
  }, [documentType]);

  // Sanitize default values to only include fields relevant to this form
  const sanitizedDefaultValues = React.useMemo(() => {
      if (!defaultValues) return { documentType: documentType.id };
      
      const sanitized: any = {};
      Object.keys(defaultValues).forEach(key => {
          if (allowedTopLevelKeys.has(key)) {
              sanitized[key] = defaultValues[key];
          }
      });
      // Ensure documentType is set
      sanitized.documentType = documentType.id;
      return sanitized;
  }, [defaultValues, allowedTopLevelKeys, documentType.id]);

  const form = useForm({
    resolver: zodResolver(documentType.schema),
    defaultValues: sanitizedDefaultValues,
    mode: 'onChange',
  });

  // Watch for changes to sync with parent immediately (optional but good for previews)
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const subscription = form.watch((value) => {
       if (onSubmit) {
         clearTimeout(timeoutId);
         timeoutId = setTimeout(() => {
           // Double-check filtering (though sanitizedDefaultValues should handle it)
           const filteredValue: any = {};
           Object.keys(value).forEach(key => {
               if (allowedTopLevelKeys.has(key)) {
                   filteredValue[key] = value[key];
               }
           });
           onSubmit(filteredValue);
         }, 500);
       }
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [form.watch, onSubmit]);

  const renderField = (field: FieldDefinition) => {
    // Dynamic condition check
    if (field.condition && !field.condition(form.getValues())) {
      return null;
    }

    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem className={field.className}>
            <FormLabel>{field.label} {field.required && <span className="text-destructive">*</span>}</FormLabel>
            <FormControl>
              {field.type === 'text' || field.type === 'combobox' ? (
                <Input placeholder={field.placeholder} {...formField} value={formField.value ?? ''} />
              ) : field.type === 'date' ? (
                <Input type="text" placeholder={field.placeholder || 'DD MMM YY'} {...formField} value={formField.value ?? ''} />
              ) : field.type === 'textarea' ? (
                <Textarea placeholder={field.placeholder} rows={field.rows} {...formField} value={formField.value ?? ''} />
              ) : field.type === 'number' ? (
                 <Input type="number" placeholder={field.placeholder} {...formField} value={formField.value ?? ''} />
              ) : field.type === 'select' ? (
                <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || "Select..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={formField.value} 
                    onCheckedChange={formField.onChange} 
                  />
                  <span className="text-sm font-medium">{field.placeholder}</span>
                </div>
              ) : null}
            </FormControl>
            {field.description && <FormDescription>{field.description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form className="space-y-4"> {/* Removed onSubmit since we auto-sync */}
        {documentType.sections.map(section => (
          <Card key={section.id} className="mb-8 border-border shadow-sm">
             <CardHeader className="pb-3 bg-secondary text-secondary-foreground rounded-t-lg">
                <CardTitle className="text-lg font-semibold flex items-center">
                    {section.title}
                </CardTitle>
                {section.description && <p className="text-sm text-secondary-foreground/80">{section.description}</p>}
             </CardHeader>
             <CardContent className="pt-6">
                <div className={`grid gap-6 ${section.className || 'grid-cols-1 md:grid-cols-2'}`}>
                  {section.fields.map(renderField)}
                </div>
             </CardContent>
          </Card>
        ))}
      </form>
    </Form>
  );
}
