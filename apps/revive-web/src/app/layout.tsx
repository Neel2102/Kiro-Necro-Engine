import type { Metadata } from 'next';
import { Inter, Roboto_Mono, Crimson_Pro } from 'next/font/google';
import './globals.css';

// Define fonts
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-crimson-pro',
});

export const metadata: Metadata = {
  title: 'Revive - AI-Powered Code Modernization',
  description: 'Breathe new life into legacy codebases with AI-driven modernization',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${robotoMono.variable} ${crimsonPro.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-gradient-to-b from-background-start to-background-end text-foreground">
        <div className="min-h-screen flex flex-col">
          {/* 🎃 SPOOKY HEADER - FIXED CENTERING 🎃 */}
          <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'linear-gradient(to right, rgb(59, 7, 100), rgb(0, 0, 0), rgb(59, 7, 100))',
            backdropFilter: 'blur(12px)',
            borderBottom: '2px solid rgb(234, 88, 12)',
            boxShadow: '0 10px 15px -3px rgba(88, 28, 135, 0.5)'
          }}>
            <div style={{
              maxWidth: '1100px',
              margin: '0 auto',
              padding: '1rem 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              {/* Decorative cobwebs */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                fontSize: '1.5rem',
                opacity: 0.2,
                pointerEvents: 'none'
              }}>🕸️</div>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                fontSize: '1.5rem',
                opacity: 0.2,
                pointerEvents: 'none'
              }}>🕸️</div>
              
              {/* Logo */}
              <a href="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                position: 'relative',
                zIndex: 10,
                textDecoration: 'none'
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(to bottom right, rgb(249, 115, 22), rgb(234, 88, 12))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgb(147, 51, 234)',
                  boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.5)'
                }}>
                  <span style={{ fontSize: '1.875rem' }}>🎃</span>
                </div>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  background: 'linear-gradient(to right, rgb(249, 115, 22), rgb(168, 85, 247), rgb(249, 115, 22))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Revive
                </h1>
                <span style={{ fontSize: '1.25rem' }} className="animate-float-ghost">👻</span>
              </a>
              
              {/* Navigation */}
              <nav style={{ position: 'relative', zIndex: 10 }}>
                <ul style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  listStyle: 'none',
                  margin: 0,
                  padding: 0
                }}>
                  <li>
                    <a href="/" className="nav-link" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      textDecoration: 'none',
                      color: 'rgb(251, 146, 60)',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>🏠</span>
                      <span className="hidden sm:inline">Home</span>
                    </a>
                  </li>
                  <li>
                    <a href="/features" className="nav-link" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      textDecoration: 'none',
                      color: 'rgb(251, 146, 60)',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>✨</span>
                      <span className="hidden sm:inline">Features</span>
                    </a>
                  </li>
                  <li>
                    <a href="/how-it-works" className="nav-link" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      textDecoration: 'none',
                      color: 'rgb(251, 146, 60)',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>🔮</span>
                      <span className="hidden md:inline">How It Works</span>
                    </a>
                  </li>
                  <li>
                    <a href="/pr-view" className="nav-link" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      textDecoration: 'none',
                      color: 'rgb(251, 146, 60)',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>📜</span>
                      <span className="hidden md:inline">PR View</span>
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>

          {/* 🦇 SPOOKY FOOTER - FIXED CENTERING 🦇 */}
          <footer style={{
            background: 'linear-gradient(to right, rgb(0, 0, 0), rgb(59, 7, 100), rgb(0, 0, 0))',
            borderTop: '2px solid rgb(234, 88, 12)',
            padding: '2rem 0',
            position: 'relative',
            overflow: 'hidden',
            marginTop: 'auto'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.1,
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                left: '2.5rem',
                fontSize: '1.875rem'
              }} className="animate-float-bat">🦇</div>
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '2.5rem',
                fontSize: '1.875rem',
                animationDelay: '1s'
              }} className="animate-float-bat">🦇</div>
              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                left: '25%',
                fontSize: '1.5rem'
              }}>🪦</div>
              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                right: '25%',
                fontSize: '1.5rem'
              }}>🪦</div>
            </div>
            <div style={{
              maxWidth: '1100px',
              margin: '0 auto',
              padding: '0 2rem',
              textAlign: 'center',
              position: 'relative',
              zIndex: 10
            }}>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'rgb(251, 146, 60)'
              }}>
                © {new Date().getFullYear()} Necro-Engine 🎃 All rights reserved.
              </p>
              <p style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: 'rgb(196, 181, 253)'
              }} className="animate-flicker">
                👻 Breathe new life into your legacy code 👻
              </p>
              <p style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: 'rgb(234, 88, 12)'
              }}>
                🕸️ Happy Halloween! 🕸️
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
