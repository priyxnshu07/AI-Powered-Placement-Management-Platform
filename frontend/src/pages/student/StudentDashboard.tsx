import React from 'react';
import { useStudentDashboard } from '../../hooks/useStudentDashboard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import StatusBadge from '../../components/shared/StatusBadge';
import AIScoreBar from '../../components/shared/AIScoreBar';
import { Link } from 'react-router-dom';

/**
 * SOLID-ISP: Interface Segregation - Contains only UI logic for the student dashboard.
 * SOLID-SRP: Single Responsibility - Responsibility is rendering the layout; data fetching is delegated to useStudentDashboard.
 */
const StudentDashboard: React.FC = () => {
  const { profile, applications, interviews, isLoading, error } = useStudentDashboard();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load dashboard data" />;

  const stats = {
    applied: applications.length,
    shortlisted: applications.filter((a: any) => a.status === 'shortlisted').length,
    interviews: interviews.length
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>Hello, {profile?.name}</h1>
        <p style={{ color: 'var(--muted)', marginTop: '4px' }}>
          {profile?.branch} | CGPA: {profile?.cgpa}
        </p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '24px',
        marginBottom: '40px' 
      }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.applied}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Applied</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{stats.shortlisted}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Shortlisted</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.interviews}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Interviews</div>
        </div>
      </div>

      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Recent Applications</h2>
          <Link to="/student/applications" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Status</th>
                <th>Match Score</th>
              </tr>
            </thead>
            <tbody>
              {applications.slice(0, 5).map((app: any) => (
                <tr key={app.id}>
                  <td>{app.title}</td>
                  <td>{app.company_name}</td>
                  <td><StatusBadge status={app.status} /></td>
                  <td style={{ width: '200px' }}>
                    <AIScoreBar score={app.ai_match_score} reason={app.ai_match_reason} />
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                    No applications yet. <Link to="/student/jobs">Find a job</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Upcoming Interviews</h2>
          <Link to="/student/interviews" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {interviews.slice(0, 3).map((interview: any) => (
            <div key={interview.id} className="card">
              <h3 style={{ margin: 0 }}>{interview.title}</h3>
              <p style={{ color: 'var(--muted)', margin: '4px 0 12px 0' }}>{interview.company_name}</p>
              <div style={{ fontSize: '0.875rem' }}>
                📅 {new Date(interview.scheduled_at).toLocaleString()}
              </div>
              <div style={{ marginTop: '12px' }}>
                <span className="badge badge-purple">{interview.mode}</span>
              </div>
            </div>
          ))}
          {interviews.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '32px', gridColumn: '1 / -1', color: 'var(--muted)' }}>
              No interviews scheduled yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
