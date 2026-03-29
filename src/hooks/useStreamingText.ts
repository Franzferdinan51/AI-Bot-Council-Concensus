import { useState, useEffect, useCallback, useRef } from 'react';
import { createStreamingMeasurer } from '../lib/pretext';

interface UseStreamingTextOptions {
  width: number;
  fontSize?: number;
  lineHeight?: number;
  initialText?: string;
}

interface UseStreamingTextReturn {
  text: string;
  height: number;
  appendText: (chunk: string) => void;
  setText: (text: string) => void;
  reset: () => void;
  isStreaming: boolean;
}

export function useStreamingText(
  options: UseStreamingTextOptions
): UseStreamingTextReturn {
  const { width, fontSize = 16, lineHeight = 24, initialText = '' } = options;
  const [text, setTextState] = useState(initialText);
  const [height, setHeight] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const measurerRef = useRef<ReturnType<typeof createStreamingMeasurer> | null>(null);

  // Initialize measurer
  useEffect(() => {
    measurerRef.current = createStreamingMeasurer(width, fontSize, lineHeight);
    if (initialText) {
      const h = measurerRef.current.measure(initialText);
      setHeight(h);
    }
  }, [width, fontSize, lineHeight, initialText]);

  const appendText = useCallback((chunk: string) => {
    setIsStreaming(true);
    setTextState((prev) => {
      const newText = prev + chunk;
      if (measurerRef.current) {
        const h = measurerRef.current.append(newText);
        setHeight(h);
      }
      return newText;
    });
  }, []);

  const setText = useCallback((newText: string) => {
    setIsStreaming(false);
    setTextState(newText);
    if (measurerRef.current) {
      const h = measurerRef.current.measure(newText);
      setHeight(h);
    }
  }, []);

  const reset = useCallback(() => {
    setTextState('');
    setHeight(0);
    setIsStreaming(false);
    if (measurerRef.current) {
      measurerRef.current.reset();
    }
  }, []);

  return {
    text,
    height,
    appendText,
    setText,
    reset,
    isStreaming,
  };
}
