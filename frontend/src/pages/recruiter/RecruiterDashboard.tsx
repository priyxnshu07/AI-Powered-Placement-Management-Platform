import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobs, createJob } from '../../api/recruiter';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import { Link } from 'react-router-dom';

const RecruiterDashboard: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_skills: '',
    min_cgpa: 7.0,
    salary_lpa: 5.0,
    deadline: ''
  });

  const queryClient = useQueryClient();
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['recruiterJobs'],
    queryFn: async () => (await getJobs()).data.data,
  });

  const createJobMutation = useMutation({
    mutationFn: (data: any) => createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] });
      setShowForm(false);
      setFormData({ title: '', description: '', required_skills: '', min_cgpa: 7.0, salary_lpa: 5.0, deadline: '' });
    }
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load jobs" />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = formData.required_skills.split(',').map(s => s.trim()).filter(s => s);
    createJobMutation.mutate({ ...formData, required_skills: skillsArray });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>Recruiter Dashboard</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Post New Job'}
        </button>
      </header>

      {showForm && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <h3>Post a New Job Listing</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label>Job Title</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label>Min CGPA</label>
                <input type="number" step="0.1" required value={formData.min_cgpa} onChange={e => setFormData({...formData, min_cgpa: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label>Salary (LPA)</label>
                <input type="number" step="0.1" required value={formData.salary_lpa} onChange={e => setFormData({...formData, salary_lpa: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label>Deadline</label>
                <input type="date" required value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
              </div>
            </div>
            <label>Required Skills (comma separated)</label>
            <input placeholder="Python, React, SQL" required value={formData.required_skills} onChange={e => setFormData({...formData, required_skills: e.target.value})} />
            <label>Description</label>
            <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            <button className="btn btn-primary" style={{ marginTop: '16px' }} disabled={createJobMutation.isPending}>
              {createJobMutation.isPending ? 'Posting...' : 'Create Listing'}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Skills</th>
              <th>Min CGPA</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job: any) => (
              <tr key={job.id}>
                <td style={{ fontWeight: 500 }}>{job.title}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {job.required_skills.slice(0, 3).map((s: string) => <span key={s} className="badge badge-blue">{s}</span>)}
                    {job.required_skills.length > 3 && <span>...</span>}
                  </div>
                </td>
                <td>{job.min_cgpa}</td>
                <td>{new Date(job.deadline).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${job.is_active ? 'badge-green' : 'badge-red'}`}>
                    {job.is_active ? 'Active' : 'Closed'}
                  </span>
                </td>
                <td>
                  <Link to={`/recruiter/jobs/${job.id}/applicants`} className="btn btn-secondary btn-sm">
                    View Applicants
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
