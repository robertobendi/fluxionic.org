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

export interface MediaFileInput {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  altText?: string;
  path: string;
  thumbnailPath?: string;
  variants?: MediaVariants;
  uploadedBy: string;
}

export interface MediaFileResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  path: string;
  thumbnailPath: string | null;
  url: string;
  thumbnailUrl: string | null;
  variants: MediaVariants | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
