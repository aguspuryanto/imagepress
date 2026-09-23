export type SupportedFormat = 'original' | 'webp' | 'jpeg' | 'png' | 'avif';

export type WatermarkPosition =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface WatermarkSettings {
  enabled: boolean;
  file: File | Blob | null;
  dataUrl: string | null;
  name?: string;
  opacity: number; // 0.05 to 1.0 (default 0.7)
  position: WatermarkPosition;
  sizePercent: number; // 5 to 50% of the target image width (default 20%)
  margin: number; // padding from edge in pixels (default 24)
}

export interface CompressionSettings {
  targetFormat: SupportedFormat;
  quality: number; // 1 to 100
  maxWidth: number | null;
  maxHeight: number | null;
  keepAspectRatio: boolean;
  stripMetadata: boolean;
  effort: number; // 1 to 6 (Sharp CPU effort parameter)
  watermark?: WatermarkSettings;
}

export interface CompressedResult {
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  format: string;
  durationMs: number;
  error?: string;
}

export interface ImageQueueItem {
  id: string;
  name: string;
  originalFile: File | Blob;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalFormat: string;
  originalUrl: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  customSettings?: Partial<CompressionSettings>;
  result?: CompressedResult;
}

export interface CompressionStats {
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  savedBytes: number;
  savedPercentage: number;
  completedCount: number;
  totalCount: number;
}

export type ViewTab = 'compressor' | 'architecture' | 'blueprints' | 'deployment';
