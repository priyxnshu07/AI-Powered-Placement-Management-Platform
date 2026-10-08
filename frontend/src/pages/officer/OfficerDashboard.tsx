import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboard, getApplications } from '../../api/officer';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import StatusBadge from '../../components/shared/StatusBadge';

const OfficerDashboard: React.FC = () => {
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useQuery({
    queryKey: ['officerDashboard'],
    queryFn: async () => (await getDashboard()).data.data,
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['allApplications'],
    queryFn: async () => (await getApplications()).data.data,
  });

  if (dashLoading || appsLoading) return <LoadingSpinner />;
  if (dashError || !dashboard) return <ErrorMessage message="Failed to load dashboard" />;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>Placement Officer Dashboard</h1>
        <p style={{ color: 'var(--muted)', marginTop: '4px' }}>Real-time institutional placement tracking.</p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '24px',
        marginBottom: '40px' 
      }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{dashboard.totalStudents}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Total Students</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{dashboard.placed}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Placed</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{dashboard.placementRate}%</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Placement Rate</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹{dashboard.avgPackage}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Avg Package (LPA)</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
        <section>
          <h2>Branch-wise Placement</h2>
          <div className="card">
            {dashboard.branchWiseStats.map((branch) => (
              <div key={branch.branch} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                  <span>{branch.branch}</span>
                  <span>{branch.placed}/{branch.total} placed</span>
                </div>
                <div style={{ height: '12px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Number(branch.total) > 0 ? (Number(branch.placed) / Number(branch.total)) * 100 : 0}%`, 
                    background: 'var(--success)',
                    borderRadius: '6px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Top Recruiters</h2>
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Offers Made</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.topRecruiters.map((rec) => (
                  <tr key={rec.name}>
                    <td>{rec.name}</td>
                    <td style={{ fontWeight: 600 }}>{rec.offers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section>
        <h2>Recent Applications</h2>
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Job</th>
                <th>Company</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {applications.slice(0, 10).map((app) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 500 }}>{app.student_name}</td>
                  <td>{app.title}</td>
                  <td>{app.company_name}</td>
                  <td><StatusBadge status={app.status} /></td>
                  <td style={{ fontSize: '0.875rem' }}>{new Date(app.applied_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default OfficerDashboard;
