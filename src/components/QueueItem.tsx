import React from 'react';
import { ImageQueueItem } from '../types/compressor';
import { formatBytes, calculateReduction } from '../utils/clientCompressor';
import { Download, Eye, X, Check, AlertCircle, Loader2 } from 'lucide-react';

interface QueueItemProps {
  item: ImageQueueItem;
  onRemove: (id: string) => void;
  onCompressSingle: (id: string) => void;
  onOpenCompare: (item: ImageQueueItem) => void;
  isProcessing: boolean;
}

export const QueueItem: React.FC<QueueItemProps> = ({
  item,
  onRemove,
  onCompressSingle,
  onOpenCompare,
  isProcessing,
}) => {
  const isDone = item.status === 'done' && item.result;
  const isError = item.status === 'error';
  const isInProgress = item.status === 'processing';

  const reduction = isDone && item.result
    ? calculateReduction(item.originalSize, item.result.size)
    : null;

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
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-neutral-700 transition-colors">
      {/* Left: Thumbnail & Name / Meta */}
      <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
        <div className="w-14 h-14 rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center relative">
          <img
            src={isDone && item.result ? item.result.url : item.originalUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {isInProgress && (
            <div className="absolute inset-0 bg-neutral-950/70 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium text-neutral-100 truncate max-w-xs sm:max-w-md">
              {item.name}
            </h5>
          </div>

          {/* Clean unboxed metadata with typographic separators */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
            <span className="uppercase text-[11px] font-mono font-medium text-neutral-400">
              {item.originalFormat}
            </span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="font-mono tabular-nums">{item.originalWidth}×{item.originalHeight}</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="font-mono tabular-nums">{formatBytes(item.originalSize)}</span>
          </div>

          {/* Processing status text */}
          {isInProgress && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="w-32 bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full transition-all duration-150"
                  style={{ width: `${Math.max(item.progress, 15)}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-sky-400 tabular-nums">
                {item.progress}%
              </span>
            </div>
          )}

          {isError && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Compression failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Results & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
        {/* Results Info */}
        {isDone && item.result && reduction && (
          <div className="text-left sm:text-right">
            <div className="flex items-center sm:justify-end gap-2">
              <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                -{reduction.percent}%
              </span>
              <span className="text-xs font-mono font-semibold text-neutral-100 tabular-nums">
                {formatBytes(item.result.size)}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 flex items-center sm:justify-end gap-1 font-mono">
              <span>{item.result.width}×{item.result.height}</span>
              <span aria-hidden="true">·</span>
              <span className="uppercase">{item.result.format}</span>
              <span aria-hidden="true">·</span>
              <span>{item.result.durationMs}ms</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {item.status === 'idle' && (
            <button
              type="button"
              onClick={() => onCompressSingle(item.id)}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors disabled:opacity-50"
            >
              Compress
            </button>
          )}

          {isDone && (
            <>
              <button
                type="button"
                onClick={() => onOpenCompare(item)}
                className="p-1.5 text-neutral-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-md transition-colors"
                title="Compare Before & After"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownloadSingle}
                className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
                title="Download Compressed Image"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={isInProgress}
            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors disabled:opacity-50"
            title="Remove from Queue"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
