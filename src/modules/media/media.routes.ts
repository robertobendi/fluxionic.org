import { FastifyPluginAsync } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { requireRole } from "../auth/auth.service.js";
import { ErrorResponseSchema } from "../../shared/schemas/index.js";
import {
  uploadFile,
  cropImage,
  getImageInfo,
  listMedia,
  getMedia,
  updateMedia,
  deleteMedia,
  getStorageStats,
} from "./media.service.js";
import {
  UploadResponseSchema,
  CropImageSchema,
  MediaFileResponseSchema,
  MediaIdParamSchema,
  ImageInfoSchema,
  MediaListQuerySchema,
  PaginatedMediaListSchema,
  UpdateMediaSchema,
  StorageStatsSchema,
} from "./media.schemas.js";

export const mediaRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // GET /api/admin/media - List all media files with pagination/filtering/search
  app.get(
    "/api/admin/media",
    {
      preHandler: [requireRole("editor")],
      schema: {
        querystring: MediaListQuerySchema,
        response: {
          200: PaginatedMediaListSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await listMedia(request.query);
      return reply.send(result);
    }
  );

  // GET /api/admin/media/storage - Get storage statistics
  app.get(
    "/api/admin/media/storage",
    {
      preHandler: [requireRole("editor")],
      schema: {
        response: {
          200: StorageStatsSchema,
        },
      },
    },
    async (request, reply) => {
      const stats = await getStorageStats();
      return reply.send(stats);
    }
  );

  // GET /api/admin/media/:id - Get single media file
  app.get(
    "/api/admin/media/:id",
    {
      preHandler: [requireRole("editor")],
      schema: {
        params: MediaIdParamSchema,
        response: {
          200: MediaFileResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const media = await getMedia(id);
        return reply.send(media);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return reply.status(404).send({
            error: error.message,
          });
        }
        throw error;
      }
    }
  );

  // PATCH /api/admin/media/:id - Update media file (alt text)
  app.patch(
    "/api/admin/media/:id",
    {
      preHandler: [requireRole("editor")],
      schema: {
        params: MediaIdParamSchema,
        body: UpdateMediaSchema,
        response: {
          200: MediaFileResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const media = await updateMedia(id, request.body);
        return reply.send(media);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return reply.status(404).send({
            error: error.message,
          });
        }
        throw error;
      }
    }
  );

  // DELETE /api/admin/media/:id - Delete media file
  app.delete(
    "/api/admin/media/:id",
    {
      preHandler: [requireRole("editor")],
      schema: {
        params: MediaIdParamSchema,
        response: {
          204: Type.Null(),
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        await deleteMedia(id);
        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return reply.status(404).send({
            error: error.message,
          });
        }
        throw error;
      }
    }
  );

  // POST /api/admin/media/upload - Upload files
  app.post(
    "/api/admin/media/upload",
    {
      preHandler: [requireRole("editor")],
      schema: {
        response: {
          200: UploadResponseSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const parts = request.parts();
        const uploadedFiles = [];

        for await (const part of parts) {
          if (part.type === "file") {
            const buffer = await part.toBuffer();

            // Check file size (multipart plugin should handle this, but double-check)
            if (buffer.length > fastify.config.MAX_FILE_SIZE) {
              throw new Error(
                `File size exceeds maximum allowed size of ${fastify.config.MAX_FILE_SIZE} bytes`
              );
            }

            const file = await uploadFile(
              buffer,
              part.filename,
              part.mimetype,
              request.user!.id
            );
            uploadedFiles.push(file);
          }
        }

        if (uploadedFiles.length === 0) {
          return reply.status(400).send({
            error: "No files uploaded",
          });
        }

        return reply.send({ files: uploadedFiles });
      } catch (error) {
        // Handle file type errors
        if (error instanceof Error && error.message.includes("Invalid file type")) {
          return reply.status(400).send({
            error: error.message,
          });
        }
        throw error;
      }
    }
  );

  // GET /api/admin/media/:id/info - Get image metadata
  app.get(
    "/api/admin/media/:id/info",
    {
      preHandler: [requireRole("editor")],
      schema: {
        params: MediaIdParamSchema,
        response: {
          200: ImageInfoSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const info = await getImageInfo(id);
        return reply.send(info);
      } catch (error) {
        if (error instanceof Error) {
          // Handle not found
          if (error.message.includes("not found")) {
            return reply.status(404).send({
              error: error.message,
            });
          }
          // Handle non-image files
          if (error.message.includes("Only image files")) {
            return reply.status(400).send({
              error: error.message,
            });
          }
        }
        throw error;
      }
    }
  );

  // POST /api/admin/media/:id/crop - Crop image
  app.post(
    "/api/admin/media/:id/crop",
    {
      preHandler: [requireRole("editor")],
      schema: {
        params: MediaIdParamSchema,
        body: CropImageSchema,
        response: {
          200: MediaFileResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { left, top, width, height } = request.body;

        const croppedFile = await cropImage(
          id,
          left,
          top,
          width,
          height,
          request.user!.id
        );

        return reply.send(croppedFile);
      } catch (error) {
        if (error instanceof Error) {
          // Handle not found
          if (error.message.includes("not found")) {
            return reply.status(404).send({
              error: error.message,
            });
          }
          // Handle invalid coordinates or non-image files
          if (
            error.message.includes("Invalid crop coordinates") ||
            error.message.includes("Only image files")
          ) {
            return reply.status(400).send({
              error: error.message,
            });
          }
        }
        throw error;
      }
    }
  );
};
