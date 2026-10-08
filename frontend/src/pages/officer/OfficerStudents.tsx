import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStudents } from '../../api/officer';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';

const OfficerStudents: React.FC = () => {
  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ['allStudents'],
    queryFn: async () => (await getStudents()).data.data,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load students" />;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>Student Database</h1>
        <p style={{ color: 'var(--muted)', marginTop: '4px' }}>Overview of all registered students and their status.</p>
      </header>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Branch</th>
              <th>CGPA</th>
              <th>Skills</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td style={{ fontWeight: 500 }}>{student.name}</td>
                <td>{student.branch}</td>
                <td>{student.cgpa}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {student.skills?.slice(0, 3).map((s: string) => <span key={s} className="badge badge-blue">{s}</span>)}
                  </div>
                </td>
                <td>
                  <span className={`badge ${student.is_placed ? 'badge-green' : 'badge-blue'}`}>
                    {student.is_placed ? 'Placed' : 'Active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OfficerStudents;
