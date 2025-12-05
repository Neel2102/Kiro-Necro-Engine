"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScanResult } from '@/types/scan';
import PageHeader from '@/components/PageHeader';
import IssueCard from '@/components/IssueCard';
import StatsCard from '@/components/StatsCard';

export default function ScanResults() {
  const router = useRouter();
  const [scanResults, setScanResults] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  type SeverityTab = 'all' | 'critical' | 'high' | 'medium' | 'low';
  const [selectedTab, setSelectedTab] = useState<SeverityTab>('all');
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchScanResults = async () => {
      try {
        const repoPath =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('revive:lastRepo')
            : null;

        if (!repoPath) {
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoPath }),
        });

        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const data = (await res.json()) as { report: ScanResult };
        setScanResults(data.report);
      } catch (error) {
        console.error('Error fetching scan results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScanResults();
  }, []);

  const toggleIssueSelection = (issueId: string) => {
    const newSelection = new Set(selectedIssues);
    if (selectedIssues.has(issueId)) {
      newSelection.delete(issueId);
    } else {
      newSelection.add(issueId);
    }
    setSelectedIssues(newSelection);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-8xl mb-6">🎃</div>
          <p className="text-2xl md:text-3xl text-orange-300 font-bold animate-flicker mb-3">
            Summoning the spirits...
          </p>
          <p className="text-lg md:text-xl text-gray-300">
            Analyzing your cursed codebase 🕯️
          </p>
        </div>
      </div>
    );
  }

  if (!scanResults) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="spooky-card max-w-2xl text-center mx-auto">
          <div className="text-8xl mb-6">💀</div>
          <h2 className="text-3xl md:text-4xl font-bold text-red-400 mb-6">
            Resurrection Failed!
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            The spirits couldn't analyze this repository. Please try again.
          </p>
          <Link 
            href="/" 
            className="btn-primary inline-flex items-center text-xl"
          >
            Return to Crypt 🏚️
          </Link>
        </div>
      </div>
    );
  }

  const filteredIssues = selectedTab === 'all' 
    ? scanResults.issues 
    : scanResults.issues.filter(issue => issue.severity === selectedTab);

  const allFilteredSelected =
    filteredIssues.length > 0 && filteredIssues.every((issue) => selectedIssues.has(issue.id));

  const toggleSelectAll = () => {
    const newSelection = new Set(selectedIssues);
    if (allFilteredSelected) {
      filteredIssues.forEach((issue) => {
        newSelection.delete(issue.id);
      });
    } else {
      filteredIssues.forEach((issue) => {
        newSelection.add(issue.id);
      });
    }
    setSelectedIssues(newSelection);
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-orange-300">Loading...</div>}>
      <div className="spooky-section">
        <div className="spooky-container max-w-7xl mx-auto">
          
          {/* Header */}
          <PageHeader 
            title="🔮 Scan Results 🔮"
            subtitle={`Repository: ${scanResults.repository}`}
            icon="🎃"
          />

          <div className="text-center mb-10">
            <p className="text-base md:text-lg text-gray-300">
              📅 Scanned on {new Date(scanResults.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Statistics Container */}
          <div className="spooky-card mb-10 md:mb-14 max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-orange-400 mb-3">
                👻 Issue Statistics 👻
              </h2>
              <p className="text-lg md:text-xl text-gray-200">
                Total cursed code detected: <span className="text-orange-400 font-bold text-xl md:text-2xl">{scanResults.summary.totalIssues}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <StatsCard label="Critical" value={scanResults.summary.critical} icon="💀" color="red" />
              <StatsCard label="High" value={scanResults.summary.high} icon="🎃" color="orange" />
              <StatsCard label="Medium" value={scanResults.summary.medium} icon="👻" color="yellow" />
              <StatsCard label="Low" value={scanResults.summary.low} icon="🕸️" color="blue" />
            </div>
          </div>

          {/* Select All Issues for current view */}
          <div className="flex justify-end mb-6 max-w-6xl mx-auto px-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="btn-secondary text-sm md:text-base px-4 py-2"
            >
              {allFilteredSelected ? 'Deselect all issues in this view' : 'Select all issues in this view'}
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12 md:mb-16">
            {(['all', 'critical', 'high', 'medium', 'low'] as SeverityTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all duration-300 cursor-pointer ${
                  selectedTab === tab
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-black shadow-2xl shadow-orange-500/50 scale-110'
                    : 'bg-gray-800/60 text-orange-300 border-2 border-purple-700 hover:border-orange-500 hover:bg-gray-800/80 hover:scale-105'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== 'all' && (() => {
                  const summaryByTab: Record<Exclude<SeverityTab, 'all'>, number> = {
                    critical: scanResults.summary.critical,
                    high: scanResults.summary.high,
                    medium: scanResults.summary.medium,
                    low: scanResults.summary.low,
                  };
                  const key = tab as Exclude<SeverityTab, 'all'>;
                  return ` (${summaryByTab[key] || 0})`;
                })()}
              </button>
            ))}
          </div>

          {/* Issues List */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-orange-400 mb-3">
                🪦 Detected Issues 🪦
              </h2>
              <p className="text-xl md:text-2xl text-gray-200">
                {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="space-y-8">
              {filteredIssues.length === 0 ? (
                <div className="spooky-card text-center py-16 mx-auto">
                  <div className="text-8xl mb-6">✨</div>
                  <p className="text-2xl md:text-3xl text-gray-200 font-bold">
                    No issues found in this category! 🎉
                  </p>
                </div>
              ) : (
                filteredIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    isSelected={selectedIssues.has(issue.id)}
                    onToggle={() => toggleIssueSelection(issue.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 mt-16 max-w-3xl mx-auto">
            <Link 
              href="/" 
              className="btn-secondary text-center text-lg md:text-xl px-8 py-4"
            >
              🏚️ Scan Another Repository
            </Link>
            <button
              onClick={() => router.push('/plan')}
              disabled={selectedIssues.size === 0}
              className={`btn-primary text-center text-lg md:text-xl px-8 py-4 cursor-pointer ${
                selectedIssues.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {selectedIssues.size > 0 
                ? `Create Plan (${selectedIssues.size} selected) ⚡`
                : 'Select issues to create plan'}
            </button>
          </div>

          {/* Floating Action Button */}
          {selectedIssues.size > 0 && (
            <div className="fixed bottom-8 right-8 z-50">
              <button
                onClick={() => router.push('/plan')}
                className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-orange-600 to-orange-700 shadow-2xl shadow-orange-500/50 hover:scale-110 transform transition-all duration-300 animate-spooky-glow cursor-pointer"
                title="Create plan with selected issues"
              >
                <span className="text-black text-3xl md:text-4xl font-black">
                  {selectedIssues.size}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
}
