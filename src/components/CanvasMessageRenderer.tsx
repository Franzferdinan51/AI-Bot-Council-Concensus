/**
 * CanvasMessageRenderer — particle text rendering powered by @chenglou/pretext
 *
 * Features:
 * - Each character is drawn at its exact measured canvas position (no DOM reflow)
 * - Scatter animation: chars explode from center then drift to measured positions
 * - Streaming pop: new chars scale up with overshoot easing
 * - Glow effects via ctx.shadowBlur
 * - Avatar + name drawn on canvas
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  prepareWithSegments,
  layoutWithLines,
  layoutNextLine,
  type PreparedTextWithSegments,
  type LayoutLine,
  type LayoutCursor,
} from '@chenglou/pretext';

interface Message {
  id: string;
  role: 'councilor' | 'user' | 'system';
  councilorName?: string;
  councilorEmoji?: string;
  councilorColor?: string;
  content: string;
  timestamp: Date;
}

interface Particle {
  char: string;
  // Actual draw position on canvas (target)
  drawX: number;
  drawY: number;
  // Current animated position
  currX: number;
  currY: number;
  // Scatter velocity (random initial velocity for scatter effect)
  svx: number;
  svy: number;
  scale: number;
  lineIndex: number;
}

interface RenderedMessage {
  id: string;
  y: number;
  width: number;
  height: number;
  particles: Particle[];
  scatterProgress: number;
  scatterDone: boolean;
  avatarX: number;
  avatarY: number;
  avatarRadius: number;
  nameX: number;
  nameY: number;
  role: string;
  color: string;
  emoji: string;
  isUser: boolean;
  isSystem: boolean;
  isStreaming: boolean;
  // Bubble drawing params
  bubbleX: number;
  bubbleY: number;
  bubbleW: number;
  bubbleH: number;
}

// Font settings
const FONT_SIZE = 15;
const LINE_HEIGHT = 22;
const FONT = `${FONT_SIZE}px Inter, system-ui, sans-serif`;
const AVATAR_SIZE = 40;
const AVATAR_RADIUS = 10;
const GAP = 16;
const PADDING_LEFT = 24;
const PADDING_TOP = 24;

function getTextColor(isUser: boolean, isSystem: boolean): string {
  if (isUser) return '#E5E7EB';
  if (isSystem) return '#CBD5E1';
  return '#E2E8F0';
}

function getBubbleFillStyle(isUser: boolean, isSystem: boolean): string {
  if (isUser) return 'rgba(37, 99, 235, 0.9)';
  if (isSystem) return 'rgba(30, 41, 59, 0.9)';
  return 'rgba(30, 41, 59, 0.82)';
}

function getBubbleStroke(isSystem: boolean, isCouncilor: boolean): string {
  if (isSystem) return 'rgba(71, 85, 105, 0.5)';
  if (isCouncilor) return 'rgba(100, 116, 139, 0.3)';
  return 'transparent';
}

// Rough character width estimation (canvas measureText is expensive per-char)
function charWidth(c: string): number {
  if (/\s/.test(c)) return FONT_SIZE * 0.38;
  if (/[.,;:!?'"()\[\]{}]/.test(c)) return FONT_SIZE * 0.28;
  if (/[lI1|ijrtf]/.test(c)) return FONT_SIZE * 0.28;
  if (/[mwW]/.test(c)) return FONT_SIZE * 0.95;
  if (/[ADGOQCPSBV]/.test(c)) return FONT_SIZE * 0.72;
  if (/[EKX]/.test(c)) return FONT_SIZE * 0.68;
  return FONT_SIZE * 0.6;
}

// Compute per-grapheme canvas positions using pretext layout
function computeTextPositions(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
  baseX: number,
  baseY: number,
  lineHeight: number
): Particle[] {
  const particles: Particle[] = [];
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  let lineIndex = 0;

  while (true) {
    const line = layoutNextLine(prepared, cursor, maxWidth);
    if (!line) break;

    let xOffset = 0;
    for (let si = line.start.segmentIndex; si <= line.end.segmentIndex; si++) {
      const seg = prepared.segments[si];
      if (!seg) continue;

      for (let gi = 0; gi < seg.length; gi++) {
        if (si === line.start.segmentIndex && gi < line.start.graphemeIndex) continue;
        if (si === line.end.segmentIndex && gi > line.end.graphemeIndex) continue;

        const ch = seg[gi];
        if (!ch) continue;

        const drawX = baseX + xOffset;
        const drawY = baseY + lineIndex * lineHeight;

        particles.push({
          char: ch,
          drawX,
          drawY,
          currX: drawX,
          currY: drawY,
          svx: (Math.random() - 0.5) * 14,
          svy: (Math.random() - 0.5) * 14,
          scale: 1,
          lineIndex,
        });

        xOffset += charWidth(ch);
      }
    }

    cursor = { segmentIndex: line.end.segmentIndex, graphemeIndex: line.end.graphemeIndex + 1 };
    lineIndex++;
  }

  return particles;
}

interface CanvasMessageRendererProps {
  messages: Message[];
  currentStreamingId: string | null;
  containerWidth: number;
  containerHeight?: number;
}

export function CanvasMessageRenderer({
  messages,
  currentStreamingId,
  containerWidth,
}: CanvasMessageRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderedRef = useRef<Map<string, RenderedMessage>>(new Map());
  const animFrameRef = useRef<number>(0);

  // Compute layout — runs when messages or container change
  const computeLayout = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const textAreaWidth = Math.max(containerWidth - 120, 200);

    let yOffset = PADDING_TOP;

    messages.forEach((msg) => {
      const isUser = msg.role === 'user';
      const isSystem = msg.role === 'system';
      const isStreaming = currentStreamingId === msg.id;

      const prepared = prepareWithSegments(msg.content, FONT);
      const { height } = layoutWithLines(prepared, textAreaWidth, LINE_HEIGHT);

      // Text bubble internal area
      const textBaseX = PADDING_LEFT + AVATAR_SIZE + GAP + 10; // 90
      const textBaseY = yOffset + AVATAR_SIZE / 2 + 4;

      const particles = computeTextPositions(
        prepared,
        textAreaWidth,
        textBaseX,
        textBaseY,
        LINE_HEIGHT
      );

      const bubbleHeight = Math.max(height + 28, 60);
      const bubbleWidth = particles.length > 0
        ? Math.max(...particles.map(p => p.drawX - textBaseX)) + 20
        : textAreaWidth;

      const bubbleX = PADDING_LEFT + AVATAR_SIZE + GAP - 4;
      const bubbleY = yOffset + AVATAR_SIZE / 2 - 4;

      const existing = renderedRef.current.get(msg.id);
      const isNew = !existing;

      // Scatter center: avatar center
      const scatterCX = PADDING_LEFT + AVATAR_SIZE / 2;
      const scatterCY = yOffset + AVATAR_SIZE / 2;

      if (isNew) {
        // Scatter particles from avatar center
        const newParticles = particles.map(p => ({
          ...p,
          currX: scatterCX,
          currY: scatterCY,
          scale: 0,
        }));
        renderedRef.current.set(msg.id, {
          id: msg.id,
          y: yOffset,
          width: bubbleWidth,
          height: bubbleHeight,
          particles: newParticles,
          scatterProgress: 0,
          scatterDone: false,
          avatarX: PADDING_LEFT + AVATAR_SIZE / 2,
          avatarY: yOffset + AVATAR_SIZE / 2,
          avatarRadius: AVATAR_RADIUS,
          nameX: PADDING_LEFT + AVATAR_SIZE + GAP,
          nameY: yOffset + FONT_SIZE + 2,
          role: isUser ? 'You' : msg.councilorName || 'System',
          color: msg.councilorColor || '#8B5CF6',
          emoji: isUser ? '👤' : msg.councilorEmoji || '🏛️',
          isUser,
          isSystem,
          isStreaming,
          bubbleX,
          bubbleY,
          bubbleW: bubbleWidth + 8,
          bubbleH: bubbleHeight,
        });
      } else {
        // Merge existing + new particles for streaming
        const prevParticles = existing!.particles;
        const newChars = particles.slice(prevParticles.length).map(p => ({
          ...p,
          currX: scatterCX,
          currY: scatterCY,
          scale: 0,
        }));
        existing!.particles = [...prevParticles, ...newChars];
        existing!.height = bubbleHeight;
        existing!.width = bubbleWidth;
        existing!.bubbleH = bubbleHeight;
        existing!.isStreaming = isStreaming;
      }

      yOffset += bubbleHeight + 16;
    });
  }, [messages, currentStreamingId, containerWidth]);

  // Draw everything
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Auto-grow canvas height to fit content
    let contentBottom = PADDING_TOP;
    renderedRef.current.forEach(rm => {
      const bottom = rm.y + rm.height + 24;
      if (bottom > contentBottom) contentBottom = bottom;
    });
    const needed = contentBottom + 80;
    if (canvas.height < needed) canvas.height = needed;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    renderedRef.current.forEach(rm => {
      const textColor = getTextColor(rm.isUser, rm.isSystem);
      const fillStyle = getBubbleFillStyle(rm.isUser, rm.isSystem);
      const strokeStyle = getBubbleStroke(rm.isSystem, !rm.isUser && !rm.isSystem);
      const isCouncilor = !rm.isUser && !rm.isSystem;

      // Advance scatter
      if (!rm.scatterDone) {
        rm.scatterProgress = Math.min(1, rm.scatterProgress + 0.028);
        if (rm.scatterProgress >= 0.98) { rm.scatterProgress = 1; rm.scatterDone = true; }
      }

      // === AVATAR ===
      ctx.save();
      ctx.beginPath();
      ctx.arc(rm.avatarX, rm.avatarY, rm.avatarRadius, 0, Math.PI * 2);
      ctx.fillStyle = rm.color;
      ctx.shadowBlur = rm.isStreaming ? 25 : 12;
      ctx.shadowColor = rm.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Emoji
      ctx.fillStyle = 'white';
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rm.emoji, rm.avatarX, rm.avatarY);
      ctx.restore();

      // === NAME ===
      ctx.save();
      ctx.fillStyle = rm.color;
      ctx.font = `600 13px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(rm.role, rm.nameX, rm.nameY);
      ctx.restore();

      // === BUBBLE ===
      ctx.save();
      ctx.beginPath();
      const r = 12;
      if (rm.isUser) {
        ctx.roundRect(rm.bubbleX, rm.bubbleY, rm.bubbleW, rm.bubbleH, [r, 4, r, r]);
      } else {
        ctx.roundRect(rm.bubbleX, rm.bubbleY, rm.bubbleW, rm.bubbleH, r);
      }
      ctx.fillStyle = fillStyle;
      ctx.fill();
      if (strokeStyle !== 'transparent') {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Glow border for streaming
      if (rm.isStreaming) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(139, 92, 246, 0.6)';
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // === TEXT PARTICLES ===
      const particlesByLine = new Map<number, Particle[]>();
      rm.particles.forEach(p => {
        if (!particlesByLine.has(p.lineIndex)) particlesByLine.set(p.lineIndex, []);
        particlesByLine.get(p.lineIndex)!.push(p);
      });

      particlesByLine.forEach(lineParticles => {
        lineParticles.forEach(p => {
          // Spring current position toward target
          const ease = rm.scatterDone ? 0.22 : 0.1 + rm.scatterProgress * 0.14;
          p.currX += (p.drawX - p.currX) * ease;
          p.currY += (p.drawY - p.currY) * ease;

          // Streaming pop animation
          if (rm.isStreaming && p.scale < 1) {
            p.scale = Math.min(1.18, p.scale + 0.2);
            if (p.scale > 1.05) p.scale += (1 - p.scale) * 0.25; // overshoot settle
          } else if (!rm.isStreaming) {
            p.scale = 1;
          }

          ctx.save();
          ctx.translate(p.currX, p.currY);
          ctx.scale(p.scale, p.scale);
          ctx.font = FONT;
          ctx.fillStyle = textColor;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';

          if (rm.isStreaming) {
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(167, 139, 250, 0.8)';
          }

          ctx.fillText(p.char, 0, 0);
          ctx.restore();
        });
      });

      // === STREAMING CURSOR ===
      if (rm.isStreaming && rm.particles.length > 0) {
        const last = rm.particles[rm.particles.length - 1];
        ctx.save();
        ctx.fillStyle = '#A78BFA';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#A78BFA';
        ctx.fillRect(last.currX + 2, last.currY - FONT_SIZE + 2, 2, FONT_SIZE);
        ctx.restore();
      }
    });
  }, []);

  // Animation loop
  useEffect(() => {
    computeLayout();
    let running = true;
    const loop = () => {
      if (!running) return;
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [computeLayout, draw]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = containerWidth;
    canvas.height = 4096;
  }, [containerWidth]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 15 }}
    />
  );
}
