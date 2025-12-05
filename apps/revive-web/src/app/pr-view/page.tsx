"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Copy, ChevronDown, ChevronUp, ExternalLink, ArrowLeft } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast, Toaster } from 'react-hot-toast';

interface PRViewData {
  readme: string;
  roadmap: string;
  diffs: Array<{
    filePath: string;
    diff: string;
    additions: number;
    deletions: number;
  }>;
  prDescription: string;
  prUrl?: string;
}

export default function PRViewPage() {
  const router = useRouter();
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [prCreated, setPrCreated] = useState(false);
  const [data, setData] = useState<PRViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    readme: true,
    roadmap: true
  });

  // Copy to clipboard with toast notification
  const copyToClipboard = async (text: string, message: string = 'Copied to clipboard!') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message, { position: 'bottom-center' });
    } catch (err) {
      toast.error('Failed to copy', { position: 'bottom-center' });
      console.error('Failed to copy:', err);
    }
  };

  // Handle PR creation
  const handleCreatePR = async () => {
    if (!data) return;
    
    setIsCreatingPR(true);
    try {
      const repoPath = localStorage.getItem('revive:lastRepo');
      if (!repoPath) {
        throw new Error('No repository selected');
      }

      const res = await fetch('/api/github-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to create PR');
      }

      const result = await res.json();
      if (result.prUrl) {
        setData(prev => prev ? { ...prev, prUrl: result.prUrl } : null);
        setPrCreated(true);
        toast.success('Pull request created successfully!', { position: 'bottom-center' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create PR';
      setError(errorMessage);
      toast.error(errorMessage, { position: 'bottom-center' });
    } finally {
      setIsCreatingPR(false);
    }
  };

  // Keyboard navigation
  useHotkeys('j', () => {
    if (!data?.diffs.length) return;
    const currentIndex = data.diffs.findIndex(d => d.filePath === selectedFile);
    const nextIndex = (currentIndex + 1) % data.diffs.length;
    setSelectedFile(data.diffs[nextIndex].filePath);
  });

  useHotkeys('k', () => {
    if (!data?.diffs.length) return;
    const currentIndex = data.diffs.findIndex(d => d.filePath === selectedFile);
    const prevIndex = (currentIndex - 1 + data.diffs.length) % data.diffs.length;
    setSelectedFile(data.diffs[prevIndex].filePath);
  });

  // Load PR data
  useEffect(() => {
    const loadData = async () => {
      try {
        const repoPath = localStorage.getItem('revive:lastRepo');
        if (!repoPath) {
          throw new Error('No repository selected');
        }

        const res = await fetch('/api/pr-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoPath }),
        });

        if (!res.ok) {
          throw new Error('Failed to load PR data');
        }

        const result = await res.json();
        setData({
          readme: result.bundle?.readme || '# No README available',
          roadmap: result.bundle?.roadmap || 'No roadmap available',
          diffs: result.unifiedDiffs || [],
          prDescription: result.bundle?.prDescription || 'No PR description available',
          prUrl: result.prUrl,
        });
        
        if (result.unifiedDiffs?.length) {
          setSelectedFile(result.unifiedDiffs[0].filePath);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PR data';
        setError(errorMessage);
        toast.error(errorMessage, { position: 'bottom-center' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🎃</div>
          <p className="text-orange-400 text-xl font-bold animate-flicker">Summoning PR data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spooky-card max-w-md text-center p-8">
          <div className="text-6xl mb-4">💀</div>
          <h2 className="text-2xl font-bold text-red-500 mb-4">Resurrection Failed!</h2>
          <p className="text-purple-300 mb-6">{error}</p>
          <Link
            href="/"
            className="btn-secondary inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Crypt
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const selectedDiff = data.diffs.find(d => d.filePath === selectedFile) || data.diffs[0];
  const filteredDiffs = data.diffs.filter(file => 
    file.filePath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Toaster />
      
      {/* 🎃 SPOOKY PR HEADER 🎃 */}
      <div className="spooky-container py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link 
              href="/" 
              className="text-orange-400 hover:text-orange-300 transition-colors p-2 rounded-lg hover:bg-purple-900/30"
              title="Back to Home"
            >
              <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-orange-500">
              📜 PR Preview 👻
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {data.prUrl ? (
              <a
                href={data.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm md:text-base px-4 md:px-6 py-2 md:py-3 flex items-center space-x-2"
              >
                <span>View on GitHub</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <button
                onClick={handleCreatePR}
                disabled={isCreatingPR || prCreated}
                className={`btn-primary text-sm md:text-base px-4 md:px-6 py-2 md:py-3 flex items-center space-x-2 ${
                  (isCreatingPR || prCreated) ? 'opacity-75' : ''
                }`}
              >
                {isCreatingPR ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                    <span>Summoning PR...</span>
                  </>
                ) : prCreated ? (
                  '✅ PR Created!'
                ) : (
                  'Create Pull Request'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="spooky-container pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* 🕸️ LEFT SIDEBAR - FILES 🕸️ */}
          <div className="lg:col-span-1 space-y-6">
            {/* Files List */}
            <div className="spooky-card">
              <div className="p-4 border-b-2 border-purple-700/50">
                <h2 className="text-sm md:text-base font-bold uppercase tracking-wider text-orange-400 mb-3">
                  🗂️ Files Changed ({data.diffs.length})
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                  <input
                    type="text"
                    placeholder="Filter files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field text-sm pl-10"
                  />
                </div>
              </div>
              <div className="max-h-[400px] lg:max-h-[calc(100vh-400px)] overflow-y-auto">
                {filteredDiffs.map((file) => (
                  <div
                    key={file.filePath}
                    onClick={() => setSelectedFile(file.filePath)}
                    className={`group p-3 md:p-4 border-b border-purple-700/30 transition-all duration-200 ${
                      selectedFile === file.filePath 
                        ? 'bg-purple-900/40 border-l-4 border-l-orange-500' 
                        : 'hover:bg-purple-900/20 cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span 
                        className="truncate text-xs md:text-sm font-mono text-orange-300"
                        title={file.filePath}
                      >
                        {file.filePath.split('/').pop()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(file.filePath, 'File path copied!');
                        }}
                        className="text-purple-400 hover:text-orange-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy file path"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-xs text-purple-400 truncate mt-1" title={file.filePath}>
                      {file.filePath}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-green-400">+{file.additions}</span>
                      <span className="text-red-400">-{file.deletions}</span>
                    </div>
                  </div>
                ))}
                {filteredDiffs.length === 0 && (
                  <div className="p-6 text-center text-sm text-purple-400">
                    👻 No files match your search
                  </div>
                )}
              </div>
            </div>

            {/* README Section */}
            <div className="spooky-card">
              <div 
                className="p-4 border-b-2 border-purple-700/50 flex justify-between items-center transition-colors hover:bg-purple-900/20"
                onClick={() => setExpandedSections(prev => ({ ...prev, readme: !prev.readme }))}
              >
                <h2 className="text-sm md:text-base font-bold uppercase tracking-wider text-orange-400">
                  📖 README
                </h2>
                {expandedSections.readme ? (
                  <ChevronUp className="h-5 w-5 text-purple-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-purple-400" />
                )}
              </div>
              {expandedSections.readme && (
                <div className="p-4 max-h-64 overflow-y-auto">
                  <div 
                    className="prose prose-invert prose-sm max-w-none text-purple-300"
                    dangerouslySetInnerHTML={{ __html: data.readme }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 🎃 MAIN CONTENT - DIFF VIEW 🎃 */}
          <div className="lg:col-span-3 space-y-6">
            {/* Selected File Diff */}
            {selectedDiff && (
              <div className="spooky-card">
                <div className="p-4 border-b-2 border-purple-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span 
                      className="text-sm md:text-base font-mono truncate text-orange-400 font-bold"
                      title={selectedDiff.filePath}
                    >
                      {selectedDiff.filePath}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedDiff.filePath, 'File path copied!')}
                      className="text-purple-400 hover:text-orange-400 p-1 rounded transition-colors"
                      title="Copy file path"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-green-400 font-bold">+{selectedDiff.additions}</span>
                    <span className="text-red-400 font-bold">-{selectedDiff.deletions}</span>
                    <span className="text-purple-400 text-xs hidden md:inline-block">
                      ⌨️ j/k to navigate
                    </span>
                  </div>
                </div>
                <pre className="p-0 overflow-x-auto text-xs md:text-sm bg-black/40 max-h-[600px] overflow-y-auto">
                  <code className="text-purple-300" dangerouslySetInnerHTML={{ __html: selectedDiff.diff }} />
                </pre>
              </div>
            )}

            {/* PR Description */}
            <div className="spooky-card">
              <div className="p-4 border-b-2 border-purple-700/50">
                <h2 className="text-base md:text-lg font-bold uppercase tracking-wider text-orange-400">
                  📝 PR Description
                </h2>
              </div>
              <div 
                className="p-4 md:p-6 prose prose-invert max-w-none text-sm md:text-base text-purple-300"
                dangerouslySetInnerHTML={{ __html: data.prDescription }}
              />
            </div>

            {/* Roadmap */}
            <div className="spooky-card">
              <div 
                className="p-4 border-b-2 border-purple-700/50 flex justify-between items-center transition-colors hover:bg-purple-900/20"
                onClick={() => setExpandedSections(prev => ({ ...prev, roadmap: !prev.roadmap }))}
              >
                <h2 className="text-base md:text-lg font-bold uppercase tracking-wider text-orange-400">
                  🗺️ Roadmap
                </h2>
                {expandedSections.roadmap ? (
                  <ChevronUp className="h-5 w-5 text-purple-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-purple-400" />
                )}
              </div>
              {expandedSections.roadmap && (
                <div className="p-4 md:p-6">
                  <div 
                    className="whitespace-pre-wrap font-mono text-xs md:text-sm bg-black/40 p-4 rounded-lg text-purple-300"
                    dangerouslySetInnerHTML={{ __html: data.roadmap }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
