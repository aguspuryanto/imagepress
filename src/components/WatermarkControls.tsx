import React, { useRef } from 'react';
import { WatermarkSettings, WatermarkPosition } from '../types/compressor';
import {
  Stamp,
  Upload,
  Trash2,
  Sliders,
  Sparkles,
  LayoutGrid,
  Eye,
  Info
} from 'lucide-react';

interface WatermarkControlsProps {
  watermark: WatermarkSettings;
  onChange: (wm: WatermarkSettings) => void;
  disabled?: boolean;
}

const POSITIONS: { id: WatermarkPosition; label: string; gridArea: string }[] = [
  { id: 'top-left', label: 'Top Left', gridArea: 'col-start-1 row-start-1' },
  { id: 'center', label: 'Center', gridArea: 'col-start-2 row-start-2' },
  { id: 'top-right', label: 'Top Right', gridArea: 'col-start-3 row-start-1' },
  { id: 'bottom-left', label: 'Bottom Left', gridArea: 'col-start-1 row-start-3' },
  { id: 'bottom-right', label: 'Bottom Right', gridArea: 'col-start-3 row-start-3' },
];

export const WatermarkControls: React.FC<WatermarkControlsProps> = ({
  watermark,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onChange({
        ...watermark,
        enabled: true,
        file,
        dataUrl,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateSampleWatermark = () => {
    // Generate a sleek vector SVG watermark badge
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 400, 120);

    // Rounded pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(10, 15, 380, 90, 20);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.stroke();

    // Emblem mark
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(60, 60, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IP', 60, 61);

    // Text brand
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('IMAGEPRESS', 100, 52);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px system-ui, sans-serif';
    ctx.fillText('CONFIDENTIAL & PROTECTED', 100, 78);

    const dataUrl = canvas.toDataURL('image/png');
    onChange({
      ...watermark,
      enabled: true,
      dataUrl,
      name: 'sample-watermark-badge.png',
      opacity: 0.75,
      position: 'bottom-right',
      sizePercent: 24,
      margin: 24,
    });
  };

  const handleRemoveWatermark = () => {
    onChange({
      ...watermark,
      enabled: false,
      dataUrl: null,
      file: null,
      name: undefined,
    });
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Stamp className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-semibold text-neutral-100">
              Image Watermark Overlay
            </h4>
            {watermark.enabled && watermark.dataUrl && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Active on Output
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Embed a logo, brand watermark, or copyright stamp with precise opacity and corner positioning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-neutral-300">
            <input
              type="checkbox"
              checked={watermark.enabled && !!watermark.dataUrl}
              disabled={disabled || !watermark.dataUrl}
              onChange={(e) => onChange({ ...watermark, enabled: e.target.checked })}
              className="rounded border-neutral-700 bg-neutral-800 text-sky-500 focus:ring-sky-500/20 disabled:opacity-50"
            />
            <span>Apply Watermark to Batch</span>
          </label>
        </div>
      </div>

      {/* Main Grid: Upload & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Preview Column */}
        <div className="lg:col-span-4 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/webp,image/jpeg,image/svg+xml"
            onChange={handleFileUpload}
            className="hidden"
          />

          {watermark.dataUrl ? (
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-3 relative group">
              <div className="h-28 bg-[repeating-conic-gradient(#1e293b_0%_25%,#0f172a_0%_50%)] bg-[length:16px_16px] rounded flex items-center justify-center p-2 overflow-hidden border border-neutral-800">
                <img
                  src={watermark.dataUrl}
                  alt="Watermark preview"
                  className="max-h-full max-w-full object-contain filter drop-shadow-md"
                  style={{ opacity: watermark.opacity }}
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs">
                <div className="truncate max-w-[170px]">
                  <span className="font-mono text-neutral-300 truncate block text-[11px]">
                    {watermark.name || 'watermark-asset.png'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors text-[11px]"
                    title="Change Watermark"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveWatermark}
                    disabled={disabled}
                    className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                    title="Remove Watermark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="w-full border-2 border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-950/50 hover:bg-neutral-950 rounded-lg p-5 flex flex-col items-center justify-center gap-2 transition-colors group cursor-pointer text-center"
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-sky-400 transition-colors">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-neutral-300 group-hover:text-white block">
                    Upload PNG / SVG Logo
                  </span>
                  <span className="text-[10px] text-neutral-500 block">
                    Transparent backgrounds recommended
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleCreateSampleWatermark}
                disabled={disabled}
                className="w-full py-2 px-3 text-xs font-medium text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Use Sample Brand Stamp</span>
              </button>
            </div>
          )}
        </div>

        {/* Position Grid Column */}
        <div className="lg:col-span-4 space-y-2">
          <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
            <span>Watermark Position</span>
            <span className="text-[11px] font-mono text-sky-400 capitalize">
              {watermark.position.replace('-', ' ')}
            </span>
          </label>

          {/* 3x3 interactive visual positioning grid */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-3">
            <div className="grid grid-cols-3 grid-rows-3 gap-2 h-32 max-w-[200px] mx-auto bg-neutral-900/60 p-2 rounded-md border border-neutral-800">
              {/* Top Left */}
              <button
                type="button"
                disabled={disabled || !watermark.dataUrl}
                onClick={() => onChange({ ...watermark, position: 'top-left' })}
                className={`rounded flex items-center justify-center transition-colors ${
                  watermark.position === 'top-left'
                    ? 'bg-sky-500 text-neutral-950 font-bold shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
                title="Top Left"
              >
                <span className="text-[10px] font-mono">TL</span>
              </button>

              {/* Top Center spacer */}
              <div className="flex items-center justify-center text-neutral-700">·</div>

              {/* Top Right */}
              <button
                type="button"
                disabled={disabled || !watermark.dataUrl}
                onClick={() => onChange({ ...watermark, position: 'top-right' })}
                className={`rounded flex items-center justify-center transition-colors ${
                  watermark.position === 'top-right'
                    ? 'bg-sky-500 text-neutral-950 font-bold shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
                title="Top Right"
              >
                <span className="text-[10px] font-mono">TR</span>
              </button>

              {/* Middle Left spacer */}
              <div className="flex items-center justify-center text-neutral-700">·</div>

              {/* Center */}
              <button
                type="button"
                disabled={disabled || !watermark.dataUrl}
                onClick={() => onChange({ ...watermark, position: 'center' })}
                className={`rounded flex items-center justify-center transition-colors ${
                  watermark.position === 'center'
                    ? 'bg-sky-500 text-neutral-950 font-bold shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
                title="Center"
              >
                <span className="text-[10px] font-mono">CTR</span>
              </button>

              {/* Middle Right spacer */}
              <div className="flex items-center justify-center text-neutral-700">·</div>

              {/* Bottom Left */}
              <button
                type="button"
                disabled={disabled || !watermark.dataUrl}
                onClick={() => onChange({ ...watermark, position: 'bottom-left' })}
                className={`rounded flex items-center justify-center transition-colors ${
                  watermark.position === 'bottom-left'
                    ? 'bg-sky-500 text-neutral-950 font-bold shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
                title="Bottom Left"
              >
                <span className="text-[10px] font-mono">BL</span>
              </button>

              {/* Bottom Center spacer */}
              <div className="flex items-center justify-center text-neutral-700">·</div>

              {/* Bottom Right */}
              <button
                type="button"
                disabled={disabled || !watermark.dataUrl}
                onClick={() => onChange({ ...watermark, position: 'bottom-right' })}
                className={`rounded flex items-center justify-center transition-colors ${
                  watermark.position === 'bottom-right'
                    ? 'bg-sky-500 text-neutral-950 font-bold shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
                title="Bottom Right"
              >
                <span className="text-[10px] font-mono">BR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sliders Column: Opacity & Size */}
        <div className="lg:col-span-4 space-y-4">
          {/* Opacity Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300">Opacity</span>
              <span className="font-mono text-sky-400 font-semibold tabular-nums">
                {Math.round((watermark.opacity || 0.7) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={Math.round((watermark.opacity || 0.7) * 100)}
              disabled={disabled || !watermark.dataUrl}
              onChange={(e) =>
                onChange({ ...watermark, opacity: parseInt(e.target.value, 10) / 100 })
              }
              className="w-full accent-sky-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>Subtle (10%)</span>
              <span>Solid (100%)</span>
            </div>
          </div>

          {/* Scale Relative to Target Width */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300">Relative Size</span>
              <span className="font-mono text-sky-400 font-semibold tabular-nums">
                {watermark.sizePercent || 20}% of width
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="45"
              step="2"
              value={watermark.sizePercent || 20}
              disabled={disabled || !watermark.dataUrl}
              onChange={(e) =>
                onChange({ ...watermark, sizePercent: parseInt(e.target.value, 10) })
              }
              className="w-full accent-sky-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>Discreet (8%)</span>
              <span>Prominent (45%)</span>
            </div>
          </div>

          {/* Margin from Corner */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300">Edge Margin</span>
              <span className="font-mono text-sky-400 font-semibold tabular-nums">
                {watermark.margin ?? 24}px
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              step="4"
              value={watermark.margin ?? 24}
              disabled={disabled || !watermark.dataUrl}
              onChange={(e) =>
                onChange({ ...watermark, margin: parseInt(e.target.value, 10) })
              }
              className="w-full accent-sky-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
