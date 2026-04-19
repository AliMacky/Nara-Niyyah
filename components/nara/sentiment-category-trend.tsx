/**
 * SentimentCategoryTrend — volume-by-category time-series (archetype #5).
 *
 * Spec: DESIGN_SYSTEM.md § Sentiment chart archetypes #5
 * - Three lines: negative, neutral, positive post counts over time
 * - Colors from Nara sentiment spectrum (neg-strong, neutral, pos-strong)
 * - Neutral stroke thinner (1.5) so it recedes when lines cluster
 * - No bottom legend — inline end-of-line labels
 * - Y-axis: post count, "POSTS" label at top
 * - Dashed baseline at y=0
 * - Tooltip: all three values + total sample size
 */

"use client";

import {
  forwardRef,
  useRef,
  useEffect,
  useState,
  useMemo,
  type ComponentPropsWithoutRef,
} from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";

import { cn } from "@/lib/utils";
import { resolvedColors } from "@/lib/design/tokens";
import type { TimeseriesBucket } from "@/lib/types/timeseries";

interface SentimentCategoryTrendProps extends ComponentPropsWithoutRef<"div"> {
  data: TimeseriesBucket[];
  height?: number;
}

const c = resolvedColors.light;
const COLORS = {
  negative: c.sentiment.negStrong,
  neutral: c.sentiment.neutral,
  positive: c.sentiment.posStrong,
} as const;

const LINE_DEFS = [
  { dataKey: "negativeCount" as const, label: "NEGATIVE", color: COLORS.negative, width: 2 },
  { dataKey: "neutralCount" as const, label: "NEUTRAL", color: COLORS.neutral, width: 1.5 },
  { dataKey: "positiveCount" as const, label: "POSITIVE", color: COLORS.positive, width: 2 },
];

function formatXTick(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pickTicks(data: TimeseriesBucket[], target: number): string[] {
  if (data.length <= target) return data.map((d) => d.date);
  const step = Math.max(1, Math.floor(data.length / (target - 1)));
  const ticks: string[] = [];
  for (let i = 0; i < data.length; i += step) {
    ticks.push(data[i].date);
  }
  if (ticks[ticks.length - 1] !== data[data.length - 1].date) {
    ticks.push(data[data.length - 1].date);
  }
  return ticks;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload as TimeseriesBucket;
  const dateStr = new Date(d.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "bg-[var(--paper-100)] border border-[var(--paper-300)]",
        "rounded-md px-3 py-2",
        "text-[0.875rem] leading-[1.25rem]",
      )}
    >
      <div className="text-[0.75rem] font-medium uppercase tracking-wider text-[var(--ink-500)]">
        {dateStr}
      </div>
      <div className="mt-1.5 space-y-0.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: COLORS.negative }}
          />
          <span className="text-[var(--ink-700)]">
            Negative: {d.negativeCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: COLORS.neutral }}
          />
          <span className="text-[var(--ink-700)]">
            Neutral: {d.neutralCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: COLORS.positive }}
          />
          <span className="text-[var(--ink-700)]">
            Positive: {d.positiveCount}
          </span>
        </div>
      </div>
      <div className="mt-1.5 text-[var(--ink-500)]">
        {d.sampleSize.toLocaleString()} total posts
      </div>
    </div>
  );
}

/** Nudge overlapping y-positions apart */
function nudgePositions(
  items: { key: string; y: number }[],
  minGap: number,
): Map<string, number> {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].y - sorted[i - 1].y;
    if (gap < minGap) {
      const nudge = (minGap - gap) / 2;
      sorted[i - 1].y -= nudge;
      sorted[i].y += nudge;
    }
  }
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].y - sorted[i - 1].y;
    if (gap < minGap) {
      sorted[i].y = sorted[i - 1].y + minGap;
    }
  }
  const result = new Map<string, number>();
  for (const s of sorted) result.set(s.key, s.y);
  return result;
}

const SentimentCategoryTrend = forwardRef<
  HTMLDivElement,
  SentimentCategoryTrendProps
>(({ className, data, height = 280, ...props }, ref) => {
  const ticks = pickTicks(data, 6);
  const containerRef = useRef<HTMLDivElement>(null);
  const [labelPositions, setLabelPositions] = useState<
    { key: string; label: string; color: string; x: number; y: number }[]
  >([]);

  const maxY = useMemo(() => {
    let max = 0;
    for (const d of data) {
      max = Math.max(max, d.negativeCount, d.neutralCount, d.positiveCount);
    }
    return Math.ceil(max * 1.15);
  }, [data]);

  // After chart renders, read the SVG path endpoints to position labels
  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // Small delay to let Recharts finish rendering paths
    const timer = setTimeout(() => {
      const svg = containerRef.current?.querySelector("svg");
      if (!svg) return;

      // Find the line paths — Recharts renders them as <path> inside .recharts-line groups
      const lineGroups = svg.querySelectorAll(".recharts-line-curve");
      const positions: { key: string; label: string; color: string; x: number; y: number }[] = [];

      lineGroups.forEach((path, idx) => {
        const def = LINE_DEFS[idx];
        if (!def) return;

        const pathEl = path as SVGPathElement;
        const totalLen = pathEl.getTotalLength();
        if (totalLen === 0) return;

        const endPt = pathEl.getPointAtLength(totalLen);
        positions.push({
          key: def.dataKey,
          label: def.label,
          color: def.color,
          x: endPt.x,
          y: endPt.y,
        });
      });

      if (positions.length > 0) {
        // Nudge overlapping labels
        const nudged = nudgePositions(
          positions.map((p) => ({ key: p.key, y: p.y })),
          14,
        );
        const result = positions.map((p) => ({
          ...p,
          y: nudged.get(p.key) ?? p.y,
        }));
        setLabelPositions(result);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [data]);

  return (
    <div ref={ref} className={cn("w-full relative", className)} {...props}>
      <div ref={containerRef}>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 80, bottom: 4, left: 0 }}
          >
            <XAxis
              dataKey="date"
              tickFormatter={formatXTick}
              ticks={ticks}
              tick={{
                fontSize: 12,
                fill: c.ink[500],
                fontWeight: 500,
              }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              domain={[0, maxY]}
              tick={{
                fontSize: 12,
                fill: c.ink[500],
                fontWeight: 500,
              }}
              tickLine={false}
              axisLine={false}
              width={48}
              label={{
                value: "POSTS",
                position: "top",
                offset: 12,
                style: {
                  fontSize: 10,
                  fontWeight: 500,
                  fill: c.ink[500],
                  letterSpacing: "0.05em",
                  textAnchor: "start",
                },
              }}
            />

            <ReferenceLine
              y={0}
              stroke={c.paper[300]}
              strokeDasharray="2 4"
            />

            <Line
              type="monotone"
              dataKey="negativeCount"
              stroke={COLORS.negative}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                stroke: COLORS.negative,
                strokeWidth: 2,
                fill: c.paper[50],
              }}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="neutralCount"
              stroke={COLORS.neutral}
              strokeWidth={1.5}
              dot={false}
              activeDot={{
                r: 4,
                stroke: COLORS.neutral,
                strokeWidth: 2,
                fill: c.paper[50],
              }}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="positiveCount"
              stroke={COLORS.positive}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                stroke: COLORS.positive,
                strokeWidth: 2,
                fill: c.paper[50],
              }}
              isAnimationActive={false}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: c.paper[300],
                strokeDasharray: "2 4",
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Inline end-of-line labels — absolutely positioned over the SVG */}
      {labelPositions.map((lp) => (
        <span
          key={lp.key}
          className="absolute text-[0.625rem] leading-none font-medium uppercase tracking-wider pointer-events-none"
          style={{
            left: lp.x + 8,
            top: lp.y - 5,
            color: lp.color,
          }}
        >
          {lp.label}
        </span>
      ))}
    </div>
  );
});
SentimentCategoryTrend.displayName = "SentimentCategoryTrend";

export { SentimentCategoryTrend };
export type { SentimentCategoryTrendProps };
