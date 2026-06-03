import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApplicants, updateStatus, scheduleInterview } from '../../api/recruiter';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import AIScoreBar from '../../components/shared/AIScoreBar';
import StatusBadge from '../../components/shared/StatusBadge';

const RecruiterApplicants: React.FC = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [schedulingId, setSchedulingId] = useState<number | null>(null);
  const [interviewData, setInterviewData] = useState({
    scheduled_at: '',
    mode: 'Online',
    meeting_link: ''
  });

  const { data: applicants, isLoading, error } = useQuery({
    queryKey: ['applicants', id],
    queryFn: async () => (await getApplicants(Number(id))).data.data,
  });

  const statusMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: number, status: string }) => updateStatus(appId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicants', id] })
  });

  const interviewMutation = useMutation({
    mutationFn: (data: any) => scheduleInterview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants', id] });
      setSchedulingId(null);
      alert('Interview scheduled successfully!');
    }
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load applicants" />;

  const handleSchedule = (appId: number) => {
    interviewMutation.mutate({ ...interviewData, application_id: appId });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <Link to="/recruiter" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Jobs</Link>
        <h1 style={{ margin: '8px 0 0 0' }}>Applicants</h1>
      </header>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Branch / CGPA</th>
              <th>Skills</th>
              <th style={{ width: '200px' }}>AI Match</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((app: any) => (
              <React.Fragment key={app.id}>
                <tr>
                  <td>{app.student_name}</td>
                  <td style={{ fontSize: '0.875rem' }}>{app.branch} | {app.cgpa}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {app.skills?.slice(0, 2).map((s: string) => <span key={s} className="badge badge-blue">{s}</span>)}
                    </div>
                  </td>
                  <td>
                    <AIScoreBar score={app.ai_match_score} reason={app.ai_match_reason} />
                  </td>
                  <td><StatusBadge status={app.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select 
                        className="input" 
                        style={{ padding: '4px', margin: 0, fontSize: '0.75rem', width: 'auto' }}
                        value={app.status}
                        onChange={(e) => statusMutation.mutate({ appId: app.id, status: e.target.value })}
                      >
                        <option value="applied">Applied</option>
                        <option value="shortlisted">Shortlist</option>
                        <option value="interview_scheduled">Interview</option>
                        <option value="offered">Offer</option>
                        <option value="rejected">Reject</option>
                      </select>
                      {app.status === 'shortlisted' && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSchedulingId(schedulingId === app.id ? null : app.id)}
                        >
                          {schedulingId === app.id ? 'Cancel' : 'Schedule'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {schedulingId === app.id && (
                  <tr>
                    <td colSpan={6} style={{ backgroundColor: '#F9FAFB', padding: '16px' }}>
                      <div className="card" style={{ margin: 0 }}>
                        <h4>Schedule Interview for {app.student_name}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
                          <div>
                            <label>Date & Time</label>
                            <input type="datetime-local" value={interviewData.scheduled_at} onChange={e => setInterviewData({...interviewData, scheduled_at: e.target.value})} />
                          </div>
                          <div>
                            <label>Mode</label>
                            <select value={interviewData.mode} onChange={e => setInterviewData({...interviewData, mode: e.target.value})}>
                              <option value="Online">Online</option>
                              <option value="Offline">Offline</option>
                            </select>
                          </div>
                          <div>
                            <label>Meeting Link / Location</label>
                            <input type="text" placeholder="https://zoom.us/..." value={interviewData.meeting_link} onChange={e => setInterviewData({...interviewData, meeting_link: e.target.value})} />
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ marginTop: '16px' }}
                          onClick={() => handleSchedule(app.id)}
                          disabled={interviewMutation.isPending}
                        >
                          {interviewMutation.isPending ? 'Saving...' : 'Confirm Schedule'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecruiterApplicants;
