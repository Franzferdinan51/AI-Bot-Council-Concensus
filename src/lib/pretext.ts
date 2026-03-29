/**
 * Pretext helpers for zero-reflow text measurement
 * @chenglou/pretext measures via Canvas (~19ms one-time), then pure math (~0.09ms)
 */
import { prepare, layout } from '@chenglou/pretext';

export const DEFAULT_FONT = '15px Inter, system-ui, sans-serif';
export const DEFAULT_LINE_HEIGHT = 20;
export const DEFAULT_WIDTH = 600;

export interface MeasuredDimensions {
  width: number;
  height: number;
  lines: number;
}

/**
 * Pre-measure text dimensions without DOM reflow
 * Uses @chenglou/pretext for zero-reflow measurement
 */
export function measureText(
  text: string,
  width: number = DEFAULT_WIDTH,
  font: string = DEFAULT_FONT,
  lineHeight: number = DEFAULT_LINE_HEIGHT
): MeasuredDimensions {
  if (!text) {
    return { width, height: 0, lines: 1 };
  }
  
  try {
    const prepared = prepare(text, font);
    const result = layout(prepared, width, lineHeight);
    return { width, height: result.height, lines: result.lineCount };
  } catch {
    // Fallback: estimate based on character count
    const charsPerLine = Math.floor(width / 8);
    const lines = Math.ceil(text.length / charsPerLine);
    return { width, height: lines * lineHeight, lines };
  }
}

/**
 * Pre-measure multiple lines of text (for streaming)
 */
export function measureStreamingText(
  text: string,
  width: number = DEFAULT_WIDTH,
  font: string = DEFAULT_FONT,
  lineHeight: number = DEFAULT_LINE_HEIGHT
): MeasuredDimensions {
  return measureText(text, width, font, lineHeight);
}

/**
 * Pre-measure a code block (monospace font)
 */
export function measureCodeBlock(
  code: string,
  width: number = DEFAULT_WIDTH,
  fontSize: number = 13
): MeasuredDimensions {
  const font = `${fontSize}px JetBrains Mono, Fira Code, monospace`;
  return measureText(code, width, font, fontSize * 1.5);
}

/**
 * Cache for pre-measured councilor card heights
 */
const cardHeightCache = new Map<string, MeasuredDimensions>();

export function getCouncilorCardHeight(
  name: string,
  role: string,
  personality: string,
  width: number = 200
): MeasuredDimensions {
  const key = `${name}-${role}-${width}`;
  
  if (cardHeightCache.has(key)) {
    return cardHeightCache.get(key)!;
  }
  
  const text = `${name}\n${role}\n${personality}`;
  const dims = measureText(text, width, '13px Inter, system-ui, sans-serif', 18);
  cardHeightCache.set(key, dims);
  
  return dims;
}
