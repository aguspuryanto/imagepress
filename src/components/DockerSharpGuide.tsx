import React from 'react';
import { Terminal, Check, AlertTriangle, Container, Shield, Server, ArrowUpRight } from 'lucide-react';

export const DockerSharpGuide: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
          Sharp Native Binaries & Deployment Guide
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          How to eliminate native C++ compilation errors, memory leaks, and architecture mismatches in Next.js.
        </p>
      </div>

      {/* 3 Core Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-2">
            <Container className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-neutral-200">1. Alpine Linux Dependencies</h4>
          <p className="text-xs text-neutral-400">
            Node Alpine images use <code className="text-sky-300 font-mono">musl</code> libc, whereas Sharp binaries require glibc compatibility. Always install <code className="text-neutral-200 font-mono">apk add --no-cache libc6-compat</code>.
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
            <Server className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-neutral-200">2. External Package Config</h4>
          <p className="text-xs text-neutral-400">
            Turbopack and Webpack try to bundle Sharp into JavaScript chunks by default. You must declare <code className="text-sky-300 font-mono">serverExternalPackages: ['sharp']</code> in <code className="text-neutral-200 font-mono">next.config.mjs</code>.
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-neutral-200">3. Disable Sharp File Cache</h4>
          <p className="text-xs text-neutral-400">
            In serverless functions (Vercel, AWS Lambda, Cloud Run), calling <code className="text-sky-300 font-mono">sharp.cache(false)</code> prevents native memory pools from persisting across warm invocations.
          </p>
        </div>
      </div>

      {/* Common Errors & Fixes */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 space-y-4">
        <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Common Errors & Exact Fixes
        </h4>

        <div className="space-y-3">
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <span className="text-xs font-mono text-rose-400 block font-semibold">
              Error: 'sharp' is an external package and cannot be bundled
            </span>
            <p className="text-xs text-neutral-400">
              Occurs during <code className="text-neutral-200 font-mono">next build</code> when Next.js tries to trace Sharp native C++ addons.
            </p>
            <div className="bg-neutral-900 p-2.5 rounded font-mono text-xs text-neutral-300">
              <span className="text-neutral-500">// In next.config.mjs:</span>
              <br />
              export default &#123;
              <br />
              &nbsp;&nbsp;serverExternalPackages: ['sharp', 'archiver'],
              <br />
              &#125;;
            </div>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <span className="text-xs font-mono text-rose-400 block font-semibold">
              Error: Could not load the "sharp" module using the darwin-arm64 runtime on linux-x64
            </span>
            <p className="text-xs text-neutral-400">
              Occurs when you build or deploy Docker containers on macOS (Apple Silicon M1/M2/M3) without downloading the target platform’s binary.
            </p>
            <div className="bg-neutral-900 p-2.5 rounded font-mono text-xs text-neutral-300">
              <span className="text-neutral-500"># In package.json or install step:</span>
              <br />
              npm install --os=linux --cpu=x64 sharp
              <br />
              <span className="text-neutral-500"># Or in npm install for multiplatform optional deps:</span>
              <br />
              npm ci --include=optional sharp
            </div>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <span className="text-xs font-mono text-amber-400 block font-semibold">
              Warning: 413 Payload Too Large / Serverless Function Timeout
            </span>
            <p className="text-xs text-neutral-400">
              Next.js App Router default request limit is 4.5MB on Vercel Serverless. For bulk image compression with 20MB+ payloads:
            </p>
            <div className="bg-neutral-900 p-2.5 rounded font-mono text-xs text-neutral-300">
              <span className="text-neutral-500">// In app/api/compress/route.ts:</span>
              <br />
              export const maxDuration = 60; // 60 seconds
              <br />
              <span className="text-neutral-500">// Or stream files one by one with client-side concurrency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Production Multi-Stage Dockerfile Walkthrough */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 space-y-4">
        <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          Production Minimal Container Checklist
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-300">
          <div className="space-y-2">
            <h5 className="font-semibold text-neutral-200">1. Next.js Standalone Mode</h5>
            <p className="text-neutral-400">
              Setting <code className="text-neutral-200 font-mono">output: 'standalone'</code> tells Next.js to trace imports and copy only the necessary files into <code className="text-neutral-200 font-mono">.next/standalone</code>. This drops the Docker image size from ~1.2GB down to ~95MB!
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-semibold text-neutral-200">2. Non-Root Execution</h5>
            <p className="text-neutral-400">
              Always configure an unprivileged <code className="text-neutral-200 font-mono">nextjs:nodejs</code> user in Dockerfile for security when handling uploaded user images.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
