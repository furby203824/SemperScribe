'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ParagraphData } from '@/types';
import { logError } from '@/lib/console-utils';

/**
 * Hook for browser SpeechRecognition-based voice input.
 * Manages recognition state and appends transcripts to paragraphs.
 */
export function useVoiceInput(
  paragraphs: ParagraphData[],
  updateParagraphContent: (id: number, content: string) => void
) {
  const [voiceRecognition, setVoiceRecognition] = useState<any>(null);
  const [activeVoiceInput, setActiveVoiceInput] = useState<number | null>(null);

  const activeVoiceInputRef = useRef<number | null>(null);
  const paragraphsRef = useRef<ParagraphData[]>(paragraphs);

  // Keep refs in sync
  useEffect(() => {
    activeVoiceInputRef.current = activeVoiceInput;
  }, [activeVoiceInput]);

  useEffect(() => {
    paragraphsRef.current = paragraphs;
  }, [paragraphs]);

  // Initialize speech recognition
  const initializeVoiceRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = function (event: any) {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript && activeVoiceInputRef.current !== null) {
          const currentParagraph = paragraphsRef.current.find(p => p.id === activeVoiceInputRef.current);
          if (currentParagraph) {
            const newContent = currentParagraph.content + (currentParagraph.content ? ' ' : '') + finalTranscript;
            updateParagraphContent(activeVoiceInputRef.current, newContent);
          }
        }
      };

      recognition.onerror = function (event: any) {
        logError('Voice Recognition', event.error);
        setActiveVoiceInput(null);
      };

      recognition.onend = function () {
        setActiveVoiceInput(null);
      };

      setVoiceRecognition(recognition);
    }
  }, [updateParagraphContent]);

  useEffect(() => {
    initializeVoiceRecognition();
  }, [initializeVoiceRecognition]);

  const toggleVoiceInput = useCallback((paragraphId: number) => {
    if (!voiceRecognition) {
      alert('Voice recognition not supported in this browser');
      return;
    }
    if (activeVoiceInput === paragraphId) {
      voiceRecognition.stop();
      setActiveVoiceInput(null);
    } else {
      if (activeVoiceInput !== null) voiceRecognition.stop();
      setActiveVoiceInput(paragraphId);
      voiceRecognition.start();
    }
  }, [voiceRecognition, activeVoiceInput]);

  return {
    activeVoiceInput,
    toggleVoiceInput,
  };
}
