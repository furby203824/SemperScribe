/**
 * CollapsibleSection Component
 * Reusable component for sections that can be expanded/collapsed
 */

"use client"

import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultExpanded = false,
  className = ""
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-lg font-semibold">{title}</span>
        </div>
        {isExpanded
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
      </button>

      {isExpanded && (
        <div className="p-6 pt-0 border-t">
          {children}
        </div>
      )}
    </div>
  );
}
