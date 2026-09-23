import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, Layers, FileImage, Sparkles, FolderUp } from 'lucide-react';
import { getImageDimensions } from '../utils/clientCompressor';
import { ImageQueueItem } from '../types/compressor';

interface DropzoneProps {
  onFilesAdded: (items: ImageQueueItem[]) => void;
  onLoadSamples: () => void;
  isLoadingSamples: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesAdded,
  onLoadSamples,
  isLoadingSamples,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global clipboard paste listener
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
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
        processFiles(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFiles = async (files: File[]) => {
    const queueItems: ImageQueueItem[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const meta = await getImageDimensions(file);
        const url = URL.createObjectURL(file);
        queueItems.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          originalFile: file,
          originalSize: file.size,
          originalWidth: meta.width,
          originalHeight: meta.height,
          originalFormat: meta.format || file.type.replace('image/', ''),
          originalUrl: url,
          status: 'idle',
          progress: 0,
        });
      } catch (err) {
        console.error('Error reading file metadata:', err);
      }
    }

    if (queueItems.length > 0) {
      onFilesAdded(queueItems);
    }
  };

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

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      processFiles(files);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 transition-all cursor-pointer text-center group ${
          isDragOver
            ? 'border-sky-500 bg-sky-500/10'
            : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-neutral-300 group-hover:text-sky-400 group-hover:border-sky-500/50 transition-all mb-4">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="text-base font-semibold text-neutral-100 mb-1">
            Drop images here or <span className="text-sky-400 hover:underline">browse files</span>
          </h3>

          <p className="text-xs text-neutral-400 mb-4 max-w-sm">
            Drag multiple photos, folders, or press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-800 border border-neutral-700 rounded text-neutral-300">Ctrl+V</kbd> to paste directly from your clipboard.
          </p>

          {/* Clean unboxed metadata with typographic separators */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500">
            <span>JPEG, PNG, WebP, AVIF</span>
            <span aria-hidden="true">·</span>
            <span>Batch processing</span>
            <span aria-hidden="true">·</span>
            <span>Client & Next.js API ready</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
        <div className="flex items-center gap-2">
          <span>Need test assets?</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSamples();
            }}
            disabled={isLoadingSamples}
            className="text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoadingSamples ? 'Generating Sample Batch...' : 'Load 4 Sample Images (4K, PNG, UI, Vector)'}</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-neutral-500">
          <span>Lossy & Lossless options</span>
          <span aria-hidden="true">·</span>
          <span>Zero quality degradation presets</span>
        </div>
      </div>
    </div>
  );
};
