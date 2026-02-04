import { sql, count, countDistinct, desc, gte } from "drizzle-orm";
import { db } from "../../shared/database/index.js";
import { pageview } from "../../shared/database/schema.js";

/**
 * Get metrics summary with total, today, last 7 days, and trend
 */
export async function getMetricsSummary(): Promise<{
  total: number;
  today: number;
  last7Days: number;
  trend: number[];
}> {
  // Get total pageviews
  const [totalResult] = await db
    .select({ count: count() })
    .from(pageview);

  const total = totalResult?.count ?? 0;

  // Get today's pageviews (since midnight UTC)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [todayResult] = await db
    .select({ count: count() })
    .from(pageview)
    .where(gte(pageview.createdAt, todayStart));

  const today = todayResult?.count ?? 0;

  // Get last 7 days pageviews
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [last7DaysResult] = await db
    .select({ count: count() })
    .from(pageview)
    .where(gte(pageview.createdAt, sevenDaysAgo));

  const last7Days = last7DaysResult?.count ?? 0;

  // Get trend data for last 7 days (grouped by day)
  const dayTrunc = sql<string>`date_trunc('day', ${pageview.createdAt})`;

  const trendData = await db
    .select({
      day: dayTrunc,
      count: count(),
    })
    .from(pageview)
    .where(gte(pageview.createdAt, sevenDaysAgo))
    .groupBy(dayTrunc)
    .orderBy(dayTrunc);

  // Fill in missing days with 0 counts
  const trend: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - i);
    targetDate.setUTCHours(0, 0, 0, 0);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const dayData = trendData.find(d => {
      const dayStr = new Date(d.day).toISOString().split('T')[0];
      return dayStr === targetDateStr;
    });

    trend.push(dayData?.count ?? 0);
  }

  return {
    total,
    today,
    last7Days,
    trend,
  };
}

/**
 * Get top pages by pageview count
 */
export async function getTopPages(params?: {
  days?: number;
  limit?: number;
}): Promise<Array<{ path: string; views: number }>> {
  const days = params?.days ?? 7;
  const limit = params?.limit ?? 10;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  const results = await db
    .select({
      path: pageview.path,
      views: count(),
    })
    .from(pageview)
    .where(gte(pageview.createdAt, daysAgo))
    .groupBy(pageview.path)
    .orderBy(desc(count()))
    .limit(limit);

  return results.map(r => ({
    path: r.path,
    views: r.views,
  }));
}

/**
 * Get pageview trend data grouped by day
 */
export async function getMetricsTrend(
  days: number = 7
): Promise<Array<{ date: string; views: number }>> {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  const dayTrunc = sql<string>`date_trunc('day', ${pageview.createdAt})`;

  const trendData = await db
    .select({
      day: dayTrunc,
      count: count(),
    })
    .from(pageview)
    .where(gte(pageview.createdAt, daysAgo))
    .groupBy(dayTrunc)
    .orderBy(dayTrunc);

  // Fill in missing days with 0 counts and format dates
  const result: Array<{ date: string; views: number }> = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - i);
    targetDate.setUTCHours(0, 0, 0, 0);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const dayData = trendData.find(d => {
      const dayStr = new Date(d.day).toISOString().split('T')[0];
      return dayStr === targetDateStr;
    });

    // Format as "Jan 15" style
    const formattedDate = `${months[targetDate.getUTCMonth()]} ${targetDate.getUTCDate()}`;

    result.push({
      date: formattedDate,
      views: dayData?.count ?? 0,
    });
  }

  return result;
}

/**
 * Get visitor statistics (unique visitors by time period)
 */
export async function getVisitorStats(): Promise<{
  visitors: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    allTime: number;
  };
}> {
  const now = new Date();

  // Today: UTC midnight
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  // This week: 7 days ago
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  // This month: first day of current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Query unique visitors for each period using countDistinct
  const [todayResult] = await db
    .select({ count: countDistinct(pageview.visitorHash) })
    .from(pageview)
    .where(gte(pageview.createdAt, todayStart));

  const [weekResult] = await db
    .select({ count: countDistinct(pageview.visitorHash) })
    .from(pageview)
    .where(gte(pageview.createdAt, weekStart));

  const [monthResult] = await db
    .select({ count: countDistinct(pageview.visitorHash) })
    .from(pageview)
    .where(gte(pageview.createdAt, monthStart));

  const [allTimeResult] = await db
    .select({ count: countDistinct(pageview.visitorHash) })
    .from(pageview);

  return {
    visitors: {
      today: todayResult?.count ?? 0,
      thisWeek: weekResult?.count ?? 0,
      thisMonth: monthResult?.count ?? 0,
      allTime: allTimeResult?.count ?? 0,
    },
  };
}
