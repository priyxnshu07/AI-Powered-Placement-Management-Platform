import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInterviews } from '../../api/student';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';

const StudentInterviews: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['studentInterviews'],
    queryFn: async () => (await getInterviews()).data.data,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load interviews" />;

  const interviews = data || [];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>My Interviews</h1>
        <p style={{ color: 'var(--muted)', marginTop: '4px' }}>Upcoming scheduled interviews.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {interviews.map((interview) => (
          <div key={interview.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0 }}>{interview.title}</h3>
                <p style={{ color: 'var(--muted)', margin: '4px 0 16px 0' }}>{interview.company_name}</p>
              </div>
              <span className="badge badge-purple">{interview.mode}</span>
            </div>

            <div style={{ display: 'grid', gap: '8px', fontSize: '0.875rem' }}>
              <div>📅 <strong>Date:</strong> {new Date(interview.scheduled_at).toLocaleDateString()}</div>
              <div>🕒 <strong>Time:</strong> {new Date(interview.scheduled_at).toLocaleTimeString()}</div>
              {interview.meeting_link && (
                <div style={{ marginTop: '12px' }}>
                  <a 
                    href={interview.meeting_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', width: 'auto' }}
                  >
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}

        {interviews.length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '80px 0',
            color: 'var(--muted)' 
          }}>
            <h3>No interviews scheduled yet.</h3>
            <p>Keep applying! Recruiter shortlists will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentInterviews;
