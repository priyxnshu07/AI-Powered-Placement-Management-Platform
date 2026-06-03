import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEligibleJobs, getApplications } from '../../api/student';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import JobMatchCard from '../../components/student/JobMatchCard';

const StudentJobs: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('match');

  const jobsQuery = useQuery({
    queryKey: ['eligibleJobs'],
    queryFn: async () => (await getEligibleJobs()).data.data,
  });

  const applicationsQuery = useQuery({
    queryKey: ['studentApplications'],
    queryFn: async () => (await getApplications()).data.data,
  });

  if (jobsQuery.isLoading || applicationsQuery.isLoading) return <LoadingSpinner />;
  if (jobsQuery.error) return <ErrorMessage message="Failed to load jobs" />;

  const jobs = jobsQuery.data || [];
  const appliedJobIds = new Set((applicationsQuery.data || []).map((a: any) => a.job_id));

  const filteredJobs = jobs
    .filter((job: any) => 
      job.title.toLowerCase().includes(filter.toLowerCase()) ||
      job.company_name.toLowerCase().includes(filter.toLowerCase()) ||
      job.required_skills.some((s: string) => s.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a: any, b: any) => {
      if (sortBy === 'salary') return b.salary_lpa - a.salary_lpa;
      if (sortBy === 'deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return (b.ai_match_score || 0) - (a.ai_match_score || 0);
    });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>Eligible Jobs</h1>
        <p style={{ color: 'var(--muted)', marginTop: '4px' }}>AI-matched opportunities based on your profile.</p>
      </header>

      <div className="card" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', padding: '16px' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <input 
            type="text" 
            placeholder="Search by title, company, or skill..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ margin: 0 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Sort By:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ margin: 0, width: 'auto' }}
          >
            <option value="match">Best Match</option>
            <option value="salary">Highest Salary</option>
            <option value="deadline">Closest Deadline</option>
          </select>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '24px' 
      }}>
        {filteredJobs.map((job: any) => (
          <JobMatchCard 
            key={job.id} 
            job={job} 
            isApplied={appliedJobIds.has(job.id)} 
          />
        ))}
        {filteredJobs.length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '80px 0',
            color: 'var(--muted)' 
          }}>
            <h3>No eligible jobs found.</h3>
            <p>Try adjusting your filters or update your profile to improve matches.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentJobs;
