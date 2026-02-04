import { Type, Static } from "@sinclair/typebox";

// Metrics Summary Response
export const MetricsSummarySchema = Type.Object({
  total: Type.Number(),
  today: Type.Number(),
  last7Days: Type.Number(),
  trend: Type.Array(Type.Number()),
});

export type MetricsSummary = Static<typeof MetricsSummarySchema>;

// Top Page Schema
export const TopPageSchema = Type.Object({
  path: Type.String(),
  views: Type.Number(),
});

export type TopPage = Static<typeof TopPageSchema>;

// Top Pages Query Parameters (strings from URL)
export const TopPagesQuerySchema = Type.Object({
  days: Type.Optional(Type.String({ pattern: '^[0-9]+$' })),
  limit: Type.Optional(Type.String({ pattern: '^[0-9]+$' })),
});

export type TopPagesQuery = Static<typeof TopPagesQuerySchema>;

// Top Pages Response
export const TopPagesResponseSchema = Type.Object({
  data: Type.Array(TopPageSchema),
});

export type TopPagesResponse = Static<typeof TopPagesResponseSchema>;

// Trend Query Parameters
export const TrendQuerySchema = Type.Object({
  days: Type.Optional(Type.String({ pattern: '^[0-9]+$' })),
});

export type TrendQuery = Static<typeof TrendQuerySchema>;

// Trend Data Point Schema
export const TrendDataPointSchema = Type.Object({
  date: Type.String(),
  views: Type.Number(),
});

export type TrendDataPoint = Static<typeof TrendDataPointSchema>;

// Trend Response
export const TrendResponseSchema = Type.Object({
  data: Type.Array(TrendDataPointSchema),
});

export type TrendResponse = Static<typeof TrendResponseSchema>;
