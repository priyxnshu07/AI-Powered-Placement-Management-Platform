import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="card" style={{
      backgroundColor: 'var(--danger-light)',
      borderColor: 'var(--danger)',
      color: 'var(--danger)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px'
    }}>
      <span style={{ fontSize: '1.25rem' }}>⚠️</span>
      <span style={{ fontWeight: 500 }}>{message}</span>
    </div>
  );
};

export default ErrorMessage;
