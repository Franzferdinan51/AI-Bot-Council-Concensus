import { prepare, layout } from '@chenglou/pretext';

export interface PretextMeasurement {
  prepared: ReturnType<typeof prepare>;
  width: number;
  height: number;
  lineHeight: number;
}

const DEFAULT_FONT = '16px Inter, system-ui, sans-serif';
const DEFAULT_LINE_HEIGHT = 24;

let measurementCanvas: HTMLCanvasElement | null = null;

function getCanvas(): HTMLCanvasElement {
  if (!measurementCanvas) {
    measurementCanvas = document.createElement('canvas');
    measurementCanvas.style.cssText = 'position:absolute;top:-9999px;left:-9999px;';
    document.body.appendChild(measurementCanvas);
  }
  return measurementCanvas;
}

/**
 * Measure text height using @chenglou/pretext
 * This avoids expensive DOM reflow by using Canvas for font measurement
 * and pure math for subsequent calls
 */
export function measureText(
  text: string,
  width: number,
  fontSize: number = 16,
  lineHeight: number = DEFAULT_LINE_HEIGHT
): { height: number; prepared: ReturnType<typeof prepare> } {
  const font = `${fontSize}px Inter, system-ui, sans-serif`;
  const prepared = prepare(text, font);

  const result = layout(prepared, width, lineHeight);
  return {
    height: result.height,
    prepared,
  };
}

/**
 * Pre-measure text for streaming scenarios
 * Returns a function that quickly calculates height as text streams in
 */
export function createStreamingMeasurer(
  width: number,
  fontSize: number = 16,
  lineHeight: number = DEFAULT_LINE_HEIGHT
) {
  const font = `${fontSize}px Inter, system-ui, sans-serif`;
  let prepared: ReturnType<typeof prepare> | null = null;

  return {
    append: (text: string): number => {
      if (!prepared) {
        prepared = prepare(text, font);
      } else {
        prepared = prepare(text, font);
      }
      const result = layout(prepared, width, lineHeight);
      return result.height;
    },
    measure: (text: string): number => {
      const p = prepare(text, font);
      const result = layout(p, width, lineHeight);
      return result.height;
    },
    reset: () => {
      prepared = null;
    },
  };
}

/**
 * Get font metrics for accurate measurement
 */
export function getFontMetrics(
  fontSize: number = 16,
  fontFamily: string = 'Inter'
): { ascent: number; descent: number; lineGap: number } {
  const canvas = getCanvas();
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { ascent: fontSize * 0.8, descent: fontSize * 0.2, lineGap: 0 };
  }

  const font = `${fontSize}px ${fontFamily}`;
  ctx.font = font;

  const metrics = ctx.measureText('Ay');
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;

  return { ascent, descent, lineGap: 0 };
}

export { DEFAULT_FONT, DEFAULT_LINE_HEIGHT };
