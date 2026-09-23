import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Dropzone } from './components/Dropzone';
import { CompressionControls } from './components/CompressionControls';
import { StatsBanner } from './components/StatsBanner';
import { WatermarkControls } from './components/WatermarkControls';
import { QueueItem } from './components/QueueItem';
import { ComparisonModal } from './components/ComparisonModal';
import { NextjsArchitectureGuide } from './components/NextjsArchitectureGuide';
import { CodeBlueprints } from './components/CodeBlueprints';
import { DockerSharpGuide } from './components/DockerSharpGuide';
import { ImageQueueItem, CompressionSettings, ViewTab } from './types/compressor';
import { compressImage } from './utils/clientCompressor';
import { generateSampleBatch } from './utils/sampleImages';
import { Sparkles, Layers, Image as ImageIcon, ArrowRight, Zap, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('compressor');
  const [queue, setQueue] = useState<ImageQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [compareItem, setCompareItem] = useState<ImageQueueItem | null>(null);

  const [settings, setSettings] = useState<CompressionSettings>({
    targetFormat: 'webp',
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1080,
    keepAspectRatio: true,
    stripMetadata: true,
    effort: 4,
    watermark: {
      enabled: false,
      file: null,
      dataUrl: null,
      opacity: 0.7,
      position: 'bottom-right',
      sizePercent: 22,
      margin: 24,
    },
  });

  // Add files to queue
  const handleFilesAdded = (newItems: ImageQueueItem[]) => {
    setQueue((prev) => [...newItems, ...prev]);
  };

  // Load sample batch of 4 realistic assets
  const handleLoadSamples = async () => {
    setIsLoadingSamples(true);
    try {
      const samples = await generateSampleBatch();
      setQueue((prev) => [...samples, ...prev]);
    } catch (err) {
      console.error('Failed to generate sample batch:', err);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item) {
        URL.revokeObjectURL(item.originalUrl);
        if (item.result?.url) URL.revokeObjectURL(item.result.url);
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  // Clear entire queue
  const handleClearQueue = () => {
    queue.forEach((it) => {
      URL.revokeObjectURL(it.originalUrl);
      if (it.result?.url) URL.revokeObjectURL(it.result.url);
    });
    setQueue([]);
  };

  // Compress single item
  const handleCompressSingle = async (id: string) => {
    const item = queue.find((it) => it.id === id);
    if (!item || item.status === 'processing') return;

    setQueue((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'processing', progress: 10 } : it))
    );

    try {
      const result = await compressImage(item.originalFile, settings, (progress) => {
        setQueue((prev) =>
          prev.map((it) => (it.id === id ? { ...it, progress } : it))
        );
      });

      setQueue((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, status: 'done', progress: 100, result } : it
        )
      );
    } catch (err) {
      console.error('Error compressing item:', err);
      setQueue((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'error', progress: 0 } : it))
      );
    }
  };

  // Compress all idle items in batch (sliding window concurrency of 2)
  const handleCompressAll = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const idleItems = queue.filter((it) => it.status === 'idle');
    if (idleItems.length === 0) {
      setIsProcessing(false);
      return;
    }

    // Process sequentially or in small concurrency
    for (const item of idleItems) {
      setQueue((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'processing', progress: 15 } : it))
      );

      try {
        const result = await compressImage(item.originalFile, settings, (progress) => {
          setQueue((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, progress } : it))
          );
        });

        setQueue((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: 'done', progress: 100, result } : it
          )
        );
      } catch (err) {
        console.error('Error compressing item in batch:', err);
        setQueue((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'error', progress: 0 } : it))
        );
      }
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar (3-zone contract) */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        queueCount={queue.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'compressor' && (
          <div className="space-y-6">
            {/* Hero / Context Title */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">
                  Bulk Image Compression Tool
                </h1>
                <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
                  High-speed image optimization engine simulating Sharp libvips pipelines. Supports WebP, AVIF, MozJPEG, lossy PNG quantization, and batch ZIP export.
                </p>
              </div>

              {/* Clean text link to architecture */}
              <button
                type="button"
                onClick={() => setActiveTab('architecture')}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 self-start sm:self-auto font-medium transition-colors"
              >
                <span>Learn Next.js + Sharp Implementation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <Dropzone
              onFilesAdded={handleFilesAdded}
              onLoadSamples={handleLoadSamples}
              isLoadingSamples={isLoadingSamples}
            />

            {/* Compression Settings Bar */}
            <CompressionControls
              settings={settings}
              onChange={setSettings}
              disabled={isProcessing}
            />

            {/* Watermark Overlay Controls */}
            <WatermarkControls
              watermark={
                settings.watermark || {
                  enabled: false,
                  file: null,
                  dataUrl: null,
                  opacity: 0.7,
                  position: 'bottom-right',
                  sizePercent: 22,
                  margin: 24,
                }
              }
              onChange={(wm) => setSettings({ ...settings, watermark: wm })}
              disabled={isProcessing}
            />

            {/* Stats & Batch Controls (shown when queue has items) */}
            {queue.length > 0 && (
              <StatsBanner
                items={queue}
                isProcessing={isProcessing}
                onCompressAll={handleCompressAll}
                onClearQueue={handleClearQueue}
              />
            )}

            {/* Queue List */}
            {queue.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1 font-medium">
                  <span>Batch Queue ({queue.length})</span>
                  <span>Click eyeball icon to inspect before/after visual fidelity</span>
                </div>

                <div className="space-y-2">
                  {queue.map((item) => (
                    <QueueItem
                      key={item.id}
                      item={item}
                      onRemove={handleRemoveItem}
                      onCompressSingle={handleCompressSingle}
                      onOpenCompare={(it) => setCompareItem(it)}
                      isProcessing={isProcessing}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-xl p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-200">
                    No images in queue
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                    Drag and drop photos or screenshots above, or click below to load sample assets.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSamples}
                  disabled={isLoadingSamples}
                  className="px-4 py-2 text-xs font-medium text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLoadingSamples ? 'Generating...' : 'Load Sample Batch (4 Images)'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* View 2: Architecture Guide */}
        {activeTab === 'architecture' && <NextjsArchitectureGuide />}

        {/* View 3: Code Blueprints */}
        {activeTab === 'blueprints' && <CodeBlueprints />}

        {/* View 4: Docker & Deployment */}
        {activeTab === 'deployment' && <DockerSharpGuide />}
      </main>

      {/* Comparison Modal */}
      {compareItem && (
        <ComparisonModal
          item={compareItem}
          onClose={() => setCompareItem(null)}
        />
      )}

      {/* Footer (Quiet unboxed typography) */}
      <footer className="border-t border-neutral-800 py-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">ImagePress</span>
            <span aria-hidden="true">·</span>
            <span>Next.js 15 & Sharp Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Client & Serverless Image Pipelines</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <button
              onClick={() => setActiveTab('architecture')}
              className="hover:text-neutral-200 transition-colors"
            >
              Pipeline Docs
            </button>
            <button
              onClick={() => setActiveTab('blueprints')}
              className="hover:text-neutral-200 transition-colors"
            >
              Exportable Code
            </button>
            <button
              onClick={() => setActiveTab('deployment')}
              className="hover:text-neutral-200 transition-colors"
            >
              Docker & Sharp Fixes
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
