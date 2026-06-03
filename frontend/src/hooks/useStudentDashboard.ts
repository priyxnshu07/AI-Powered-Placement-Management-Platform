import { useQuery } from '@tanstack/react-query';
import { getProfile, getApplications, getInterviews } from '../api/student';

export const useStudentDashboard = () => {
  const profileQuery = useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => (await getProfile()).data.data,
  });

  const applicationsQuery = useQuery({
    queryKey: ['studentApplications'],
    queryFn: async () => (await getApplications()).data.data,
  });

  const interviewsQuery = useQuery({
    queryKey: ['studentInterviews'],
    queryFn: async () => (await getInterviews()).data.data,
  });

  const isLoading = profileQuery.isLoading || applicationsQuery.isLoading || interviewsQuery.isLoading;
  const error = profileQuery.error || applicationsQuery.error || interviewsQuery.error;

  return {
    profile: profileQuery.data,
    applications: applicationsQuery.data || [],
    interviews: interviewsQuery.data || [],
    isLoading,
    error,
  };
};
