import React from 'react';
import { Text } from '@react-pdf/renderer';

/**
 * Parses markdown-like formatting into React-PDF Text components.
 * Supported formats:
 * - **bold**
 * - *italic*
 * - <u>underline</u>
 */
export function parseFormattedText(text: string): React.ReactNode[] {
  if (!text) return [];
  
  // Split by markers: **...**, *...*, <u>...</u>
  // We use a non-greedy match (.*?) to handle multiple occurrences
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|<u>.*?<\/u>)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <Text key={index} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <Text key={index} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</Text>;
    }
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length >= 7) {
      return <Text key={index} style={{ textDecoration: 'underline' }}>{part.slice(3, -4)}</Text>;
    }
    // Return regular text if no match
    return part;
  });
}
