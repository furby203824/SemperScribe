/**
 * ValidationSummary Component
 * Displays all validation errors in one place before document generation
 */

"use client"

import * as React from "react"
import { ValidationState } from "@/types"
import { AlertTriangle, XCircle } from "lucide-react"

interface ValidationSummaryProps {
  validation: ValidationState;
}

export function ValidationSummary({ validation }: ValidationSummaryProps) {
  const errors = React.useMemo(() => {
    const errorList: { field: string; message: string }[] = [];

    if (!validation.ssic.isValid && validation.ssic.message) {
      errorList.push({ field: 'SSIC', message: validation.ssic.message });
    }
    if (!validation.subj.isValid && validation.subj.message) {
      errorList.push({ field: 'Subject', message: validation.subj.message });
    }
    if (!validation.from.isValid && validation.from.message) {
      errorList.push({ field: 'From', message: validation.from.message });
    }
    if (!validation.to.isValid && validation.to.message) {
      errorList.push({ field: 'To', message: validation.to.message });
    }

    return errorList;
  }, [validation]);

  // Don't render if there are no errors
  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      className="p-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30"
      role="alert"
      aria-label="Form validation errors"
    >
      <h6 className="font-bold text-amber-900 dark:text-amber-200 mb-3 flex items-center">
        <AlertTriangle className="h-4 w-4 mr-2" />
        Please fix the following issues before generating the document:
      </h6>
      <ul className="space-y-2">
        {errors.map((error, index) => (
          <li key={index} className="flex items-start">
            <XCircle className="h-4 w-4 text-destructive mr-2 mt-0.5 shrink-0" />
            <span>
              <strong>{error.field}:</strong> {error.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
