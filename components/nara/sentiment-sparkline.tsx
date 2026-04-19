/**
 * SentimentSparkline — inline micro-chart (archetype #4).
 *
 * Usage:
 *   <SentimentSparkline data={buckets} />
 *
 * Spec: DESIGN_SYSTEM.md § Sentiment chart archetypes #4
 * - 120×32px, no axes, no tooltip
 * - Single interpolated line matching SentimentTrend color logic
 * - Endpoint dot colored to the final value's position on the spectrum
 * - Used in: reports list, campaign list, search result rows
 */

"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";

import { cn } from "@/lib/utils";
import {
  sentimentColor,
  sentimentGradientStops,
} from "@/lib/design/sentiment-gradient";
import type { TimeseriesBucket } from "@/lib/types/timeseries";

interface SentimentSparklineProps extends ComponentPropsWithoutRef<"div"> {
  data: TimeseriesBucket[];
  width?: number;
  height?: number;
}

const GRADIENT_ID = "sparkGrad";

const SentimentSparkline = forwardRef<HTMLDivElement, SentimentSparklineProps>(
  ({ className, data, width = 120, height = 32, ...props }, ref) => {
    const stops = sentimentGradientStops("light");
    const lastValue = data.length > 0 ? data[data.length - 1].value : 0;
    const endDotColor = sentimentColor(lastValue);

    // Unique gradient ID per instance to avoid SVG ID collisions
    const gradId = `${GRADIENT_ID}-${Math.random().toString(36).slice(2, 8)}`;

    return (
      <div
        ref={ref}
        className={cn("inline-block", className)}
        style={{ width, height }}
        role="img"
        aria-label={`Sentiment trend sparkline, latest: ${lastValue > 0 ? "+" : ""}${lastValue.toFixed(2)}`}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                {stops.map((s, i) => (
                  <stop key={i} offset={s.offset} stopColor={s.color} />
                ))}
              </linearGradient>
            </defs>
            <Line
              type="monotone"
              dataKey="value"
              stroke={`url(#${gradId})`}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            {/* Endpoint dot — rendered manually since Recharts dot on last point is noisy */}
            {data.length > 0 && (
              <Line
                data={[data[data.length - 1]]}
                type="monotone"
                dataKey="value"
                stroke="none"
                dot={{
                  r: 3,
                  fill: endDotColor,
                  stroke: endDotColor,
                  strokeWidth: 0,
                }}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  },
);
SentimentSparkline.displayName = "SentimentSparkline";

export { SentimentSparkline };
export type { SentimentSparklineProps };
