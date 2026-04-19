/**
 * SentimentTrend — primary time-series chart (archetype #1).
 *
 * Usage:
 *   <SentimentTrend data={buckets} height={280} />
 *
 * Spec: DESIGN_SYSTEM.md § Sentiment chart archetypes #1
 * - One continuous line, color-interpolated via vertical linearGradient
 * - Soft area fill beneath at 12% opacity, same gradient
 * - Dashed rule at y=0 in paper-300
 * - No legend — y-axis labels "positive" / "negative"
 * - Tooltip: date, value, sample size, sentiment word
 * - ~6 adaptive x-axis ticks
 */

"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import {
  ResponsiveContainer,
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";

import { cn } from "@/lib/utils";
import {
  sentimentGradientStops,
  sentimentLabel,
} from "@/lib/design/sentiment-gradient";
import { resolvedColors } from "@/lib/design/tokens";
import type { TimeseriesBucket } from "@/lib/types/timeseries";

interface SentimentTrendProps extends ComponentPropsWithoutRef<"div"> {
  data: TimeseriesBucket[];
  height?: number;
}

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
  // Always include last
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
      <div className="mt-1 font-medium text-[var(--ink-900)]">
        {d.value > 0 ? "+" : ""}
        {d.value.toFixed(1)} — {sentimentLabel(d.value)}
      </div>
      <div className="text-[var(--ink-500)]">
        {d.sampleSize.toLocaleString()} posts
      </div>
    </div>
  );
}

const GRADIENT_ID = "sentimentTrendGrad";
const GRADIENT_FILL_ID = "sentimentTrendFill";

const SentimentTrend = forwardRef<HTMLDivElement, SentimentTrendProps>(
  ({ className, data, height = 280, ...props }, ref) => {
    const stops = sentimentGradientStops("light");
    const ticks = pickTicks(data, 6);
    const c = resolvedColors.light;

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
          >
            <defs>
              {/* Vertical gradient for stroke — pos-strong at top, neg-strong at bottom */}
              <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                {stops.map((s, i) => (
                  <stop
                    key={i}
                    offset={s.offset}
                    stopColor={s.color}
                    stopOpacity={1}
                  />
                ))}
              </linearGradient>
              {/* Same gradient at 12% opacity for area fill */}
              <linearGradient id={GRADIENT_FILL_ID} x1="0" y1="0" x2="0" y2="1">
                {stops.map((s, i) => (
                  <stop
                    key={i}
                    offset={s.offset}
                    stopColor={s.color}
                    stopOpacity={0.12}
                  />
                ))}
              </linearGradient>
            </defs>

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
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tickFormatter={(v: number) => {
                if (v === 1) return "POSITIVE";
                if (v === -1) return "NEGATIVE";
                return "";
              }}
              tick={{
                fontSize: 10,
                fill: c.ink[500],
                fontWeight: 500,
                letterSpacing: "0.05em",
              }}
              tickLine={false}
              axisLine={false}
              width={72}
            />

            {/* Neutral axis */}
            <ReferenceLine
              y={0}
              stroke={c.paper[300]}
              strokeDasharray="2 4"
            />

            {/* Area fill */}
            <Area
              type="monotone"
              dataKey="value"
              fill={`url(#${GRADIENT_FILL_ID})`}
              stroke="none"
              isAnimationActive={false}
            />

            {/* Main line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={`url(#${GRADIENT_ID})`}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                stroke: c.ink[900],
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
    );
  },
);
SentimentTrend.displayName = "SentimentTrend";

export { SentimentTrend };
export type { SentimentTrendProps };
