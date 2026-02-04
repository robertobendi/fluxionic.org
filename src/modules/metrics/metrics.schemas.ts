import { Type, Static } from "@sinclair/typebox";

export const PageviewBodySchema = Type.Object({
  path: Type.String({ pattern: "^/" }), // Must start with /
  referrer: Type.Optional(Type.String({ format: "uri" })),
});

export const PageviewResponseSchema = Type.Object({
  success: Type.Boolean(),
});

export type PageviewBody = Static<typeof PageviewBodySchema>;
export type PageviewResponse = Static<typeof PageviewResponseSchema>;
