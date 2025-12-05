"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';

interface Task {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  estimatedTime?: string;
  affectedFiles?: string[];
  files?: string[];
  commands?: string[];
}

interface Plan {
  repository: string;
  timestamp: string;
  tasks: Task[];
}

export default function ModernizationPlan() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const repoPath =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('revive:lastRepo')
            : null;

        if (!repoPath) {
          setIsLoading(false);
          return;
        }

        // Fetch the scan results which includes the plan
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoPath }),
        });

        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        
        // Transform the plan data to match our UI structure
        if (data.plan && data.plan.tasks) {
          const transformedPlan: Plan = {
            repository: data.report?.repository || repoPath,
            timestamp: data.report?.timestamp || new Date().toISOString(),
            tasks: data.plan.tasks.map((task: any) => ({
              id: task.id || `task-${Math.random().toString(36).substr(2, 9)}`,
              type: task.type || 'modernization',
              title: task.title || task.description || 'Modernization Task',
              description: task.description || task.title || 'No description available',
              confidence: task.confidence || 0.8,
              estimatedTime: task.estimatedTime || 'Unknown',
              affectedFiles: task.files || task.affectedFiles || [],
              files: task.files || task.affectedFiles || [],
              commands: task.commands || [],
            })),
          };
          setPlan(transformedPlan);
        }
      } catch (error) {
        console.error('Error fetching modernization plan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, []);

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (selectedTasks.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const handleCheckboxClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    toggleTaskSelection(taskId);
  };

  const handleApplyChanges = async () => {
    if (selectedTasks.size === 0) return;
    
    setIsApplying(true);
    try {
      // Store selected tasks for the transformation
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('revive:selectedTasks', JSON.stringify(Array.from(selectedTasks)));
      }
      
      // Navigate to diffs page which will trigger the transformation
      router.push('/diffs');
    } catch (error) {
      console.error('Error applying changes:', error);
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-8xl mb-6">🔮</div>
          <p className="text-2xl md:text-3xl text-orange-300 font-bold animate-flicker">
            Crafting your modernization plan...
          </p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="spooky-card max-w-2xl text-center mx-auto">
          <div className="text-8xl mb-6">⚠️</div>
          <h2 className="text-3xl md:text-4xl font-bold text-red-400 mb-6">
            Plan Generation Failed
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            We couldn't generate a modernization plan. Please try again.
          </p>
          <Link 
            href="/" 
            className="btn-primary inline-flex items-center text-xl"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-orange-300">Loading...</div>}>
      <div className="spooky-container-narrow">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }} className="animate-float">📋</div>
          <h1
            style={{ 
              fontSize: 'clamp(2.1rem, 4.2vw, 3.4rem)', 
              fontWeight: 900, 
              textAlign: 'center', 
              marginBottom: '0.75rem', 
              lineHeight: 1.2,
              color: 'rgb(253, 186, 116)'
            }}
            className="spooky-text"
          >
            🧪 Modernization Plan 🧪
          </h1>
          <p style={{ 
            fontSize: 'clamp(0.95rem, 1.8vw, 1.3rem)', 
            textAlign: 'center', 
            maxWidth: '800px', 
            margin: '0 auto', 
            fontWeight: 600, 
            lineHeight: 1.6,
            color: 'rgb(253, 186, 116)'
          }}>
            Repository: {plan.repository}
          </p>
        </div>

          {/* Tasks List */}
          <div style={{ marginBottom: '2.5rem' }}>
            {plan.tasks.map((task) => {
              const affectedFiles = task.affectedFiles || task.files || [];
              return (
                <div 
                  key={task.id}
                  style={{ 
                    background: selectedTasks.has(task.id)
                      ? 'linear-gradient(135deg, rgba(30, 30, 40, 0.98), rgba(50, 30, 60, 0.95))' 
                      : 'linear-gradient(135deg, rgba(30, 30, 40, 0.95), rgba(50, 30, 60, 0.92))',
                    border: selectedTasks.has(task.id) ? '3px solid rgb(249, 115, 22)' : '2px solid rgba(147, 51, 234, 0.5)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    boxShadow: selectedTasks.has(task.id) 
                      ? '0 10px 40px rgba(249, 115, 22, 0.4), 0 0 30px rgba(249, 115, 22, 0.2)' 
                      : '0 8px 30px rgba(88, 28, 135, 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => toggleTaskSelection(task.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                    {/* Checkbox - FIXED FOR CLICKABILITY */}
                    <div style={{ 
                      marginTop: '0.5rem', 
                      flexShrink: 0,
                      position: 'relative',
                      zIndex: 20,
                      pointerEvents: 'auto'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => {}}
                        onClick={(e) => handleCheckboxClick(e, task.id)}
                        style={{
                          width: '1.75rem',
                          height: '1.75rem',
                          borderRadius: '0.5rem',
                          border: '2px solid rgb(147, 51, 234)',
                          backgroundColor: selectedTasks.has(task.id) ? 'rgb(249, 115, 22)' : 'rgb(30, 30, 40)',
                          cursor: 'pointer',
                          accentColor: 'rgb(249, 115, 22)',
                          position: 'relative',
                          zIndex: 20,
                          pointerEvents: 'auto'
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <h3 style={{ 
                          fontSize: 'clamp(1.1rem, 2.6vw, 1.5rem)',
                          fontWeight: 700,
                          color: 'rgb(253, 186, 116)',
                          lineHeight: 1.3
                        }}>
                          {task.title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          {task.estimatedTime && (
                            <span style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: 'rgba(55, 65, 81, 0.6)',
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              color: 'rgb(229, 231, 235)'
                            }}>
                              ⏱️ {task.estimatedTime}
                            </span>
                          )}
                          <span style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            backgroundColor: task.confidence >= 0.8 ? 'rgba(34, 197, 94, 0.2)' :
                              task.confidence >= 0.5 ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: task.confidence >= 0.8 ? 'rgb(134, 239, 172)' :
                              task.confidence >= 0.5 ? 'rgb(253, 224, 71)' : 'rgb(252, 165, 165)',
                            border: task.confidence >= 0.8 ? '2px solid rgb(34, 197, 94)' :
                              task.confidence >= 0.5 ? '2px solid rgb(234, 179, 8)' : '2px solid rgb(239, 68, 68)'
                          }}>
                            🔮 {Math.round(task.confidence * 100)}%
                          </span>
                        </div>
                      </div>

                      <p style={{ 
                        color: 'rgb(229, 231, 235)',
                        fontSize: 'clamp(0.95rem, 1.9vw, 1.1rem)',
                        marginBottom: '1.25rem',
                        lineHeight: 1.55
                      }}>
                        {task.description}
                      </p>

                      {/* Affected Files */}
                      {affectedFiles.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h4 style={{ 
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'rgb(253, 186, 116)',
                            marginBottom: '0.75rem'
                          }}>
                            📁 Affected Files ({affectedFiles.length}):
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {affectedFiles.map((file, i) => (
                              <span 
                                key={i}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: 'rgba(55, 65, 81, 0.6)',
                                  fontSize: '0.875rem',
                                  borderRadius: '0.5rem',
                                  border: '1px solid rgb(107, 114, 128)',
                                  color: 'rgb(229, 231, 235)',
                                  fontFamily: 'monospace'
                                }}
                              >
                                {file}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Commands */}
                      {task.commands && task.commands.length > 0 && (
                        <div style={{ 
                          paddingTop: '1.5rem',
                          borderTop: '2px solid rgba(147, 51, 234, 0.3)'
                        }}>
                          <h4 style={{ 
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'rgb(253, 186, 116)',
                            marginBottom: '1rem'
                          }}>
                            💻 Commands to Run:
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {task.commands.map((cmd, i) => (
                              <div key={i} style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                color: 'rgb(134, 239, 172)',
                                overflowX: 'auto'
                              }}>
                                <span style={{ color: 'rgb(251, 146, 60)' }}>$</span> {cmd}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row',
            justifyContent: 'center', 
            gap: '1.5rem',
            marginTop: '3rem',
            flexWrap: 'wrap'
          }}>
            <Link 
              href="/scan-results" 
              className="btn-secondary"
              style={{ 
                textAlign: 'center', 
                fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 3vw, 2rem)',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              ← Back to Results
            </Link>
            <button
              onClick={handleApplyChanges}
              disabled={selectedTasks.size === 0 || isApplying}
              className="btn-primary"
              style={{ 
                textAlign: 'center', 
                fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 3vw, 2rem)',
                cursor: (selectedTasks.size === 0 || isApplying) ? 'not-allowed' : 'pointer',
                opacity: (selectedTasks.size === 0 || isApplying) ? 0.5 : 1
              }}
            >
              {isApplying ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ 
                    animation: 'spin 1s linear infinite', 
                    marginLeft: '-0.25rem', 
                    marginRight: '0.75rem', 
                    height: '1.5rem', 
                    width: '1.5rem' 
                  }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Applying Changes...
                </span>
              ) : (
                `Apply Selected (${selectedTasks.size}) ⚡`
              )}
            </button>
          </div>
      </div>
    </Suspense>
  );
}
