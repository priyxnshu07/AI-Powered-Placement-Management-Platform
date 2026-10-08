// Shapes returned by the backend API. Keep in sync with backend/src/repositories.

export type Role = 'student' | 'recruiter' | 'placement_officer' | 'admin';

export type ApplicationStatus = 'applied' | 'shortlisted' | 'interview_scheduled' | 'offered' | 'rejected';

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  success: false;
  error: string;
  details?: { field: string; message: string }[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AdminUser extends User {
  is_active: boolean;
  created_at: string;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  name: string;
  email: string;
  branch: string | null;
  cgpa: number | null;
  skills: string[] | null;
  resume_text: string | null;
  year_of_passing: number | null;
  is_placed: boolean;
}

export interface Job {
  id: number;
  company_id: number;
  company_name?: string;
  title: string;
  description: string | null;
  required_skills: string[];
  min_cgpa: number;
  salary_lpa: number | null;
  deadline: string | null;
  is_active: boolean;
  created_at: string;
  // Not returned by GET /student/jobs yet: scores are computed only on apply.
  // The job list's "Best match" sort and score bar light up once it is.
  ai_match_score?: number | null;
  ai_match_reason?: string | null;
}

export interface Application {
  id: number;
  student_id: number;
  job_id: number;
  status: ApplicationStatus;
  ai_match_score: number | null;
  ai_match_reason: string | null;
  ai_provider: string | null;
  applied_at: string;
  // Joined columns, present depending on the endpoint
  title?: string;
  company_name?: string;
  student_name?: string;
}

export interface Applicant extends Application {
  student_name: string;
  branch: string | null;
  cgpa: number | null;
  skills: string[] | null;
}

export interface Interview {
  id: number;
  application_id: number;
  scheduled_at: string;
  mode: string;
  meeting_link: string | null;
  status: string;
  title: string;
  company_name: string;
}

export interface OfficerStudent {
  id: number;
  name: string;
  email: string;
  branch: string | null;
  cgpa: number | null;
  skills: string[] | null;
  is_placed: boolean | null;
}

export interface OfficerDashboard {
  totalStudents: number;
  placed: number;
  placementRate: string | number;
  avgPackage: string;
  // COUNT(*) comes back from Postgres as a string
  branchWiseStats: { branch: string | null; total: string; placed: string }[];
  topRecruiters: { name: string; offers: string }[];
}

export interface AIConfig {
  confidenceThreshold: number;
}

// Request payloads
export interface LoginPayload {
  email: string;
  password: string;
}

export interface ProfilePayload {
  branch: string;
  cgpa: number;
  skills: string[];
  resume_text?: string | null;
  year_of_passing?: number | null;
}

export interface CreateJobPayload {
  title: string;
  description?: string;
  required_skills: string[];
  min_cgpa: number;
  salary_lpa?: number;
  deadline?: string;
}

export interface ScheduleInterviewPayload {
  application_id: number;
  scheduled_at: string;
  mode: string;
  meeting_link?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}
