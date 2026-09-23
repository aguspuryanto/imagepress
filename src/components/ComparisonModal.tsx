import React, { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import { ImageQueueItem } from '../types/compressor';
import { formatBytes, calculateReduction } from '../utils/clientCompressor';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

interface ComparisonModalProps {
  item: ImageQueueItem | null;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ item, onClose }) => {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const [zoom, setZoom] = useState<number>(1);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item || !item.result) return null;

  const reduction = calculateReduction(item.originalSize, item.result.size);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPos(percent);
  };

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleDownloadSingle = () => {
    if (!item.result) return;
    const a = document.createElement('a');
    a.href = item.result.url;
    const base = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    a.download = `${base}-optimized.${item.result.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              <span>Fidelity Inspection</span>
              <span className="text-neutral-500 font-normal">·</span>
              <span className="text-xs font-mono text-neutral-400 font-normal truncate max-w-md">
                {item.name}
              </span>
            </h3>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
              <span>Drag slider horizontally to inspect visual difference</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-neutral-400">
              <button
                type="button"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="p-1.5 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono tabular-nums text-neutral-300">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="p-1.5 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="p-1.5 hover:text-white hover:bg-neutral-800 rounded transition-colors border-l border-neutral-800"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadSingle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas with Split-Slider */}
        <div className="flex-1 bg-neutral-950 overflow-hidden relative select-none flex items-center justify-center p-4">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchMove={handleTouchMove}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="relative max-w-full max-h-full cursor-ew-resize overflow-hidden rounded-lg border border-neutral-800 shadow-lg"
          >
            {/* Compressed Image (Background) */}
            <img
              src={item.result.url}
              alt="Compressed"
              className="max-h-[62vh] w-auto object-contain block pointer-events-none"
              referrerPolicy="no-referrer"
            />

            {/* Original Image (Clipped Layer on Left) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={item.originalUrl}
                alt="Original"
                className="max-h-[62vh] w-auto object-contain block"
                style={{ width: containerRef.current?.offsetWidth || '100%', maxWidth: 'none' }}
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Interactive Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-neutral-900 border-2 border-white shadow-xl flex items-center justify-center">
                <div className="flex items-center gap-0.5 text-white">
                  <span className="text-[10px]">◀</span>
                  <span className="text-[10px]">▶</span>
                </div>
              </div>
            </div>

            {/* Labels in corners */}
            <div className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-mono text-neutral-300 border border-neutral-800 pointer-events-none">
              Original: {formatBytes(item.originalSize)}
            </div>

            <div className="absolute top-3 right-3 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-mono text-emerald-400 border border-neutral-800 pointer-events-none">
              Optimized: {formatBytes(item.result.size)} (-{reduction.percent}%)
            </div>
          </div>
        </div>

        {/* Footer Statistics */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-neutral-500 block">Original Asset</span>
              <span className="text-neutral-200 font-mono tabular-nums">
                {formatBytes(item.originalSize)} · {item.originalWidth}×{item.originalHeight} · {item.originalFormat.toUpperCase()}
              </span>
            </div>

            <div className="h-6 w-px bg-neutral-800" />

            <div>
              <span className="text-neutral-500 block">Optimized Asset</span>
              <span className="text-emerald-400 font-mono tabular-nums">
                {formatBytes(item.result.size)} · {item.result.width}×{item.result.height} · {item.result.format.toUpperCase()}
              </span>
            </div>

            <div className="h-6 w-px bg-neutral-800" />

            <div>
              <span className="text-neutral-500 block">Net Savings</span>
              <span className="text-emerald-400 font-mono font-bold tabular-nums">
                -{reduction.percent}% ({formatBytes(item.originalSize - item.result.size)} saved)
              </span>
            </div>
          </div>

          <div className="text-neutral-500 font-mono">
            Elapsed: {item.result.durationMs}ms
          </div>
        </div>
      </div>
    </div>
  );
};
