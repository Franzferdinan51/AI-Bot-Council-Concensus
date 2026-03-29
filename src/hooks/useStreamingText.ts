import { useState, useEffect, useRef, useCallback } from 'react';
import { measureStreamingText, DEFAULT_WIDTH, DEFAULT_LINE_HEIGHT, DEFAULT_FONT } from '../lib/pretext';

export interface StreamingTextState {
  content: string;
  measuredHeight: number;
  measuredLines: number;
  isComplete: boolean;
}

export interface UseStreamingTextOptions {
  width?: number;
  font?: string;
  lineHeight?: number;
  initialHeight?: number;
}

export function useStreamingText(
  options: UseStreamingTextOptions = {}
): StreamingTextState & {
  appendToken: (token: string) => void;
  setContent: (content: string) => void;
  reset: () => void;
} {
  const {
    width = DEFAULT_WIDTH,
    font = DEFAULT_FONT,
    lineHeight = DEFAULT_LINE_HEIGHT,
    initialHeight = 200,
  } = options;

  const [content, setContentState] = useState('');
  const [measuredHeight, setMeasuredHeight] = useState(initialHeight);
  const [measuredLines, setMeasuredLines] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  
  const contentRef = useRef('');

  // Measure whenever content changes
  useEffect(() => {
    if (content) {
      const dims = measureStreamingText(content, width, font, lineHeight);
      setMeasuredHeight(dims.height + 20); // padding
      setMeasuredLines(dims.lines);
    }
  }, [content, width, font, lineHeight]);

  const appendToken = useCallback((token: string) => {
    contentRef.current += token;
    setContentState(contentRef.current);
    setIsComplete(false);
  }, []);

  const setContent = useCallback((newContent: string) => {
    contentRef.current = newContent;
    setContentState(newContent);
    setIsComplete(true);
  }, []);

  const reset = useCallback(() => {
    contentRef.current = '';
    setContentState('');
    setMeasuredHeight(initialHeight);
    setMeasuredLines(1);
    setIsComplete(false);
  }, [initialHeight]);

  return {
    content,
    measuredHeight,
    measuredLines,
    isComplete,
    appendToken,
    setContent,
    reset,
  };
}
