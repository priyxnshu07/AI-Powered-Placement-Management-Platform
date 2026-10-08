import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

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
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.25rem' }}>
        PlacementAI
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
