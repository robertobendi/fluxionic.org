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
