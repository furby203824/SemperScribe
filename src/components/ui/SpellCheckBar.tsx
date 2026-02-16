'use client';

import React, { useState } from 'react';
import { SpellIssue } from '@/hooks/useSpellCheck';
import { cn } from '@/lib/utils';
import { AlertTriangle, BookOpen, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SpellCheckBarProps {
  issues: SpellIssue[];
  className?: string;
}

export function SpellCheckBar({ issues, className }: SpellCheckBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (issues.length === 0) return null;

  const visible = issues.filter(i => !dismissed.has(i.word.toUpperCase()));
  if (visible.length === 0) return null;

  const displayed = expanded ? visible : visible.slice(0, 5);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn(
        'flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs',
        'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/50',
        className,
      )}>
        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium shrink-0">
          <BookOpen className="h-3 w-3" />
          <span>{visible.length} flagged</span>
        </span>

        <span className="text-amber-300 dark:text-amber-700">|</span>

        {displayed.map((issue) => (
          <Tooltip key={issue.word}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  'cursor-default text-[10px] px-1.5 py-0 h-5 font-mono gap-1 group',
                  issue.type === 'unknown'
                    ? 'border-amber-400/60 text-amber-800 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/30'
                    : 'border-blue-400/60 text-blue-800 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/30',
                )}
              >
                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                {issue.word}
                <button
                  type="button"
                  className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDismissed(prev => new Set(prev).add(issue.word.toUpperCase()));
                  }}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {issue.type === 'unknown' ? (
                <p>
                  <span className="font-semibold">&ldquo;{issue.word}&rdquo;</span> not found in
                  military dictionary. May be misspelled or a specialized term.
                </p>
              ) : (
                <p>
                  <span className="font-semibold">{issue.word}</span>: {issue.suggestion}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}

        {visible.length > 5 && (
          <button
            type="button"
            className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 hover:underline text-[10px]"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-2.5 w-2.5" /></>
            ) : (
              <>+{visible.length - 5} more <ChevronDown className="h-2.5 w-2.5" /></>
            )}
          </button>
        )}
      </div>
    </TooltipProvider>
  );
}
