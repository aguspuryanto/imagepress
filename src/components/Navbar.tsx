import React from 'react';
import { ViewTab } from '../types/compressor';
import { DownloadCloud, Sparkles } from 'lucide-react';
import { exportNextjsProjectZip } from '../utils/exportProjectZip';

interface NavbarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  queueCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, queueCount }) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportNextjsProjectZip();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('compressor');
            }}
            className="text-lg font-bold tracking-tight text-white flex items-center gap-2 hover:text-neutral-200 transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block"></span>
            ImagePress
          </a>
          <span className="text-xs text-neutral-500 font-mono hidden sm:inline">
            Next.js + Sharp Engine
          </span>
        </div>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="flex items-center gap-1 sm:gap-6 text-sm font-medium">
          <button
            onClick={() => onTabChange('compressor')}
            className={`transition-colors py-1 relative whitespace-nowrap text-xs sm:text-sm ${
              activeTab === 'compressor'
                ? 'text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Compressor
            {queueCount > 0 && (
              <span className="ml-1.5 font-mono text-[11px] text-sky-400 tabular-nums">
                ({queueCount})
              </span>
            )}
            {activeTab === 'compressor' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('architecture')}
            className={`transition-colors py-1 relative whitespace-nowrap text-xs sm:text-sm ${
              activeTab === 'architecture'
                ? 'text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Architecture Guide
            {activeTab === 'architecture' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('blueprints')}
            className={`transition-colors py-1 relative whitespace-nowrap text-xs sm:text-sm ${
              activeTab === 'blueprints'
                ? 'text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Code Blueprints
            {activeTab === 'blueprints' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('deployment')}
            className={`transition-colors py-1 relative whitespace-nowrap text-xs sm:text-sm ${
              activeTab === 'deployment'
                ? 'text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Sharp & Docker
            {activeTab === 'deployment' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
            title="Download ready-to-run Next.js + Sharp project ZIP"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating ZIP...' : 'Export Next.js App'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
