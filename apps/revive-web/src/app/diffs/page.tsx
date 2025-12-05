"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Prism as PrismSyntaxHighlighter } from 'prism-react-renderer';
import { diffLines, Change } from 'diff';

const SyntaxHighlighter: any = PrismSyntaxHighlighter;

interface FileDiff {
  path: string;
  additions: number;
  deletions: number;
  diff: string;
}

// File tree component
const FileTree = ({ files, selectedFile, onSelectFile }: { files: FileDiff[]; selectedFile: string | null; onSelectFile: (path: string) => void }) => {
  // Group files by directory
  const tree: Record<string, string[]> = {};
  
  files.forEach(file => {
    const parts = file.path.split('/');
    const filename = parts.pop()!;
    const dir = parts.join('/');
    
    if (!tree[dir]) {
      tree[dir] = [];
    }
    
    tree[dir].push(filename);
  });

  return (
    <div className="h-full overflow-y-auto">
      {Object.entries(tree).map(([dir, names]) => (
        <div key={dir} className="mb-4">
          {dir && (
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">
              {dir || 'Root'}
            </div>
          )}
          <div className="space-y-1">
            {names.map((fileName, i) => {
              const fullPath = dir ? `${dir}/${fileName}` : fileName;
              const fileData = files.find((f) => f.path === fullPath)!;
              return (
                <button
                  key={i}
                  onClick={() => onSelectFile(fullPath)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                    selectedFile === fullPath
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-gray-300 hover:bg-dark-700/50'
                  }`}
                >
                  <span className="mr-2">{getFileIcon(fileName)}</span>
                  <span className="truncate">{fileName}</span>
                  <span className="ml-auto flex items-center space-x-2">
                    {fileData.additions > 0 && (
                      <span className="text-green-500 text-xs">+{fileData.additions}</span>
                    )}
                    {fileData.deletions > 0 && (
                      <span className="text-red-500 text-xs">-{fileData.deletions}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// Diff viewer component
const DiffViewer = ({ diff, language = 'diff' }: { diff: string, language?: string }) => {
  const lines = diff.split('\n');
  
  return (
    <div className="font-mono text-sm">
      {lines.map((line, i) => {
        let className = 'px-4 py-0.5';
        
        if (line.startsWith('+')) {
          className += ' bg-green-900/30 text-green-300';
        } else if (line.startsWith('-')) {
          className += ' bg-red-900/30 text-red-300';
        } else if (line.startsWith('@@')) {
          className += ' bg-blue-900/30 text-blue-300';
        } else {
          className += ' text-gray-400';
        }
        
        return (
          <div key={i} className={className}>
            {line}
          </div>
        );
      })}
    </div>
  );
};

// Syntax highlighter for code
const CodeViewer = ({ code, language }: { code: string, language: string }) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={undefined}
      customStyle={{
        backgroundColor: 'transparent',
        padding: '0.5rem 1rem',
        margin: 0,
        fontSize: '0.875rem',
        lineHeight: '1.5',
      }}
      codeTagProps={{
        style: {
          fontFamily: 'monospace',
          display: 'block',
        },
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
};

// Get file icon based on extension
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return '📄';
    case 'json':
      return '📋';
    case 'md':
      return '📝';
    case 'css':
    case 'scss':
      return '🎨';
    default:
      return '📄';
  }
};

export default function DiffViewerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [repository, setRepository] = useState<string>('');
  const [files, setFiles] = useState<FileDiff[]>([]);
  const [roadmap, setRoadmap] = useState<string>('');
  const [prDescription, setPrDescription] = useState<string>('');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'diff' | 'split' | 'unified'>('diff');
  const [showFileTree, setShowFileTree] = useState(true);

  useEffect(() => {
    const fetchDiffs = async () => {
      try {
        const repoPath =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('revive:lastRepo')
            : null;

        if (!repoPath) {
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/pr-preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ repoPath }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('Error fetching PR preview:', data);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setRepository(data.plan?.repository ?? repoPath);
        setRoadmap(data.bundle?.roadmap ?? '');
        setPrDescription(data.bundle?.prDescription ?? '');

        const unified = (data.unifiedDiffs ?? []) as { filePath: string; diff: string; additions: number; deletions: number }[];
        const mappedFiles: FileDiff[] = unified.map((d) => ({
          path: d.filePath,
          additions: d.additions,
          deletions: d.deletions,
          diff: d.diff,
        }));

        setFiles(mappedFiles);

        if (mappedFiles.length > 0) {
          setSelectedFile(mappedFiles[0].path);
        }
      } catch (error) {
        console.error('Error fetching diffs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiffs();
  }, []);

  const selectedFileData = files.find(file => file.path === selectedFile);
  
  // Get file extension for syntax highlighting
  const fileExtension = selectedFile?.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'json': 'json',
    'md': 'markdown',
    'css': 'css',
    'scss': 'scss',
  };
  const language = languageMap[fileExtension] || 'plaintext';

  const canCreatePr = /github\.com/.test(repository);

  const handleCreatePr = async () => {
    if (!repository && typeof window !== 'undefined') {
      const repoPath = window.localStorage.getItem('revive:lastRepo');
      if (repoPath) {
        // prefer lastRepo if repository is empty
        setRepository(repoPath);
      }
    }
    const repoPath =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('revive:lastRepo')
        : null;
    if (!repoPath) return;

    setIsCreatingPr(true);
    try {
      const res = await fetch('/api/github-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoPath }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('GitHub PR creation failed', data);
        return;
      }
      setPrUrl(data.prUrl ?? null);
      if (data.bundle?.prDescription) {
        setPrDescription(data.bundle.prDescription);
      }
    } catch (error) {
      console.error('Error creating GitHub PR:', error);
    } finally {
      setIsCreatingPr(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-300">Loading changes...</p>
        </div>
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Failed to load changes</h2>
          <p className="text-gray-400 mb-6">We couldn't load the changes. Please try again.</p>
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-300">Loading diffs...</div>}>
      <div className="min-h-screen bg-dark-900 text-gray-200">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold">Changes</h1>
              <div className="text-sm text-gray-400 mt-1">
                <span className="text-primary-400">{repository}</span>
                <span className="mx-2">•</span>
                <span>{files.length} files changed</span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-wrap gap-3 items-center">
              <div className="flex items-center bg-dark-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('diff')}
                  className={`px-3 py-1.5 text-sm ${
                    viewMode === 'diff' ? 'bg-primary-500 text-white' : 'text-gray-300 hover:bg-dark-600'
                  }`}
                >
                  Diff
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1.5 text-sm ${
                    viewMode === 'split' ? 'bg-primary-500 text-white' : 'text-gray-300 hover:bg-dark-600'
                  }`}
                >
                  Split
                </button>
                <button
                  onClick={() => setViewMode('unified')}
                  className={`px-3 py-1.5 text-sm ${
                    viewMode === 'unified' ? 'bg-primary-500 text-white' : 'text-gray-300 hover:bg-dark-600'
                  }`}
                >
                  Unified
                </button>
              </div>
              
              <button
                onClick={() => setShowFileTree(!showFileTree)}
                className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm flex items-center"
              >
                <svg 
                  className={`w-4 h-4 mr-1 transition-transform ${!showFileTree ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {showFileTree ? 'Hide' : 'Show'} File Tree
              </button>
              
              <Link
                href="/"
                className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Pull Request
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* File Tree */}
        {showFileTree && (
          <div className="w-64 flex-shrink-0 border-r border-dark-700 bg-dark-800/50 overflow-y-auto">
            <div className="p-3 border-b border-dark-700">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter files..."
                  className="w-full bg-dark-700 border border-dark-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
                <svg className="absolute right-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <FileTree 
              files={files} 
              selectedFile={selectedFile} 
              onSelectFile={setSelectedFile} 
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedFileData ? (
            <>
              {/* File Header */}
              <div className="bg-dark-800/80 border-b border-dark-700 p-3 flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <span className="mr-2">{getFileIcon(selectedFile ?? '')}</span>
                  <h2 className="text-sm font-medium truncate">{selectedFile}</h2>
                  <div className="ml-4 flex items-center space-x-3 text-xs">
                    <span className="text-green-500">+{selectedFileData.additions}</span>
                    <span className="text-red-500">-{selectedFileData.deletions}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-dark-700">
                    <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  <button className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-dark-700">
                    <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View File
                  </button>
                </div>
              </div>
              
              {/* Diff Content */}
              <div className="flex-1 overflow-auto bg-dark-900">
                {viewMode === 'diff' && selectedFileData && (
                  <div className="border border-dark-700 rounded-lg m-4 overflow-hidden">
                    <div className="bg-dark-800 px-4 py-2 border-b border-dark-700 text-sm text-gray-400">
                      {selectedFile}
                    </div>
                    <DiffViewer diff={selectedFileData.diff} language={language} />
                  </div>
                )}
                
                {viewMode === 'split' && selectedFileData && (
                  <div className="grid grid-cols-2 h-full divide-x divide-dark-700">
                    <div className="overflow-auto">
                      <div className="bg-red-900/20 text-red-400 px-4 py-2 text-sm font-medium">
                        Original
                      </div>
                      <div className="p-4">
                        {selectedFileData.diff
                          .split('\n')
                          .filter(line => line.startsWith('-') || !line.startsWith('+'))
                          .map(line => line.startsWith('-') ? line.slice(1) : line)
                          .join('\n')}
                      </div>
                    </div>
                    <div className="overflow-auto">
                      <div className="bg-green-900/20 text-green-400 px-4 py-2 text-sm font-medium">
                        Updated
                      </div>
                      <div className="p-4">
                        {selectedFileData.diff
                          .split('\n')
                          .filter(line => line.startsWith('+') || !line.startsWith('-'))
                          .map(line => line.startsWith('+') ? line.slice(1) : line)
                          .join('\n')}
                      </div>
                    </div>
                  </div>
                )}
                
                {viewMode === 'unified' && selectedFileData && (
                  <div className="p-4">
                    <CodeViewer 
                      code={selectedFileData.diff} 
                      language={language} 
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row text-gray-200">
              <div className="md:w-1/2 p-4 border-r border-dark-700 overflow-auto">
                <h3 className="text-lg font-semibold mb-2">Modernization Roadmap</h3>
                <pre className="text-sm whitespace-pre-wrap bg-dark-900/60 rounded-lg p-3 border border-dark-700/80">
                  {roadmap || 'No roadmap generated.'}
                </pre>
              </div>
              <div className="md:w-1/2 p-4 overflow-auto">
                <h3 className="text-lg font-semibold mb-2">PR Description</h3>
                <pre className="text-sm whitespace-pre-wrap bg-dark-900/60 rounded-lg p-3 border border-dark-700/80">
                  {prDescription || 'No PR description generated.'}
                </pre>
                {prUrl && (
                  <p className="mt-3 text-sm">
                    GitHub PR: <a href={prUrl} target="_blank" rel="noreferrer" className="text-primary-400 underline">{prUrl}</a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </Suspense>
  );
}
