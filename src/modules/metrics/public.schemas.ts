import { Type, Static } from "@sinclair/typebox";

export const VisitorStatsSchema = Type.Object({
  visitors: Type.Object({
    today: Type.Number({ minimum: 0 }),
    thisWeek: Type.Number({ minimum: 0 }),
    thisMonth: Type.Number({ minimum: 0 }),
    allTime: Type.Number({ minimum: 0 }),
  }),
});

export type VisitorStats = Static<typeof VisitorStatsSchema>;
