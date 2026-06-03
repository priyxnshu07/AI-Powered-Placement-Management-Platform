import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, deleteUser, getAIConfig, updateAIConfig } from '../../api/admin';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';

const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });
  const [threshold, setThreshold] = useState(0.6);

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => (await getUsers()).data.data,
  });

  const { data: aiConfig, isLoading: aiLoading } = useQuery({
    queryKey: ['aiConfig'],
    queryFn: async () => {
      const res = await getAIConfig();
      setThreshold(res.data.data.confidenceThreshold);
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setNewUser({ name: '', email: '', password: '', role: 'student' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
  });

  const configMutation = useMutation({
    mutationFn: (val: number) => updateAIConfig({ threshold: val }),
    onSuccess: () => alert('AI configuration updated!')
  });

  if (usersLoading || aiLoading) return <LoadingSpinner />;
  if (usersError) return <ErrorMessage message="Failed to load admin data" />;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>System Administration</h1>
        <p style={{ color: 'var(--muted)', marginTop: '4px' }}>Global user management and AI configuration.</p>
      </header>

      <section style={{ marginBottom: '40px' }}>
        <h2>Add New User</h2>
        <div className="card">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newUser); }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div>
              <label>Name</label>
              <input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
            </div>
            <div>
              <label>Email</label>
              <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
            </div>
            <div>
              <label>Password</label>
              <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
            </div>
            <div>
              <label>Role</label>
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                <option value="student">Student</option>
                <option value="recruiter">Recruiter</option>
                <option value="placement_officer">Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button className="btn btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add User'}
            </button>
          </form>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>User Management</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>{user.name}</td>
                  <td>{user.email}</td>
                  <td><span className="badge badge-blue">{user.role}</span></td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => deleteMutation.mutate(user.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>AI Configuration</h2>
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div>
              <label>Confidence Threshold ({threshold})</label>
              <input 
                type="range" 
                min="0.5" 
                max="0.9" 
                step="0.05" 
                value={threshold} 
                onChange={e => setThreshold(parseFloat(e.target.value))} 
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '8px' }}>
                Matches below this threshold will use rule-based fallback.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => configMutation.mutate(threshold)}>
                Save Config
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
