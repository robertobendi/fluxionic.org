export interface MediaFileInput {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  path: string;
  thumbnailPath?: string;
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
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
