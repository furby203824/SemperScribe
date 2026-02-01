import { Font } from '@react-pdf/renderer';
import { resolvePublicPath } from './path-utils';

/**
 * Get the full URL for fonts based on deployment environment
 * Isolated for testability and to handle browser-specific logic
 */
export function getFullFontUrl(fontPath: string): string {
  if (typeof window !== 'undefined') {
    const basePath = resolvePublicPath(fontPath);
    return `${window.location.origin}${basePath}`;
  }
  return fontPath;
}

/**
 * Register Liberation fonts for PDF generation
 * Liberation fonts are metrically compatible with Times New Roman and Courier New
 *
 * - Liberation Serif → Times New Roman equivalent
 * - Liberation Mono → Courier New equivalent
 */
export function registerPDFFonts() {
  // Liberation Serif (Times New Roman equivalent)
  Font.register({
    family: 'Liberation Serif',
    fonts: [
      { src: getFullFontUrl('/fonts/LiberationSerif-Regular.ttf'), fontWeight: 'normal' },
      { src: getFullFontUrl('/fonts/LiberationSerif-Bold.ttf'), fontWeight: 'bold' },
      // Fallback for missing Italic fonts to prevent runtime errors
      { src: getFullFontUrl('/fonts/LiberationSerif-Regular.ttf'), fontWeight: 'normal', fontStyle: 'italic' },
      { src: getFullFontUrl('/fonts/LiberationSerif-Bold.ttf'), fontWeight: 'bold', fontStyle: 'italic' },
    ],
  });

  // Liberation Mono (Courier New equivalent)
  Font.register({
    family: 'Liberation Mono',
    fonts: [
      { src: getFullFontUrl('/fonts/LiberationMono-Regular.ttf'), fontWeight: 'normal' },
      // Fallback for missing Bold/Italic fonts
      { src: getFullFontUrl('/fonts/LiberationMono-Regular.ttf'), fontWeight: 'bold' },
      { src: getFullFontUrl('/fonts/LiberationMono-Regular.ttf'), fontWeight: 'normal', fontStyle: 'italic' },
      { src: getFullFontUrl('/fonts/LiberationMono-Regular.ttf'), fontWeight: 'bold', fontStyle: 'italic' },
    ],
  });

  // Disable hyphenation to match Word behavior
  Font.registerHyphenationCallback((word) => [word]);
}

/**
 * Get the PDF font family name based on the body font setting
 */
export function getPDFBodyFont(bodyFont: 'times' | 'courier'): string {
  return bodyFont === 'courier' ? 'Liberation Mono' : 'Liberation Serif';
}

/**
 * PDF font family constants
 */
export const PDF_FONTS = {
  SERIF: 'Liberation Serif',
  MONO: 'Liberation Mono',
} as const;
