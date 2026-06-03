import React from 'react';

// SOLID-SRP: Only renders an AI match score bar — nothing else
interface AIScoreBarProps {
  score: number;
  reason: string;
}

const AIScoreBar: React.FC<AIScoreBarProps> = ({ score, reason }) => {
  const getBarColor = (s: number) => {
    if (s > 0.8) return 'var(--success)';
    if (s > 0.6) return 'var(--warning)';
    return 'var(--danger)';
  };

  const percentage = Math.round(score * 100);

  return (
    <div style={{ margin: '12px 0' }}>
      <div style={{
        height: '8px',
        width: '100%',
        backgroundColor: 'var(--border)',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '4px'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: getBarColor(score),
          transition: 'width 0.5s ease-out'
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
          {percentage}% match
        </span>
      </div>
      <p style={{
        color: 'var(--muted)',
        fontSize: '0.75rem',
        margin: '4px 0 0 0',
        fontStyle: 'italic'
      }}>
        {reason}
      </p>
    </div>
  );
};

export default AIScoreBar;
