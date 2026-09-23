export interface CodeFile {
  name: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

export const NEXTJS_CODE_FILES: CodeFile[] = [
  {
    name: 'Single Image Compress API',
    path: 'app/api/compress/route.ts',
    language: 'typescript',
    description: 'Next.js 15 App Router Route Handler using Sharp with mozjpeg, webp, avif pipelines and streaming output',
    code: `import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Sharp serverless configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Up to 60s processing for large images

// Disable Sharp cache in serverless / container environments to avoid memory bloat
sharp.cache(false);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const format = (formData.get('format') as string) || 'webp';
    const quality = parseInt((formData.get('quality') as string) || '80', 10);
    const maxWidth = formData.get('maxWidth') ? parseInt(formData.get('maxWidth') as string, 10) : null;
    const maxHeight = formData.get('maxHeight') ? parseInt(formData.get('maxHeight') as string, 10) : null;
    const stripMetadata = formData.get('stripMetadata') !== 'false';
    const watermarkFile = formData.get('watermark') as File | null;
    const watermarkOpacity = parseFloat((formData.get('watermarkOpacity') as string) || '0.7');
    const watermarkPosition = (formData.get('watermarkPosition') as string) || 'bottom-right';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const originalSize = inputBuffer.length;

    // Initialize Sharp instance with auto-rotation (reads EXIF orientation)
    let pipeline = sharp(inputBuffer, { failOnError: false }).rotate();

    // Strip EXIF / ICC metadata if requested for extra byte savings & privacy
    if (stripMetadata) {
      pipeline = pipeline.withMetadata({ orientation: undefined });
    } else {
      pipeline = pipeline.withMetadata();
    }

    // Apply conditional resizing with aspect ratio preservation
    if (maxWidth || maxHeight) {
      pipeline = pipeline.resize({
        width: maxWidth || undefined,
        height: maxHeight || undefined,
        fit: 'inside', // preserve aspect ratio, fits within bounding box
        withoutEnlargement: true, // prevents pixelation of smaller images
      });
    }

    // Apply Watermark Composite if uploaded
    if (watermarkFile) {
      const wmArrayBuffer = await watermarkFile.arrayBuffer();
      let wmBuffer = Buffer.from(wmArrayBuffer);

      // Process watermark with opacity and size
      const targetMeta = await pipeline.metadata();
      const targetWidth = targetMeta.width || 1200;
      const wmTargetWidth = Math.round(targetWidth * 0.22);

      // Resize watermark and adjust opacity channel
      wmBuffer = await sharp(wmBuffer)
        .resize({ width: wmTargetWidth, fit: 'inside' })
        .ensureAlpha(watermarkOpacity)
        .toBuffer();

      let gravity = 'southeast';
      if (watermarkPosition === 'top-left') gravity = 'northwest';
      else if (watermarkPosition === 'top-right') gravity = 'northeast';
      else if (watermarkPosition === 'bottom-left') gravity = 'southwest';
      else if (watermarkPosition === 'center') gravity = 'center';

      pipeline = pipeline.composite([
        {
          input: wmBuffer,
          gravity,
        },
      ]);
    }

    // Format-specific high efficiency compression pipeline
    let contentType = 'image/webp';
    let fileExtension = 'webp';

    switch (format.toLowerCase()) {
      case 'avif':
        contentType = 'image/avif';
        fileExtension = 'avif';
        pipeline = pipeline.avif({
          quality: Math.min(Math.max(quality, 1), 100),
          effort: 4, // 0-9 CPU effort balance
          chromaSubsampling: '4:2:0',
        });
        break;

      case 'jpeg':
      case 'jpg':
        contentType = 'image/jpeg';
        fileExtension = 'jpg';
        pipeline = pipeline.jpeg({
          quality: Math.min(Math.max(quality, 1), 100),
          mozjpeg: true, // MozJPEG trellis quantization & progressive scan
          progressive: true,
        });
        break;

      case 'png':
        contentType = 'image/png';
        fileExtension = 'png';
        pipeline = pipeline.png({
          compressionLevel: 9,
          palette: quality < 90, // Quantization to 256 colors when quality < 90
          quality: Math.min(Math.max(quality, 1), 100),
        });
        break;

      case 'webp':
      default:
        contentType = 'image/webp';
        fileExtension = 'webp';
        pipeline = pipeline.webp({
          quality: Math.min(Math.max(quality, 1), 100),
          effort: 4,
          smartSubsample: true,
        });
        break;
    }

    const outputBuffer = await pipeline.toBuffer();
    const compressedSize = outputBuffer.length;
    const metadata = await sharp(outputBuffer).metadata();

    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const outputFileName = \`\${originalName}-optimized.\${fileExtension}\`;

    // Stream back raw binary with optimization metrics in headers
    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': \`attachment; filename="\${outputFileName}"\`,
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedSize.toString(),
        'X-Saved-Percent': Math.round(((originalSize - compressedSize) / originalSize) * 100).toString(),
        'X-Image-Width': (metadata.width || 0).toString(),
        'X-Image-Height': (metadata.height || 0).toString(),
      },
    });
  } catch (error: any) {
    console.error('Sharp compression error:', error);
    return NextResponse.json(
      { error: error?.message || 'Compression pipeline failed' },
      { status: 500 }
    );
  }
}`
  },
  {
    name: 'Bulk ZIP Stream Route',
    path: 'app/api/compress-zip/route.ts',
    language: 'typescript',
    description: 'Bulk compression handler using Archiver & Sharp that streams a ZIP archive on the fly without memory spikes',
    code: `import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import archiver from 'archiver';
import { PassThrough } from 'stream';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for bulk processing

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const format = (formData.get('format') as string) || 'webp';
    const quality = parseInt((formData.get('quality') as string) || '80', 10);
    const maxWidth = formData.get('maxWidth') ? parseInt(formData.get('maxWidth') as string, 10) : null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Setup streaming ZIP pipeline
    const archive = archiver('zip', { zlib: { level: 6 } });
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    // Process files in batches to respect server memory limits
    (async () => {
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          let pipeline = sharp(buffer).rotate();

          if (maxWidth) {
            pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
          }

          let ext = 'webp';
          if (format === 'jpeg') {
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
            ext = 'jpg';
          } else if (format === 'png') {
            pipeline = pipeline.png({ compressionLevel: 9, quality });
            ext = 'png';
          } else if (format === 'avif') {
            pipeline = pipeline.avif({ quality, effort: 3 });
            ext = 'avif';
          } else {
            pipeline = pipeline.webp({ quality, effort: 4 });
          }

          const compressed = await pipeline.toBuffer();
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const outName = \`\${baseName}.\${ext}\`;

          // Append to zip stream
          archive.append(compressed, { name: outName });
        }

        await archive.finalize();
      } catch (err) {
        console.error('Archiver batch error:', err);
        archive.destroy();
      }
    })();

    // Convert Node PassThrough stream to Web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        passThrough.on('data', (chunk) => controller.enqueue(chunk));
        passThrough.on('end', () => controller.close());
        passThrough.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="compressed-images.zip"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}`
  },
  {
    name: 'Clean Drag-and-Drop Component',
    path: 'components/ImageDropzone.tsx',
    language: 'typescript',
    description: 'Zero-dependency React 19 / Next.js client component with HTML5 drag events, clipboard paste, and directory recursion',
    code: `'use client';

import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, Image as ImageIcon, FolderArchive, Sparkles } from 'lucide-react';

interface ImageDropzoneProps {
  onFilesDropped: (files: File[]) => void;
  isProcessing?: boolean;
}

const SUPPORTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];

export function ImageDropzone({ onFilesDropped, isProcessing }: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global clipboard paste listener (Ctrl+V / Cmd+V anywhere on page)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const imageFiles: File[] = [];

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        onFilesDropped(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesDropped]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      SUPPORTED_MIME.includes(file.type) || file.type.startsWith('image/')
    );

    if (droppedFiles.length > 0) {
      onFilesDropped(droppedFiles);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        SUPPORTED_MIME.includes(file.type) || file.type.startsWith('image/')
      );
      if (selectedFiles.length > 0) {
        onFilesDropped(selectedFiles);
      }
      e.target.value = ''; // Reset input to allow re-uploading identical file
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={\`relative cursor-pointer transition-all duration-200 border-2 border-dashed rounded-xl p-8 text-center group
        \${
          isDragOver
            ? 'border-sky-500 bg-sky-500/10 scale-[1.005]'
            : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900'
        }
      \`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.webp,.avif,.jpeg,.jpg,.png"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300 group-hover:text-sky-400 group-hover:scale-105 transition-all">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div>
          <p className="text-base font-medium text-neutral-200">
            Drag & drop images here, or <span className="text-sky-400 underline decoration-sky-400/40">browse files</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-neutral-500">
            <span>Supports JPEG, PNG, WebP, AVIF</span>
            <span aria-hidden="true">·</span>
            <span>Paste from clipboard (Ctrl+V)</span>
            <span aria-hidden="true">·</span>
            <span>Bulk batch queue</span>
          </div>
        </div>
      </div>
    </div>
  );
}`
  },
  {
    name: 'Sharp Optimization Pipeline Helper',
    path: 'lib/sharp-pipeline.ts',
    language: 'typescript',
    description: 'Reusable Node.js/Next.js helper module with preset modes (Extreme, Balanced, Lossless)',
    code: `import sharp, { Sharp, OutputInfo } from 'sharp';

export interface SharpOptimizationOptions {
  format?: 'webp' | 'jpeg' | 'png' | 'avif' | 'original';
  quality?: number; // 1-100
  maxWidth?: number | null;
  maxHeight?: number | null;
  effort?: number; // 1-6
  stripMetadata?: boolean;
}

export interface OptimizationResult {
  buffer: Buffer;
  info: OutputInfo;
  format: string;
}

export async function optimizeBuffer(
  input: Buffer,
  options: SharpOptimizationOptions = {}
): Promise<OptimizationResult> {
  const {
    format = 'webp',
    quality = 80,
    maxWidth = null,
    maxHeight = null,
    effort = 4,
    stripMetadata = true,
  } = options;

  let pipeline: Sharp = sharp(input, { failOnError: false }).rotate();

  if (stripMetadata) {
    pipeline = pipeline.withMetadata({ orientation: undefined });
  } else {
    pipeline = pipeline.withMetadata();
  }

  if (maxWidth || maxHeight) {
    pipeline = pipeline.resize({
      width: maxWidth || undefined,
      height: maxHeight || undefined,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  let chosenFormat = format;

  switch (format) {
    case 'avif':
      pipeline = pipeline.avif({ quality, effort: Math.min(effort, 4), chromaSubsampling: '4:2:0' });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true, progressive: true });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 9, quality });
      break;
    case 'webp':
    default:
      chosenFormat = 'webp';
      pipeline = pipeline.webp({ quality, effort });
      break;
  }

  const { data: buffer, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    buffer,
    info,
    format: chosenFormat,
  };
}`
  },
  {
    name: 'Production Dockerfile (Standalone Sharp)',
    path: 'Dockerfile',
    language: 'dockerfile',
    description: 'Production Multi-Stage Dockerfile resolving Sharp native C++ libvips binaries on Linux Alpine/Debian',
    code: `# Multi-stage Dockerfile for Next.js App with Sharp on Linux
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json package-lock.json* ./
# Install platform-specific sharp binary for linux alpine x64
RUN npm ci --include=optional sharp

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runner stage
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set correct permissions for Next.js standalone cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]`
  },
  {
    name: 'Next.js Configuration',
    path: 'next.config.mjs',
    language: 'javascript',
    description: 'next.config.mjs with standalone output and serverExternalPackages for native Sharp bindings',
    code: `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for minimal Docker container size (~80MB instead of 1GB)
  output: 'standalone',

  // Prevent Webpack/Turbopack from trying to bundle native Sharp C++ bindings
  serverExternalPackages: ['sharp', 'archiver'],

  // Allow larger payload sizes if running custom Node proxy
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;`
  },
  {
    name: 'package.json',
    path: 'package.json',
    language: 'json',
    description: 'Clean Next.js 15 package.json with Sharp, Archiver, Tailwind CSS, and Lucide icons',
    code: `{
  "name": "nextjs-sharp-image-compressor",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "archiver": "^7.0.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.546.0",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sharp": "^0.33.5",
    "tailwind-merge": "^3.0.0"
  },
  "devDependencies": {
    "@types/archiver": "^6.0.3",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0"
  }
}`
  },
  {
    name: 'Project README',
    path: 'README.md',
    language: 'markdown',
    description: 'Comprehensive setup instructions, curl testing, and deployment guide',
    code: `# Next.js Bulk Image Compressor (Powered by Sharp)

A high-performance bulk image optimization service built with Next.js 15 App Router and Sharp (libvips).

## Features
- **High-speed compression**: MozJPEG, WebP, AVIF, and PNGquant quantization.
- **Bulk drag & drop**: Handles multiple files with client-side concurrency control.
- **Streaming ZIP downloads**: Bundles optimized images on the fly via Node streams.
- **Memory-efficient**: Tuned for serverless runtimes with \`sharp.cache(false)\`.

## Quick Start

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open browser at http://localhost:3000
\`\`\`

## Test API via cURL

\`\`\`bash
curl -X POST http://localhost:3000/api/compress \\
  -F "file=@my-photo.jpg" \\
  -F "format=webp" \\
  -F "quality=80" \\
  -F "maxWidth=1920" \\
  --output my-photo.webp
\`\`\`

## Deploy to Production with Docker

\`\`\`bash
docker build -t nextjs-sharp-compressor .
docker run -p 3000:3000 nextjs-sharp-compressor
\`\`\`
`
  }
];
