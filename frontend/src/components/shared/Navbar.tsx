import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types/api';

// Every page a role can reach. Pages that need an id (e.g. a job's
// applicants) are reached from their parent page instead.
const NAV_LINKS: Record<Role, { to: string; label: string }[]> = {
  student: [
    { to: '/student', label: 'Dashboard' },
    { to: '/student/jobs', label: 'Jobs' },
    { to: '/student/applications', label: 'Applications' },
    { to: '/student/interviews', label: 'Interviews' },
  ],
  recruiter: [{ to: '/recruiter', label: 'My Jobs' }],
  placement_officer: [
    { to: '/officer', label: 'Dashboard' },
    { to: '/officer/students', label: 'Students' },
  ],
  admin: [{ to: '/admin', label: 'Dashboard' }],
};

const HOME: Record<Role, string> = {
  student: '/student',
  recruiter: '/recruiter',
  placement_officer: '/officer',
  admin: '/admin',
};

const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  padding: '6px 12px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: isActive ? 600 : 500,
  color: isActive ? 'var(--primary)' : 'var(--muted)',
  background: isActive ? 'var(--primary-light)' : 'transparent',
});

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBadgeClass = (role: string) => {
    switch (role) {
      case 'student': return 'badge-blue';
      case 'recruiter': return 'badge-purple';
      case 'placement_officer': return 'badge-teal';
      case 'admin': return 'badge-coral';
      default: return 'badge-blue';
    }
  };

  if (!user) return null;

  return (
    <nav className="navbar" style={{
      backgroundColor: 'white',
      borderBottom: '1px solid var(--border)',
      padding: '12px 24px',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <Link to={HOME[user.role]} style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.25rem', textDecoration: 'none' }}>
          PlacementAI
        </Link>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }} aria-label="Main navigation">
          {NAV_LINKS[user.role].map((link) => (
            // `end` keeps "Dashboard" (/student) from staying active on /student/jobs
            <NavLink key={link.to} to={link.to} end style={linkStyle}>
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontWeight: 500 }}>{user.name}</span>
        <span className={`badge ${getBadgeClass(user.role)}`}>
          {user.role.replace('_', ' ')}
        </span>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
