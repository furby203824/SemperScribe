
'use client';

import React, { useState, useCallback } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { militaryDictionary, DictionaryEntry } from '@/lib/military-dictionary';
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebounce } from '@/hooks/useDebounce';

interface AutoSuggestInputProps extends Omit<InputProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function AutoSuggestInput({ value, onChange, ...props }: AutoSuggestInputProps) {
  const [suggestions, setSuggestions] = useState<DictionaryEntry[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const debouncedSearch = useDebounce((query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const lowerCaseQuery = query.toLowerCase();
    const filtered = militaryDictionary.filter(
      ({ term, meaning }) =>
        term.toLowerCase().includes(lowerCaseQuery) ||
        meaning.toLowerCase().includes(lowerCaseQuery)
    );
    setSuggestions(filtered.slice(0, 10)); // Limit to top 10 suggestions
    setIsPopoverOpen(filtered.length > 0);
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    debouncedSearch(newValue);
  };

  const handleSelect = (suggestion: DictionaryEntry) => {
    onChange(suggestion.term);
    setSuggestions([]);
    setIsPopoverOpen(false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Input
          {...props}
          value={value}
          onChange={handleChange}
          autoComplete="off"
        />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandList>
            {suggestions.map((suggestion) => (
              <CommandItem
                key={suggestion.term}
                onSelect={() => handleSelect(suggestion)}
                value={suggestion.term}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{suggestion.term}</span>
                  <span className="text-xs text-muted-foreground">{suggestion.meaning}</span>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
