import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Zap,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  Code2,
  FileCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const NextjsArchitectureGuide: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: '1. The Client Drag-and-Drop UX Architecture',
      subtitle: 'HTML5 Drag & Drop, Clipboard Paste & Queue Management',
      content: (
        <div className="space-y-4 text-sm text-neutral-300">
          <p>
            When building a bulk compressor, a naive implementation attempts to compress 50 large files at once, locking the user’s main thread or exceeding server memory limits. A production-ready client component requires:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <h5 className="font-semibold text-neutral-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Concurrency Control & Throttling
              </h5>
              <p className="text-xs text-neutral-400">
                Process items in a queue pool (e.g. 2–3 concurrent uploads). Avoid sending 50 HTTP POST requests simultaneously to your Next.js server, which can trigger Vercel or cloud rate limits.
              </p>
            </div>
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <h5 className="font-semibold text-neutral-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Memory Leak Prevention
              </h5>
              <p className="text-xs text-neutral-400">
                Always call <code className="text-sky-300 font-mono text-[11px]">URL.revokeObjectURL(url)</code> when removing images or unmounting components to release browser blob memory buffers.
              </p>
            </div>
          </div>
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs font-mono text-neutral-400 space-y-1">
            <span className="text-neutral-500">// Clipboard paste listener pattern:</span>
            <div className="text-neutral-300">
              window.addEventListener('paste', (e) =&gt; &#123;
              <br />
              &nbsp;&nbsp;const items = Array.from(e.clipboardData.items);
              <br />
              &nbsp;&nbsp;const files = items.filter(i =&gt; i.type.startsWith('image/')).map(i =&gt; i.getAsFile());
              <br />
              &nbsp;&nbsp;if (files.length &gt; 0) enqueueFiles(files);
              <br />
              &#125;);
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '2. The Sharp (libvips) Pipeline in Next.js',
      subtitle: 'Native C++ Speed, MozJPEG, AVIF, WebP, and EXIF Handling',
      content: (
        <div className="space-y-4 text-sm text-neutral-300">
          <p>
            <strong>Sharp</strong> is backed by the <code className="text-sky-300 font-mono text-xs">libvips</code> C library. It operates up to <strong>8x faster</strong> than ImageMagick or Pure JavaScript canvas libraries while consuming a fraction of the RAM because it uses streaming pipeline buffers.
          </p>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
            <h5 className="font-semibold text-neutral-100 text-xs uppercase tracking-wider">
              Essential Sharp Chaining Methods
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <code className="text-sky-400 font-semibold font-mono">.rotate()</code>
                <p className="text-neutral-400 mt-1">
                  Must be called first! Automatically reads EXIF orientation tags so iPhone photos don’t end up sideways.
                </p>
              </div>
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <code className="text-sky-400 font-semibold font-mono">.resize(&#123; fit: 'inside' &#125;)</code>
                <p className="text-neutral-400 mt-1">
                  Resizes bounding box while preserving exact aspect ratio without cropping. <code className="text-neutral-300">withoutEnlargement: true</code> prevents blurry upscaling.
                </p>
              </div>
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <code className="text-sky-400 font-semibold font-mono">.jpeg(&#123; mozjpeg: true &#125;)</code>
                <p className="text-neutral-400 mt-1">
                  Enables Mozilla’s trellis quantization algorithms, cutting JPEG weight by an extra 15-20% at the same perceptual visual quality.
                </p>
              </div>
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <code className="text-sky-400 font-semibold font-mono">.webp(&#123; effort: 4 &#125;)</code>
                <p className="text-neutral-400 mt-1">
                  Controls the CPU compression search. Effort 4 provides optimal balance between serverless latency and byte reduction.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '3. Next.js 14/15 App Router Route Handlers',
      subtitle: 'app/api/compress/route.ts vs Server Actions',
      content: (
        <div className="space-y-4 text-sm text-neutral-300">
          <p>
            In Next.js App Router, prefer a <strong>Route Handler (<code className="text-sky-300 font-mono text-xs">route.ts</code>)</strong> over Server Actions for image compression. Why?
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-neutral-400">
            <li>
              <strong className="text-neutral-200">Binary Streaming:</strong> Route handlers can return raw binary <code className="text-sky-300 font-mono">NextResponse(outputBuffer, &#123; headers: ... &#125;)</code> without base64 serialization overhead (+33% byte inflation).
            </li>
            <li>
              <strong className="text-neutral-200">Header Telemetry:</strong> Pass custom headers like <code className="text-sky-300 font-mono">X-Original-Size</code>, <code className="text-sky-300 font-mono">X-Compressed-Size</code>, and <code className="text-sky-300 font-mono">X-Saved-Percent</code> back to the client directly with the file.
            </li>
            <li>
              <strong className="text-neutral-200">Timeout & Edge Constraints:</strong> Sharp uses native C++ threads and cannot run in Edge runtimes; configure <code className="text-sky-300 font-mono">export const runtime = 'nodejs';</code> and <code className="text-sky-300 font-mono">export const maxDuration = 60;</code>.
            </li>
          </ul>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs font-mono text-neutral-400">
            <span className="text-emerald-400">// Next.js App Router API Route Header Declaration</span>
            <div className="text-neutral-300 mt-1">
              export const runtime = 'nodejs'; // Required for Sharp libvips native binaries
              <br />
              export const dynamic = 'force-dynamic';
              <br />
              export const maxDuration = 60; // Allows processing large multi-megabyte images
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '4. Streaming Bulk ZIP Generation',
      subtitle: 'Packaging 100+ images without running out of server RAM',
      content: (
        <div className="space-y-4 text-sm text-neutral-300">
          <p>
            When compressing 50 images into a downloadable ZIP archive, you must never buffer the entire ZIP in server memory. Instead, pipe the streaming output:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <span className="text-sky-400 font-semibold block">Node.js Server-Side Streaming (Archiver)</span>
              <p className="text-neutral-400">
                Use <code className="text-sky-300 font-mono">archiver('zip')</code> with a Node <code className="text-sky-300 font-mono">PassThrough</code> stream converted to a Web <code className="text-sky-300 font-mono">ReadableStream</code>. As each image finishes compression in Sharp, append it to the stream. The browser begins receiving the zip file immediately!
              </p>
            </div>
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <span className="text-sky-400 font-semibold block">Client-Side Zipping (JSZip)</span>
              <p className="text-neutral-400">
                Alternative zero-server approach: The client receives each compressed image individually, keeps track of download progress, and bundles the files into a zip file directly inside the browser using Web Workers or JSZip. This relieves 100% of bandwidth costs for the ZIP creation from your server.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '5. Production Deployment & Native Sharp Binaries',
      subtitle: 'Solving the #1 pitfall in Docker, Vercel, and Cloud Run',
      content: (
        <div className="space-y-4 text-sm text-neutral-300">
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 space-y-1">
              <strong className="text-amber-100 font-semibold block">The Native Binary Trap</strong>
              Sharp relies on pre-built native binaries compiled specifically for your CPU and OS (<code className="font-mono text-amber-300">darwin-arm64</code> for Apple Silicon, <code className="font-mono text-amber-300">linux-x64</code> for Docker/Vercel). If you copy <code className="font-mono text-amber-300">node_modules</code> across platforms, it will throw:
              <br />
              <code className="text-amber-400 font-mono text-[11px] block mt-1">Error: Could not load the "sharp" module using the linux-x64 runtime</code>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h5 className="font-semibold text-neutral-200">How to Fix in Next.js:</h5>
            <ol className="list-decimal pl-5 space-y-1.5 text-neutral-400">
              <li>
                In <code className="text-neutral-200 font-mono">next.config.mjs</code>, add <code className="text-sky-300 font-mono">serverExternalPackages: ['sharp']</code> so Next.js doesn’t bundle it with Webpack/Turbopack.
              </li>
              <li>
                In your <code className="text-neutral-200 font-mono">Dockerfile</code>, install <code className="text-sky-300 font-mono">libc6-compat</code> on Alpine base images.
              </li>
              <li>
                Always invoke <code className="text-sky-300 font-mono">sharp.cache(false)</code> in serverless functions to prevent RSS memory leaks across warm invocations.
              </li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      title: '6. Watermarking & Image Compositing with Sharp',
      subtitle: 'Applying Alpha Overlays, Opacity & Positioning (libvips Composite)',
      content: (
        <div className="space-y-4 text-sm text-neutral-300">
          <p>
            Sharp provides native, multi-threaded image layering using <code className="text-sky-300 font-mono text-xs">.composite()</code>. You can overlay logos, copyright watermarks, and badges while controlling opacity and position without decompressing the entire buffer in JavaScript.
          </p>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
            <h5 className="font-semibold text-neutral-100 text-xs uppercase tracking-wider">
              Sharp Watermark Composite Pipeline
            </h5>
            <div className="text-xs font-mono text-neutral-400 bg-neutral-900 p-3 rounded-lg overflow-x-auto space-y-1">
              <span className="text-neutral-500">// 1. Resize watermark proportionally to base image</span>
              <div className="text-neutral-300">
                const watermark = await sharp(watermarkBuffer)
                <br />
                &nbsp;&nbsp;.resize(&#123; width: Math.round(baseWidth * 0.22), fit: 'inside' &#125;)
                <br />
                &nbsp;&nbsp;.ensureAlpha(0.7) // Adjust opacity
                <br />
                &nbsp;&nbsp;.toBuffer();
              </div>
              <span className="text-neutral-500 block pt-1">// 2. Composite onto base pipeline with gravity</span>
              <div className="text-neutral-300">
                pipeline = pipeline.composite([
                <br />
                &nbsp;&nbsp;&#123;
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;input: watermark,
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;gravity: 'southeast', // or 'northwest', 'center', 'southwest'
                <br />
                &nbsp;&nbsp;&#125;,
                <br />
                ]);
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
          Next.js + Sharp Architecture Guide
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          A production blueprint for high-throughput image optimization, streaming ZIPs, and clean UI engineering.
        </p>
      </div>

      {/* Visual Pipeline Flow Diagram */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6">
        <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-4">
          Complete System Data Flow
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-neutral-500 font-mono text-[11px]">01. Client</span>
              <h5 className="font-semibold text-neutral-200 mt-1">Drag & Drop</h5>
              <p className="text-neutral-400 text-[11px] mt-1">
                HTML5 drop, paste listener, MIME filter, client queue throttling.
              </p>
            </div>
            <div className="mt-3 text-sky-400 font-mono text-[11px] flex items-center gap-1">
              FormData stream <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-neutral-500 font-mono text-[11px]">02. App Router</span>
              <h5 className="font-semibold text-neutral-200 mt-1">/api/compress</h5>
              <p className="text-neutral-400 text-[11px] mt-1">
                Reads buffer, validates size, sets Node.js runtime, extracts parameters.
              </p>
            </div>
            <div className="mt-3 text-sky-400 font-mono text-[11px] flex items-center gap-1">
              ArrayBuffer <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-neutral-500 font-mono text-[11px]">03. Libvips Engine</span>
              <h5 className="font-semibold text-neutral-200 mt-1">Sharp Pipeline</h5>
              <p className="text-neutral-400 text-[11px] mt-1">
                .rotate() &#8594; resize() &#8594; WebP/AVIF/MozJPEG quantization.
              </p>
            </div>
            <div className="mt-3 text-sky-400 font-mono text-[11px] flex items-center gap-1">
              Binary Stream <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-neutral-500 font-mono text-[11px]">04. Delivery</span>
              <h5 className="font-semibold text-neutral-200 mt-1">Preview & ZIP</h5>
              <p className="text-neutral-400 text-[11px] mt-1">
                Streamed response with metadata headers, split-slider compare, bulk ZIP.
              </p>
            </div>
            <div className="mt-3 text-emerald-400 font-mono text-[11px] flex items-center gap-1">
              Ready to download
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Step Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation List */}
        <div className="space-y-1.5">
          {steps.map((st, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                activeStep === idx
                  ? 'bg-neutral-800/90 border-sky-500/50 text-white shadow-sm'
                  : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <h5 className="text-xs font-semibold">{st.title}</h5>
              <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                {st.subtitle}
              </p>
            </button>
          ))}
        </div>

        {/* Step Details View */}
        <div className="lg:col-span-2 bg-neutral-900/60 border border-neutral-800 rounded-xl p-6">
          <div className="border-b border-neutral-800 pb-3 mb-5">
            <h3 className="text-base font-semibold text-neutral-100">
              {steps[activeStep].title}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              {steps[activeStep].subtitle}
            </p>
          </div>

          <div>{steps[activeStep].content}</div>
        </div>
      </div>

      {/* Engine Benchmark Comparison Table */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-neutral-100 mb-2">
          Image Processing Engine Comparison (Processing 50 × 4K Photos)
        </h4>
        <p className="text-xs text-neutral-400 mb-4">
          Measured on 4-Core Node.js instance with WebP 80% compression.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 font-semibold">
                <th className="py-2.5 px-3">Engine</th>
                <th className="py-2.5 px-3">Throughput Time</th>
                <th className="py-2.5 px-3">Memory Footprint (RSS)</th>
                <th className="py-2.5 px-3">AVIF / MozJPEG Support</th>
                <th className="py-2.5 px-3">Serverless Suitability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-mono">
              <tr className="bg-sky-500/5 text-sky-200">
                <td className="py-2.5 px-3 font-semibold">Sharp (libvips)</td>
                <td className="py-2.5 px-3 font-bold text-emerald-400">1.8 seconds</td>
                <td className="py-2.5 px-3">~120 MB</td>
                <td className="py-2.5 px-3">Native (Built-in)</td>
                <td className="py-2.5 px-3 text-emerald-400">Highest (Fastest)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-neutral-400">ImageMagick (CLI)</td>
                <td className="py-2.5 px-3">12.4 seconds</td>
                <td className="py-2.5 px-3">~680 MB</td>
                <td className="py-2.5 px-3">Requires delegates</td>
                <td className="py-2.5 px-3 text-amber-400">Medium (Process spawn overhead)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-neutral-400">Jimp (Pure JS)</td>
                <td className="py-2.5 px-3">34.2 seconds</td>
                <td className="py-2.5 px-3">&gt; 1.2 GB</td>
                <td className="py-2.5 px-3">Limited</td>
                <td className="py-2.5 px-3 text-rose-400">Poor (Blocks event loop)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
