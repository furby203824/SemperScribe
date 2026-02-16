'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const COMMON_OFFICES = [
  'DC M&RA', 'DC PP&O', 'DC I', 'DC AVN', 'DC CD&I',
  'AC/S G-1', 'AC/S G-2', 'AC/S G-3', 'AC/S G-4', 'AC/S G-6', 'AC/S G-8',
  'SJA', 'PAO', 'Inspector General', 'Comptroller',
];

function ConcurrenceIcon({ status }: { status: string }) {
  if (status === 'concur') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === 'nonconcur') return <XCircle className="h-4 w-4 text-red-600" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

export function CoordinationPageForm() {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'coordinatingOffices',
  });

  return (
    <Card className="mb-8 border-border shadow-sm">
      <CardHeader className="pb-3 bg-secondary text-secondary-foreground rounded-t-lg">
        <CardTitle className="text-lg font-semibold">Coordinating Offices</CardTitle>
        <p className="text-sm opacity-80 mt-1">
          Each coordinating office indicates concurrence or non-concurrence with the action.
          Per MCO 5216.20B, non-concurrence requires a memorandum listing the reason.
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Summary Stats */}
        {fields.length > 0 && (
          <div className="flex gap-4 mb-4 text-sm">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">
                {fields.filter((_, i) => {
                  const el = document.querySelector(`[name="coordinatingOffices.${i}.concurrence"]`);
                  return el instanceof HTMLInputElement && el.value === 'concur';
                }).length || '—'} Concur
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-muted-foreground">Nonconcur</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Pending</span>
            </span>
          </div>
        )}

        <div className="grid gap-4">
          {fields.map((item, index) => (
            <div
              key={item.id}
              className="p-4 border rounded-lg bg-background space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Office {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {/* Office / Staff Agency */}
                <FormField
                  control={control}
                  name={`coordinatingOffices.${index}.office`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office / Staff Agency *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., AC/S G-3"
                          list={`office-suggestions-${index}`}
                          {...field}
                        />
                      </FormControl>
                      <datalist id={`office-suggestions-${index}`}>
                        {COMMON_OFFICES.map(o => (
                          <option key={o} value={o} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Concurrence Status */}
                <FormField
                  control={control}
                  name={`coordinatingOffices.${index}.concurrence`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concurrence</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'pending'}>
                        <FormControl>
                          <SelectTrigger className={cn(
                            field.value === 'concur' && 'border-green-500 bg-green-50 dark:bg-green-950/20',
                            field.value === 'nonconcur' && 'border-red-500 bg-red-50 dark:bg-red-950/20',
                          )}>
                            <div className="flex items-center gap-2">
                              <ConcurrenceIcon status={field.value || 'pending'} />
                              <SelectValue placeholder="Select..." />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="concur">Concur</SelectItem>
                          <SelectItem value="nonconcur">Nonconcur</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Officer Name */}
                <FormField
                  control={control}
                  name={`coordinatingOffices.${index}.aoName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action Officer</FormLabel>
                      <FormControl>
                        <Input placeholder="Name / Rank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date */}
                <FormField
                  control={control}
                  name={`coordinatingOffices.${index}.date`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input placeholder="DD Mmm YY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Initials */}
                <FormField
                  control={control}
                  name={`coordinatingOffices.${index}.initials`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initials</FormLabel>
                      <FormControl>
                        <Input placeholder="JMD" className="max-w-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Comments (shown for nonconcur, optional for all) */}
              <FormField
                control={control}
                name={`coordinatingOffices.${index}.comments`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Comments
                      <FormField
                        control={control}
                        name={`coordinatingOffices.${index}.concurrence`}
                        render={({ field: concField }) => (
                          concField.value === 'nonconcur' ? (
                            <span className="text-red-600 text-xs ml-2">(Required for nonconcurrence)</span>
                          ) : <></>
                        )}
                      />
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Remarks or reason for nonconcurrence..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ office: '', concurrence: 'pending', aoName: '', date: '', initials: '', comments: '' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Coordinating Office
          </Button>

          {/* Quick-add common offices */}
          {fields.length === 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const defaults = ['AC/S G-1', 'AC/S G-3', 'AC/S G-4', 'AC/S G-8', 'SJA'];
                defaults.forEach(office =>
                  append({ office, concurrence: 'pending', aoName: '', date: '', initials: '', comments: '' })
                );
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Common Staff Sections
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
