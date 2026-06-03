import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeClass = (s: string) => {
    switch (s.toLowerCase()) {
      case 'applied': return 'badge-blue';
      case 'shortlisted': return 'badge-warning';
      case 'interview_scheduled': return 'badge-purple';
      case 'offered':
      case 'active': return 'badge-green';
      case 'rejected': return 'badge-red';
      case 'pending': return 'badge-warning';
      default: return 'badge-blue';
    }
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
