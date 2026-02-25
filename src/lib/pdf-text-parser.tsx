import React from 'react';
import { Text } from '@react-pdf/renderer';

interface PdfStyle {
  fontWeight?: 'bold';
  fontStyle?: 'italic';
  textDecoration?: 'underline';
  [key: `@media${string}`]: never;
}

/**
 * Parses markdown-like formatting into React-PDF Text components.
 * Supports nested formatting: ***bold italic***, **<u>bold underline</u>**, *<u>italic underline</u>*, etc.
 * Uses style accumulation (not nesting) because react-pdf Text does not inherit parent styles.
 */
export function parseFormattedText(text: string, parentStyle: PdfStyle = {}): React.ReactNode[] {
  if (!text) return [];

  const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|<u>.*?<\/u>)/g);

  return parts.flatMap((part, index) => {
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return parseFormattedText(part.slice(3, -3), { ...parentStyle, fontWeight: 'bold', fontStyle: 'italic' });
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return parseFormattedText(part.slice(2, -2), { ...parentStyle, fontWeight: 'bold' });
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return parseFormattedText(part.slice(1, -1), { ...parentStyle, fontStyle: 'italic' });
    }
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length >= 7) {
      return parseFormattedText(part.slice(3, -4), { ...parentStyle, textDecoration: 'underline' });
    }
    // Leaf node: apply all accumulated styles
    if (!part) return [];
    if (Object.keys(parentStyle).length > 0) {
      return [<Text key={index} style={parentStyle}>{part}</Text>];
    }
    return [part];
  });
}
