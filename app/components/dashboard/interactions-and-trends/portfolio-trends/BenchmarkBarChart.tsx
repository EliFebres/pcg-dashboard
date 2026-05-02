'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

export type BenchmarkRegion = {
  region: string;
  acwi: number;
  portfolios: Record<string, { client: number; delta: number }>;
};

type DisplayedPortfolio = { name: string; idx: number; exiting: boolean };

type Props = {
  data: BenchmarkRegion[];
  displayedPortfolios: DisplayedPortfolio[];
  palette: ReadonlyArray<{ hex: string; glow: string }>;
  exitMs: number;
  yMax?: number;
};

const MARGIN = { top: 16, right: 8, left: 42, bottom: 28 };
const SLIDE_MS = 550;
const INNER_GAP = 4;
const Y_TICKS = [0, 20, 40, 60, 80];
const ACWI_KEY = '__ACWI__';
const ACWI_COLOR = { hex: '#71717a', glow: 'rgba(113,113,122,0.4)' };

// Custom SVG bar chart that animates layout changes:
// - Adding a portfolio: existing bars slide to make room (x/width transitions), then the new
//   bar rises in via a delayed scaleY keyframe so the slide-apart finishes first.
// - Removing a portfolio: the removed bar shrinks (scaleY → 0) before the parent unmounts it;
//   afterwards the remaining bars slide together via CSS transitions on x/width.
export default function BenchmarkBarChart({ data, displayedPortfolios, palette, exitMs, yMax = 80 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setSize({ w: width, h: height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Track which bar keys were rendered last frame so we can apply the rise animation only to new ones.
  const currentBarKeys = useMemo(
    () => new Set<string>([ACWI_KEY, ...displayedPortfolios.map(p => p.name)]),
    [displayedPortfolios]
  );
  const prevBarKeysRef = useRef<Set<string>>(currentBarKeys);
  const newBarNames = useMemo(() => {
    const news = new Set<string>();
    currentBarKeys.forEach(k => {
      if (!prevBarKeysRef.current.has(k)) news.add(k);
    });
    return news;
  }, [currentBarKeys]);
  useEffect(() => {
    prevBarKeysRef.current = currentBarKeys;
  }, [currentBarKeys]);

  const chartW = Math.max(0, size.w - MARGIN.left - MARGIN.right);
  const chartH = Math.max(0, size.h - MARGIN.top - MARGIN.bottom);
  const nRegions = data.length;
  const groupSlotW = nRegions > 0 ? chartW / nRegions : 0;
  const groupWidth = groupSlotW * 0.78;

  // Render order is portfolios in selection order, then ACWI last. Exiting portfolios keep
  // their slot until the parent unmounts them so the shrink-then-slide sequence reads cleanly.
  const barOrder = [
    ...displayedPortfolios.map(p => ({ kind: 'portfolio' as const, name: p.name, idx: p.idx, exiting: p.exiting })),
    { kind: 'index' as const, name: ACWI_KEY, idx: -1, exiting: false },
  ];
  const nBars = barOrder.length;
  const barWidth = nBars > 0 ? Math.max(0, (groupWidth - (nBars - 1) * INNER_GAP) / nBars) : 0;

  const yToPx = (v: number) => MARGIN.top + chartH - (v / yMax) * chartH;
  const baseY = yToPx(0);

  return (
    <div ref={containerRef} className="w-full h-full">
      {size.w > 0 && size.h > 0 && (
        <svg width={size.w} height={size.h} style={{ overflow: 'visible' }}>
          {Y_TICKS.map(v => {
            const y = yToPx(v);
            return (
              <g key={v}>
                <line x1={MARGIN.left} x2={MARGIN.left + chartW} y1={y} y2={y} stroke="rgba(82,82,91,0.25)" />
                <text
                  x={MARGIN.left - 8}
                  y={y}
                  fill="#a5a5b2"
                  fontSize={11}
                  textAnchor="end"
                  dominantBaseline="central"
                >
                  {v}%
                </text>
              </g>
            );
          })}
          <line
            x1={MARGIN.left}
            x2={MARGIN.left + chartW}
            y1={baseY}
            y2={baseY}
            stroke="rgba(82,82,91,0.6)"
          />

          {data.map((region, regionIdx) => {
            const groupCx = MARGIN.left + groupSlotW * (regionIdx + 0.5);
            const totalW = nBars * barWidth + Math.max(0, nBars - 1) * INNER_GAP;
            const startX = groupCx - totalW / 2;

            return (
              <g key={region.region}>
                <text
                  x={groupCx}
                  y={size.h - MARGIN.bottom + 16}
                  fill="#a5a5b2"
                  fontSize={11}
                  textAnchor="middle"
                >
                  {region.region}
                </text>

                {barOrder.map((bar, j) => {
                  const x = startX + j * (barWidth + INNER_GAP);
                  const isIndex = bar.kind === 'index';
                  let value: number;
                  let color: { hex: string; glow: string };
                  let labelText: string;
                  let labelColor: string;
                  if (isIndex) {
                    value = region.acwi;
                    color = ACWI_COLOR;
                    labelText = `${value}%`;
                    labelColor = '#a1a1aa';
                  } else {
                    const p = region.portfolios[bar.name];
                    value = p?.client ?? 0;
                    const delta = p?.delta ?? 0;
                    labelText = `${delta >= 0 ? '+' : ''}${delta}%`;
                    labelColor = delta >= 0 ? '#34d399' : '#f87171';
                    color = palette[bar.idx] ?? palette[0];
                  }
                  const h = (value / yMax) * chartH;
                  const y = yToPx(value);
                  const isNew = newBarNames.has(bar.name) && !bar.exiting;

                  return (
                    <BarSlot
                      key={bar.name}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={h}
                      color={color}
                      isNew={isNew}
                      isExiting={bar.exiting}
                      labelText={labelText}
                      labelColor={labelColor}
                      exitMs={exitMs}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

type BarSlotProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: { hex: string; glow: string };
  isNew: boolean;
  isExiting: boolean;
  labelText: string;
  labelColor: string;
  exitMs: number;
};

function BarSlot({ x, y, width, height, color, isNew, isExiting, labelText, labelColor, exitMs }: BarSlotProps) {
  const transformOrigin = `${x + width / 2}px ${y + height}px`;
  const rectTransition =
    `x ${SLIDE_MS}ms ease-out, width ${SLIDE_MS}ms ease-out, ` +
    `y ${SLIDE_MS}ms ease-out, height ${SLIDE_MS}ms ease-out, ` +
    `transform ${exitMs}ms ease-out, opacity ${exitMs}ms ease-out`;

  return (
    <g>
      <rect
        className={isNew ? 'benchmark-bar--rising' : undefined}
        x={x}
        y={y}
        width={Math.max(0, width)}
        height={Math.max(0, height)}
        fill={color.hex}
        rx={3}
        ry={3}
        style={{
          transformOrigin,
          transform: isExiting ? 'scaleY(0)' : undefined,
          opacity: isExiting ? 0 : 1,
          filter: `drop-shadow(0 0 6px ${color.glow})`,
          transition: rectTransition,
        }}
      />
      <text
        className={isNew ? 'benchmark-label--rising' : undefined}
        x={x + width / 2}
        y={y - 6}
        textAnchor="middle"
        fontSize={12}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill={labelColor}
        style={{
          opacity: isExiting ? 0 : 1,
          transition: `x ${SLIDE_MS}ms ease-out, y ${SLIDE_MS}ms ease-out, opacity ${exitMs}ms ease-out`,
        }}
      >
        {labelText}
      </text>
    </g>
  );
}
