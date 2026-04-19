export interface ImageVariant {
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface MediaVariants {
  thumbnail?: ImageVariant;
  medium?: ImageVariant;
  large?: ImageVariant;
}

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string | null;
  webpUrl?: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
  variants?: MediaVariants | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaListResponse {
  data: MediaFile[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ImageInfo {
  width: number;
  height: number;
  format: string;
}

export type MediaType = 'image' | 'document' | 'video' | 'audio' | 'all';

export interface CropData {
  left: number;
  top: number;
  width: number;
  height: number;
}
