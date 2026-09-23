import React, { useState } from 'react';
import { NEXTJS_CODE_FILES, CodeFile } from '../data/nextjsCodeSnippets';
import { Copy, Check, FileCode, Download, Folder, FileText } from 'lucide-react';
import { exportNextjsProjectZip } from '../utils/exportProjectZip';

export const CodeBlueprints: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(NEXTJS_CODE_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      await exportNextjsProjectZip();
    } finally {
      setIsExporting(false);
    }
  };

  const lines = selectedFile.code.split('\n');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
            Production Code Blueprints
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Complete, copy-paste ready Next.js 15 App Router files tested for Node.js runtimes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportZip}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Packaging...' : 'Export Complete Project (.ZIP)'}</span>
        </button>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: File Tree */}
        <div className="lg:col-span-4 bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
            <span>Project Explorer</span>
            <span className="font-mono text-[10px]">{NEXTJS_CODE_FILES.length} files</span>
          </div>

          <div className="space-y-1">
            {NEXTJS_CODE_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-neutral-800 text-sky-400 font-medium'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                    <span className="text-xs font-mono truncate">{file.path}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                    {file.code.split('\n').length}L
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8 bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
          {/* File bar */}
          <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-200 font-mono">
                  {selectedFile.path}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-neutral-800 text-neutral-400 rounded font-mono uppercase">
                  {selectedFile.language}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {selectedFile.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Code Window with Line Numbers */}
          <div className="p-4 overflow-x-auto font-mono text-xs text-neutral-300 bg-neutral-950/80 max-h-[560px] overflow-y-auto leading-relaxed">
            <pre className="flex gap-4">
              <div className="select-none text-neutral-600 text-right pr-2 border-r border-neutral-800 tabular-nums">
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <div className="flex-1 whitespace-pre">
                {selectedFile.code}
              </div>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
