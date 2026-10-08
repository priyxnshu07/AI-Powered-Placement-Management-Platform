import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { applyToJob } from '../../api/student';
import AIScoreBar from '../shared/AIScoreBar';
import StatusBadge from '../shared/StatusBadge';

interface JobMatchCardProps {
  job: {
    id: number;
    title: string;
    company_name: string;
    salary_lpa: number;
    deadline: string;
    required_skills: string[];
    ai_match_score?: number;
    ai_match_reason?: string;
  };
  isApplied: boolean;
}

const JobMatchCard: React.FC<JobMatchCardProps> = ({ job, isApplied }) => {
  const queryClient = useQueryClient();
  const [success, setSuccess] = React.useState(false);

  const mutation = useMutation<unknown, AxiosError<{ error?: string }>, number>({
    mutationFn: (id: number) => applyToJob(id),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['studentApplications'] });
      queryClient.invalidateQueries({ queryKey: ['eligibleJobs'] });
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      // 409 = already applied (e.g. from another tab): refresh so the button reflects it.
      if (err.response?.status === 409) {
        queryClient.invalidateQueries({ queryKey: ['studentApplications'] });
      }
    },
  });

  const errorMessage = mutation.isError
    ? mutation.error.response?.data?.error || 'Could not apply. Please try again.'
    : null;

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{job.title}</h3>
        {isApplied && <StatusBadge status="applied" />}
      </div>
      
      <p style={{ color: 'var(--muted)', margin: '0 0 12px 0', fontSize: '0.9rem' }}>
        {job.company_name}
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {job.required_skills.map(skill => (
          <span key={skill} className="badge badge-blue">{skill}</span>
        ))}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: '0.875rem', marginBottom: '12px' }}>
          <strong>LPA:</strong> ₹{job.salary_lpa} | <strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}
        </div>

        {job.ai_match_score !== undefined && (
          <AIScoreBar score={job.ai_match_score} reason={job.ai_match_reason || ''} />
        )}

        {success ? (
          <div style={{ color: 'var(--success)', fontSize: '0.875rem', textAlign: 'center', marginTop: '12px' }}>
            ✓ Applied successfully!
          </div>
        ) : (
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '12px' }}
            disabled={isApplied || mutation.isPending}
            onClick={() => mutation.mutate(job.id)}
          >
            {mutation.isPending ? 'Applying...' : isApplied ? 'Already Applied' : 'Apply Now'}
          </button>
        )}

        {errorMessage && (
          <div role="alert" style={{ color: 'var(--danger, #dc2626)', fontSize: '0.875rem', textAlign: 'center', marginTop: '8px' }}>
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobMatchCard;
