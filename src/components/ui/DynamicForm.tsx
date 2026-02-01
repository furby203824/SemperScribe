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
  const form = useForm({
    resolver: zodResolver(documentType.schema),
    defaultValues: defaultValues || { documentType: documentType.id },
    mode: 'onChange',
  });

  // Watch for changes to sync with parent immediately (optional but good for previews)
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const subscription = form.watch((value) => {
       if (onSubmit) {
         clearTimeout(timeoutId);
         timeoutId = setTimeout(() => {
           onSubmit(value);
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
                <Input placeholder={field.placeholder} {...formField} />
              ) : field.type === 'date' ? (
                <Input type="text" placeholder={field.placeholder || 'DD MMM YY'} {...formField} />
              ) : field.type === 'textarea' ? (
                <Textarea placeholder={field.placeholder} {...formField} />
              ) : field.type === 'number' ? (
                 <Input type="number" placeholder={field.placeholder} {...formField} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.fields.map(renderField)}
                </div>
             </CardContent>
          </Card>
        ))}
      </form>
    </Form>
  );
}
