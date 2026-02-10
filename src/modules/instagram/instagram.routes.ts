import { FastifyPluginAsync } from "fastify";

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

interface InstagramResponse {
  data: InstagramMedia[];
}

export const instagramRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/api/instagram/feed", async (request, reply) => {
    const token = fastify.config.INSTAGRAM_ACCESS_TOKEN;

    if (!token) {
      return reply.send({ data: [] });
    }

    try {
      const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=4&access_token=${token}`;
      const res = await fetch(url);

      if (!res.ok) {
        fastify.log.warn(`Instagram API error: ${res.status}`);
        return reply.send({ data: [] });
      }

      const json = (await res.json()) as InstagramResponse;

      // Strip the access token from media_urls and return only what the frontend needs
      const posts = json.data.map((item) => ({
        id: item.id,
        caption: item.caption ?? "",
        mediaType: item.media_type,
        mediaUrl: item.media_url,
        thumbnailUrl: item.thumbnail_url ?? item.media_url,
        permalink: item.permalink,
        timestamp: item.timestamp,
      }));

      reply.header("Cache-Control", "public, max-age=600");
      return reply.send({ data: posts });
    } catch (err) {
      fastify.log.error(err, "Failed to fetch Instagram feed");
      return reply.send({ data: [] });
    }
  });
};
