import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { Users, Shield, User } from 'lucide-react';

const Team = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data.data);
    } catch (error) {
      console.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const admins = users.filter((u) => u.role === 'admin');
  const members = users.filter((u) => u.role === 'member');

  return (
    <>
      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1 className="page-title">Team</h1>
            <p className="page-subtitle">
              {users.length} team member{users.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="page-content slide-up">
        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : (
          <>
            {/* Admins */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Shield size={14} /> Admins ({admins.length})
              </h3>
              <div className="team-grid">
                {admins.map((u) => (
                  <div key={u._id} className="team-member-card">
                    <div className="team-avatar-lg">{getInitials(u.name)}</div>
                    <div className="team-member-info">
                      <div className="team-member-name">{u.name}</div>
                      <div className="team-member-email">{u.email}</div>
                    </div>
                    <span className="badge badge-role-admin">Admin</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Members */}
            <div>
              <h3 style={{
                fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <User size={14} /> Members ({members.length})
              </h3>
              {members.length > 0 ? (
                <div className="team-grid">
                  {members.map((u) => (
                    <div key={u._id} className="team-member-card">
                      <div className="team-avatar-lg">{getInitials(u.name)}</div>
                      <div className="team-member-info">
                        <div className="team-member-name">{u.name}</div>
                        <div className="team-member-email">{u.email}</div>
                      </div>
                      <span className="badge badge-role-member">Member</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '40px' }}>
                  <Users />
                  <h3>No members yet</h3>
                  <p>Members will appear here once they register</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Team;
