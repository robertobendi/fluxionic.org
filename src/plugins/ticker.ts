import fp from 'fastify-plugin';
import { and, eq, isNotNull, lte } from 'drizzle-orm';
import { db } from '../shared/database/index.js';
import { entry, collection } from '../shared/database/schema.js';
import { processPendingDeliveries, enqueueEvent } from '../modules/webhooks/webhook.service.js';

const SCHEDULED_PUBLISH_INTERVAL_MS = 60_000;
const WEBHOOK_DELIVERY_INTERVAL_MS = 30_000;

/**
 * Promote any draft entries whose publishAt has passed. Emits webhook events
 * for each published entry so subscribers can react (Netlify rebuild, etc.).
 */
async function promoteScheduledEntries(log: { error: Function; info: Function }) {
  try {
    const due = await db
      .select({
        id: entry.id,
        slug: entry.slug,
        status: entry.status,
        data: entry.data,
        collectionSlug: collection.slug,
      })
      .from(entry)
      .innerJoin(collection, eq(collection.id, entry.collectionId))
      .where(
        and(
          eq(entry.status, 'draft'),
          isNotNull(entry.publishAt),
          lte(entry.publishAt, new Date())
        )
      )
      .limit(100);

    for (const row of due) {
      await db
        .update(entry)
        .set({ status: 'published', publishAt: null, updatedAt: new Date() })
        .where(eq(entry.id, row.id));
      await enqueueEvent('entry.published', row.collectionSlug, {
        id: row.id,
        collection: row.collectionSlug,
        slug: row.slug,
        status: 'published',
        data: row.data as Record<string, unknown>,
      });
    }
  } catch (err) {
    log.error({ err }, 'scheduled publish tick failed');
  }
}

export default fp(async (fastify) => {
  let publishTimer: NodeJS.Timeout | null = null;
  let deliveryTimer: NodeJS.Timeout | null = null;

  const tickPublish = async () => {
    await promoteScheduledEntries(fastify.log);
    publishTimer = setTimeout(tickPublish, SCHEDULED_PUBLISH_INTERVAL_MS);
  };

  const tickDelivery = async () => {
    try {
      await processPendingDeliveries();
    } catch (err) {
      fastify.log.error({ err }, 'webhook delivery tick failed');
    }
    deliveryTimer = setTimeout(tickDelivery, WEBHOOK_DELIVERY_INTERVAL_MS);
  };

  fastify.addHook('onReady', async () => {
    publishTimer = setTimeout(tickPublish, SCHEDULED_PUBLISH_INTERVAL_MS);
    deliveryTimer = setTimeout(tickDelivery, WEBHOOK_DELIVERY_INTERVAL_MS);
  });

  fastify.addHook('onClose', async () => {
    if (publishTimer) clearTimeout(publishTimer);
    if (deliveryTimer) clearTimeout(deliveryTimer);
  });
});
