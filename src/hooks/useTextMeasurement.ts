import { useMemo } from 'react'
import { prepare, layout } from '@chenglou/pretext'

// Line height multiplier for body text
const LINE_HEIGHT = 1.5
// Font size matching CSS
const FONT_SIZE = '14px'

/**
 * Pre-measure text height without triggering DOM layout reflow.
 * Returns the measured height in pixels for the given content and container width.
 */
export function measureTextHeight(
  content: string,
  containerWidth: number,
  fontSize: string = FONT_SIZE,
  lineHeight: number = LINE_HEIGHT
): number {
  if (!content || content.trim() === '') return 0
  if (containerWidth <= 0) return 0

  const prepared = prepare(content, `${fontSize}, sans-serif`)
  const result = layout(prepared, containerWidth, lineHeight)

  // Convert line-height units to pixels
  const fontSizeNum = parseInt(fontSize)
  const lineHeightPx = fontSizeNum * lineHeight

  return result.lineCount * lineHeightPx
}
