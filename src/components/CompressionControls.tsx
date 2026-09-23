import React from 'react';
import { CompressionSettings, SupportedFormat } from '../types/compressor';
import { Sliders, Maximize2, ShieldCheck, Zap } from 'lucide-react';

interface CompressionControlsProps {
  settings: CompressionSettings;
  onChange: (settings: CompressionSettings) => void;
  disabled?: boolean;
}

const FORMAT_OPTIONS: { id: SupportedFormat; label: string; note: string }[] = [
  { id: 'original', label: 'Keep Original', note: 'Retains input MIME' },
  { id: 'webp', label: 'WebP', note: 'Recommended: 25-35% smaller than JPEG' },
  { id: 'avif', label: 'AVIF', note: 'Next-gen: maximum compression density' },
  { id: 'jpeg', label: 'JPEG (MozJPEG)', note: 'Universal compatibility' },
  { id: 'png', label: 'PNG (Quantized)', note: 'Sharp graphics with alpha' },
];

const RESOLUTION_PRESETS = [
  { label: 'Original', maxW: null, maxH: null },
  { label: '4K (3840px)', maxW: 3840, maxH: 2160 },
  { label: 'FHD (1920px)', maxW: 1920, maxH: 1080 },
  { label: 'Web (1280px)', maxW: 1280, maxH: 720 },
  { label: 'Thumb (800px)', maxW: 800, maxH: 800 },
];

export const CompressionControls: React.FC<CompressionControlsProps> = ({
  settings,
  onChange,
  disabled = false,
}) => {
  const handleQualityChange = (q: number) => {
    onChange({ ...settings, quality: q });
  };

  const handleFormatChange = (fmt: SupportedFormat) => {
    onChange({ ...settings, targetFormat: fmt });
  };

  const handleResolutionPreset = (maxW: number | null, maxH: number | null) => {
    onChange({ ...settings, maxWidth: maxW, maxHeight: maxH });
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800/80">
        <div>
          <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            Compression & Output Configuration
          </h4>
          <p className="text-xs text-neutral-400 mt-0.5">
            Applies to all queued images during bulk conversion. Mirrors Sharp pipeline options.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.stripMetadata}
              disabled={disabled}
              onChange={(e) => onChange({ ...settings, stripMetadata: e.target.checked })}
              className="rounded border-neutral-700 bg-neutral-800 text-sky-500 focus:ring-sky-500/20"
            />
            <span>Strip EXIF & Camera Metadata</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Format Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 block">
            Target Output Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 bg-neutral-950/70 border border-neutral-800 rounded-lg">
            {FORMAT_OPTIONS.map((opt) => {
              const active = settings.targetFormat === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleFormatChange(opt.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors text-left ${
                    active
                      ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/80'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className="block truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-neutral-500">
            {FORMAT_OPTIONS.find((f) => f.id === settings.targetFormat)?.note}
          </p>
        </div>

        {/* 2. Quality Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300">Quality Factor</span>
            <span className="font-mono text-sky-400 font-semibold tabular-nums">
              {settings.quality}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="100"
              step="1"
              value={settings.quality}
              disabled={disabled}
              onChange={(e) => handleQualityChange(parseInt(e.target.value, 10))}
              className="w-full accent-sky-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center justify-between gap-1 pt-1">
            {[
              { label: 'Extreme (40%)', val: 40 },
              { label: 'Aggressive (65%)', val: 65 },
              { label: 'Balanced (80%)', val: 80 },
              { label: 'Studio (92%)', val: 92 },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                disabled={disabled}
                onClick={() => handleQualityChange(p.val)}
                className={`text-[11px] px-2 py-1 rounded transition-colors ${
                  settings.quality === p.val
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-neutral-400 hover:text-neutral-200 bg-neutral-950/40'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Max Resolution / Resize Bounds */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 block">
            Resolution Limit (Keep Aspect Ratio)
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950/70 border border-neutral-800 rounded-lg">
            {RESOLUTION_PRESETS.map((res) => {
              const active = settings.maxWidth === res.maxW;
              return (
                <button
                  key={res.label}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleResolutionPreset(res.maxW, res.maxH)}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors text-center ${
                    active
                      ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/80'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className="block truncate">{res.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-neutral-500">
            {settings.maxWidth
              ? `Downscales images wider than ${settings.maxWidth}px without enlarging smaller ones.`
              : 'Preserves original pixel dimensions for all uploaded files.'}
          </p>
        </div>
      </div>
    </div>
  );
};
