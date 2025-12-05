'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;
    
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('revive:lastRepo', repoUrl);
      }
      router.push('/scan-results');
    } catch (error) {
      console.error('Error scanning repository:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '3rem 0' 
    }}>
      {/* Floating Halloween decorations */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: -10, 
        opacity: 0.15, 
        pointerEvents: 'none', 
        overflow: 'hidden' 
      }}>
        <div style={{ position: 'absolute', top: '5rem', left: '2.5rem', fontSize: 'clamp(3rem, 8vw, 5rem)' }} className="animate-float-bat">🦇</div>
        <div style={{ position: 'absolute', top: '8rem', right: '2.5rem', fontSize: 'clamp(3rem, 8vw, 5rem)' }} className="animate-float-ghost">👻</div>
        <div style={{ position: 'absolute', bottom: '8rem', left: '25%', fontSize: 'clamp(2.5rem, 7vw, 4.5rem)' }} className="animate-float">🎃</div>
        <div style={{ position: 'absolute', bottom: '5rem', right: '33%', fontSize: 'clamp(2rem, 6vw, 4rem)' }} className="animate-cobweb-sway">🕸️</div>
      </div>

      <div className="spooky-container-narrow" style={{ position: 'relative', zIndex: 10 }}>
        {/* Main Content Card */}
        <div className="spooky-card" style={{ textAlign: 'center', marginBottom: 0 }}>
          {/* Badge */}
          <div style={{ marginBottom: '2rem' }}>
            <span className="spooky-badge-primary" style={{ 
              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)', 
              padding: '0.75rem 1.5rem' 
            }}>
              🎃 Halloween Beta Release 👻
            </span>
          </div>
          
          {/* Main Heading - IMPROVED CONTRAST */}
          <h1 style={{ 
            fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', 
            fontWeight: 900, 
            marginBottom: '1.25rem', 
            lineHeight: 1.2 
          }}>
            <span className="spooky-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Revive Your Repo</span>
            <span style={{ 
              display: 'block', 
              color: 'rgb(196, 181, 253)' 
            }}>with Necro Engine</span>
          </h1>
          
          {/* Subtitle - IMPROVED CONTRAST */}
          <p style={{ 
            fontSize: 'clamp(1rem, 2.2vw, 1.5rem)', 
            color: 'rgb(253, 186, 116)', 
            marginBottom: '2.25rem', 
            fontWeight: 600, 
            maxWidth: '48rem', 
            margin: '0 auto 2.25rem auto', 
            lineHeight: 1.6 
          }}>
            Summon the power of AI necromancy to resurrect your legacy codebase! ✨
          </p>

          {/* Input Form */}
          <form onSubmit={handleSubmit} style={{ maxWidth: '48rem', margin: '0 auto 2rem auto' }}>
            <div className="haunted-window" style={{ 
              padding: 'clamp(1.25rem, 3.5vw, 2rem)', 
              borderRadius: '1rem' 
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/spooky-repo 🕸️"
                    className="input-field"
                    style={{ 
                      fontSize: 'clamp(0.95rem, 1.9vw, 1.2rem)', 
                      padding: 'clamp(0.9rem, 1.8vw, 1.35rem)',
                      cursor: 'text'
                    }}
                    required
                  />
                  <div style={{ 
                    position: 'absolute', 
                    inset: '0 0 0 auto', 
                    display: 'flex', 
                    alignItems: 'center', 
                    paddingRight: '1.25rem', 
                    pointerEvents: 'none' 
                  }}>
                    <span style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }} className="animate-float">🔗</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                  style={{ 
                    fontSize: 'clamp(1rem, 2.2vw, 1.35rem)', 
                    padding: 'clamp(0.9rem, 2vw, 1.3rem) clamp(1.75rem, 3.5vw, 2.75rem)', 
                    whiteSpace: 'nowrap', 
                    width: '100%',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ 
                        animation: 'spin 1s linear infinite', 
                        marginLeft: '-0.25rem', 
                        marginRight: '1rem', 
                        height: 'clamp(1.25rem, 2.5vw, 1.75rem)', 
                        width: 'clamp(1.25rem, 2.5vw, 1.75rem)' 
                      }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Summoning the Spirits...
                    </span>
                  ) : (
                    'Raise the Dead ⚡'
                  )}
                </button>
              </div>
              <p style={{ 
                marginTop: '1.25rem', 
                fontSize: 'clamp(0.875rem, 1.9vw, 1.05rem)', 
                color: 'rgb(196, 181, 253)', 
                fontWeight: 600, 
                textAlign: 'center' 
              }}>
                🪦 Enter a GitHub repository URL to resurrect your legacy code 🪦
              </p>
            </div>
          </form>

          {/* Quick Links */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center', 
            gap: 'clamp(1rem, 2vw, 1.5rem)' 
          }}>
            <a href="/features" className="btn-secondary" style={{ 
              fontSize: 'clamp(0.95rem, 1.9vw, 1.15rem)', 
              padding: 'clamp(0.7rem, 1.8vw, 0.95rem) clamp(1.4rem, 2.8vw, 1.9rem)',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              View Features ✨
            </a>
            <a href="/how-it-works" className="btn-secondary" style={{ 
              fontSize: 'clamp(0.95rem, 1.9vw, 1.15rem)', 
              padding: 'clamp(0.7rem, 1.8vw, 0.95rem) clamp(1.4rem, 2.8vw, 1.9rem)',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              How It Works 🔮
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
