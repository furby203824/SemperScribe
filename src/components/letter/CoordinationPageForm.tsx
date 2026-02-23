'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

const COMMON_OFFICES = [
  'DC M&RA', 'DC PP&O', 'DC I', 'DC AVN', 'DC CD&I',
  'AC/S G-1', 'AC/S G-2', 'AC/S G-3', 'AC/S G-4', 'AC/S G-6', 'AC/S G-8',
  'SJA', 'PAO', 'Inspector General', 'Comptroller',
];

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
          List all internal and external agencies/commands per MCO 5216.20B.
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-4">
          {fields.map((item, index) => (
            <div
              key={item.id}
              className="p-4 border rounded-lg bg-background space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Entry {index + 1}
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

              <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                {/* STAFF/EXTERNAL AGENCY */}
                <FormField
                  control={control}
                  name={`coordinatingOffices.${index}.office`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff/External Agency *</FormLabel>
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

                {/* NAME — grade and name, or "None Obtained" */}
                <FormField
                  control={control}
                  name={`coordinatingOffices.${index}.aoName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Grade and name, or None Obtained" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* DATE & POSITION — date + concur/nonconcur */}
                <div className="grid gap-2 grid-cols-2">
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

                  <FormField
                    control={control}
                    name={`coordinatingOffices.${index}.concurrence`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'pending'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
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
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ office: '', concurrence: 'pending', aoName: '', date: '' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>

          {fields.length === 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const defaults = ['AC/S G-1', 'AC/S G-3', 'AC/S G-4', 'AC/S G-8', 'SJA'];
                defaults.forEach(office =>
                  append({ office, concurrence: 'pending', aoName: '', date: '' })
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
