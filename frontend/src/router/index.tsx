import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import Navbar from '../components/shared/Navbar';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentJobs from '../pages/student/StudentJobs';
import StudentApplications from '../pages/student/StudentApplications';
import StudentInterviews from '../pages/student/StudentInterviews';

// Recruiter Pages
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import RecruiterApplicants from '../pages/recruiter/RecruiterApplicants';

// Officer Pages
import OfficerDashboard from '../pages/officer/OfficerDashboard';
import OfficerStudents from '../pages/officer/OfficerStudents';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!token) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

const RoleRoute: React.FC<{ children: React.ReactNode, role: string }> = ({ children, role }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user || user.role !== role) return <Navigate to="/" />;

  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  const { user } = useAuth();

  const getHomeRedirect = () => {
    if (!user) return "/login";
    switch (user.role) {
      case 'student': return "/student";
      case 'recruiter': return "/recruiter";
      case 'placement_officer': return "/officer";
      case 'admin': return "/admin";
      default: return "/login";
    }
  };

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to={getHomeRedirect()} />} />
        <Route path="/login" element={<Login />} />
        
        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute>
            <RoleRoute role="student"><StudentDashboard /></RoleRoute>
          </ProtectedRoute>
        } />
        <Route path="/student/jobs" element={
          <ProtectedRoute>
            <RoleRoute role="student"><StudentJobs /></RoleRoute>
          </ProtectedRoute>
        } />
        <Route path="/student/applications" element={
          <ProtectedRoute>
            <RoleRoute role="student"><StudentApplications /></RoleRoute>
          </ProtectedRoute>
        } />
        <Route path="/student/interviews" element={
          <ProtectedRoute>
            <RoleRoute role="student"><StudentInterviews /></RoleRoute>
          </ProtectedRoute>
        } />

        {/* Recruiter Routes */}
        <Route path="/recruiter" element={
          <ProtectedRoute>
            <RoleRoute role="recruiter"><RecruiterDashboard /></RoleRoute>
          </ProtectedRoute>
        } />
        <Route path="/recruiter/jobs/:id/applicants" element={
          <ProtectedRoute>
            <RoleRoute role="recruiter"><RecruiterApplicants /></RoleRoute>
          </ProtectedRoute>
        } />

        {/* Officer Routes */}
        <Route path="/officer" element={
          <ProtectedRoute>
            <RoleRoute role="placement_officer"><OfficerDashboard /></RoleRoute>
          </ProtectedRoute>
        } />
        <Route path="/officer/students" element={
          <ProtectedRoute>
            <RoleRoute role="placement_officer"><OfficerStudents /></RoleRoute>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <RoleRoute role="admin"><AdminDashboard /></RoleRoute>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
