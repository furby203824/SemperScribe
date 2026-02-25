import React from 'react';
import { Text } from '@react-pdf/renderer';

/**
 * Parses markdown-like formatting into React-PDF Text components.
 * Supports nested formatting: ***bold italic***, **<u>bold underline</u>**, *<u>italic underline</u>*, etc.
 */
export function parseFormattedText(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|<u>.*?<\/u>)/g);

  return parts.map((part, index) => {
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return <Text key={index} style={{ fontWeight: 'bold', fontStyle: 'italic' }}>{parseFormattedText(part.slice(3, -3))}</Text>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <Text key={index} style={{ fontWeight: 'bold' }}>{parseFormattedText(part.slice(2, -2))}</Text>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <Text key={index} style={{ fontStyle: 'italic' }}>{parseFormattedText(part.slice(1, -1))}</Text>;
    }
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length >= 7) {
      return <Text key={index} style={{ textDecoration: 'underline' }}>{parseFormattedText(part.slice(3, -4))}</Text>;
    }
    return part;
  });
}
