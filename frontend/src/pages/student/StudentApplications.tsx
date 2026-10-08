import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApplications } from '../../api/student';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import StatusBadge from '../../components/shared/StatusBadge';
import AIScoreBar from '../../components/shared/AIScoreBar';

const StudentApplications: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['studentApplications'],
    queryFn: async () => (await getApplications()).data.data,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load applications" />;

  const applications = data || [];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>My Applications</h1>
        <p style={{ color: 'var(--muted)', marginTop: '4px' }}>Track the status of your job applications.</p>
      </header>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Company</th>
              <th>Applied Date</th>
              <th>AI Match</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <React.Fragment key={app.id}>
                <tr>
                  <td style={{ fontWeight: 500 }}>{app.title}</td>
                  <td>{app.company_name}</td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td style={{ width: '250px' }}>
                    <AIScoreBar score={app.ai_match_score ?? 0} reason={app.ai_match_reason ?? ''} />
                  </td>
                  <td><StatusBadge status={app.status} /></td>
                </tr>
              </React.Fragment>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
                  <h3>You haven't applied to any jobs yet.</h3>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentApplications;
