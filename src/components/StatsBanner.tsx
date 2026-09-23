import React from 'react';
import { ImageQueueItem, CompressionStats } from '../types/compressor';
import { formatBytes, calculateReduction } from '../utils/clientCompressor';
import { Play, Download, Trash2, CheckCircle2, Loader2, HardDriveDownload } from 'lucide-react';
import { downloadCompressedImagesZip } from '../utils/exportProjectZip';

interface StatsBannerProps {
  items: ImageQueueItem[];
  isProcessing: boolean;
  onCompressAll: () => void;
  onClearQueue: () => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  items,
  isProcessing,
  onCompressAll,
  onClearQueue,
}) => {
  const [isZipping, setIsZipping] = React.useState(false);

  // Compute aggregate numbers
  const totalOriginal = items.reduce((acc, it) => acc + it.originalSize, 0);
  const doneItems = items.filter((it) => it.status === 'done' && it.result);
  const totalCompressed = doneItems.reduce((acc, it) => acc + (it.result?.size || 0), 0);
  const doneOriginal = doneItems.reduce((acc, it) => acc + it.originalSize, 0);

  const { percent: savedPercent, isSmaller } = calculateReduction(doneOriginal, totalCompressed);
  const savedBytes = Math.max(0, doneOriginal - totalCompressed);

  const hasUncompressed = items.some((it) => it.status === 'idle');
  const hasCompleted = doneItems.length > 0;

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await downloadCompressedImagesZip(items);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
        <div>
          <span className="text-neutral-400 block text-xs">Total Queue</span>
          <span className="font-semibold text-neutral-100 font-mono tabular-nums text-base">
            {items.length} {items.length === 1 ? 'image' : 'images'}
          </span>
          <span className="text-neutral-500 text-xs ml-1 font-mono">
            ({formatBytes(totalOriginal)})
          </span>
        </div>

        {hasCompleted && (
          <>
            <div className="h-8 w-px bg-neutral-800 hidden sm:block" />

            <div>
              <span className="text-neutral-400 block text-xs">Optimized Size</span>
              <span className="font-semibold text-emerald-400 font-mono tabular-nums text-base">
                {formatBytes(totalCompressed)}
              </span>
              <span className="text-neutral-500 text-xs ml-1">
                for {doneItems.length} items
              </span>
            </div>

            <div className="h-8 w-px bg-neutral-800 hidden sm:block" />

            <div>
              <span className="text-neutral-400 block text-xs">Total Space Saved</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-emerald-400 font-mono tabular-nums text-base">
                  -{savedPercent}%
                </span>
                <span className="text-neutral-400 font-mono text-xs tabular-nums">
                  ({formatBytes(savedBytes)})
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 sm:self-center">
        {hasUncompressed && (
          <button
            type="button"
            onClick={onCompressAll}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Compressing Batch...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Compress All Images</span>
              </>
            )}
          </button>
        )}

        {hasCompleted && (
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Zipping {doneItems.length} Files...</span>
              </>
            ) : (
              <>
                <HardDriveDownload className="w-3.5 h-3.5" />
                <span>Download All as ZIP ({doneItems.length})</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onClearQueue}
          disabled={isProcessing}
          className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          title="Clear Queue"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
