import { Issue } from '@/types/scan';

interface IssueCardProps {
  issue: Issue;
  isSelected: boolean;
  onToggle: () => void;
}

export default function IssueCard({ issue, isSelected, onToggle }: IssueCardProps) {
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return 'severity-info';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <div 
      style={{
        background: isSelected 
          ? 'linear-gradient(135deg, rgba(30, 30, 40, 0.98), rgba(50, 30, 60, 0.95))' 
          : 'linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(40, 25, 50, 0.92))',
        border: isSelected ? '3px solid rgb(249, 115, 22)' : '2px solid rgba(147, 51, 234, 0.5)',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: isSelected 
          ? '0 10px 40px rgba(249, 115, 22, 0.4), 0 0 30px rgba(249, 115, 22, 0.2)' 
          : '0 8px 30px rgba(88, 28, 135, 0.3)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={onToggle}
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
            checked={isSelected}
            onChange={() => {}}
            onClick={handleCheckboxClick}
            style={{
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: '0.5rem',
              border: '2px solid rgb(147, 51, 234)',
              backgroundColor: isSelected ? 'rgb(249, 115, 22)' : 'rgb(30, 30, 40)',
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
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '1.25rem'
          }}>
            <h3 style={{ 
              fontSize: 'clamp(1.1rem, 2.6vw, 1.5rem)',
              fontWeight: 700,
              color: 'rgb(253, 186, 116)',
              lineHeight: 1.3
            }}>
              {issue.title}
            </h3>
            <span className={getSeverityBadgeClass(issue.severity)} style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              display: 'inline-block',
              alignSelf: 'flex-start'
            }}>
              {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
            </span>
          </div>
          
          {/* Description - IMPROVED CONTRAST */}
          <p style={{ 
            color: 'rgb(229, 231, 235)',
            fontSize: 'clamp(0.95rem, 1.9vw, 1.1rem)',
            marginBottom: '1.25rem',
            lineHeight: 1.55
          }}>
            {issue.description}
          </p>
          
          {/* Confidence */}
          {issue.confidence && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '0.75rem'
            }}>
              <span style={{ 
                fontSize: '1rem',
                color: 'rgb(229, 231, 235)',
                fontWeight: 700
              }}>
                🔮 Confidence:
              </span>
              <span className={getConfidenceColor(issue.confidence)} style={{
                fontSize: '1.5rem',
                fontWeight: 900
              }}>
                {Math.round(issue.confidence * 100)}%
              </span>
              <div style={{ 
                flex: 1,
                height: '0.75rem',
                backgroundColor: 'rgb(55, 65, 81)',
                borderRadius: '9999px',
                overflow: 'hidden',
                border: '2px solid rgb(107, 114, 128)'
              }}>
                <div 
                  className={getConfidenceColor(issue.confidence).replace('text-', 'bg-')}
                  style={{ 
                    height: '100%',
                    width: `${Math.round(issue.confidence * 100)}%`,
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Affected Files */}
          {issue.affectedFiles && issue.affectedFiles.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ 
                fontSize: '1rem',
                fontWeight: 700,
                color: 'rgb(253, 186, 116)',
                marginBottom: '0.75rem'
              }}>
                📁 Affected Files:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {issue.affectedFiles.map((file, i) => (
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
          
          {/* Recommendations */}
          {issue.recommendations && issue.recommendations.length > 0 && (
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
                💡 Recommendations:
              </h4>
              <ul style={{ 
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {issue.recommendations.map((rec, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{ 
                      color: 'rgb(249, 115, 22)',
                      fontSize: '1.5rem',
                      marginTop: '0.125rem',
                      flexShrink: 0
                    }}>→</span>
                    <span style={{ 
                      color: 'rgb(229, 231, 235)',
                      fontSize: '1rem',
                      lineHeight: 1.5
                    }}>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
