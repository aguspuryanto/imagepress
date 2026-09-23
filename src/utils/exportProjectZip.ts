import JSZip from 'jszip';
import { NEXTJS_CODE_FILES } from '../data/nextjsCodeSnippets';
import { ImageQueueItem } from '../types/compressor';

/**
 * Generates and triggers download of a ZIP containing all compressed images in the queue
 */
export async function downloadCompressedImagesZip(items: ImageQueueItem[]): Promise<void> {
  const completedItems = items.filter((item) => item.status === 'done' && item.result?.blob);
  if (completedItems.length === 0) return;

  const zip = new JSZip();

  completedItems.forEach((item) => {
    if (item.result) {
      const ext = item.result.format;
      const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
      const fileName = `${baseName}-compressed.${ext}`;
      zip.file(fileName, item.result.blob);
    }
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `compressed-images-${Date.now()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Exports the complete production Next.js + Sharp project as a ready-to-unzip code bundle
 */
export async function exportNextjsProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Add all code files
  NEXTJS_CODE_FILES.forEach((file) => {
    zip.file(file.path, file.code.trim());
  });

  // Add basic Next.js app page
  const pageTsx = `'use client';

import React, { useState } from 'react';
import { ImageDropzone } from '@/components/ImageDropzone';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string>('');

  const handleFiles = async (newFiles: File[]) => {
    setFiles(newFiles);
    setStatus(\`Uploading \${newFiles.length} files to /api/compress-zip...\`);

    const formData = new FormData();
    newFiles.forEach((f) => formData.append('files', f));
    formData.append('format', 'webp');
    formData.append('quality', '80');

    try {
      const res = await fetch('/api/compress-zip', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Compression failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk-compressed.zip';
      a.click();
      setStatus('Downloaded bulk-compressed.zip!');
    } catch (err: any) {
      setStatus('Error: ' + err.message);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Next.js + Sharp Bulk Image Compressor</h1>
      <ImageDropzone onFilesDropped={handleFiles} />
      {status && <p className="text-sm font-mono text-sky-400">{status}</p>}
    </main>
  );
}
`;
  zip.file('app/page.tsx', pageTsx);

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = 'nextjs-sharp-compressor-project.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
