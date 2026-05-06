import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { format } from 'date-fns';
import {
  FolderKanban,
  CheckSquare,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="page-header-content">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Loading...</p>
            </div>
          </div>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1 className="page-title">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="page-subtitle">
              Here's an overview of your team's progress
            </p>
          </div>
          {isAdmin && (
            <Link to="/projects" className="btn btn-primary">
              <FolderKanban size={16} />
              New Project
            </Link>
          )}
        </div>
      </div>

      <div className="page-content slide-up">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">
              <FolderKanban size={24} />
            </div>
            <div>
              <div className="stat-value">{stats?.totalProjects || 0}</div>
              <div className="stat-label">Total Projects</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <CheckSquare size={24} />
            </div>
            <div>
              <div className="stat-value">{stats?.totalTasks || 0}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="stat-value">{stats?.completionRate || 0}%</div>
              <div className="stat-label">Completion Rate</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="stat-value">
                {stats?.overdueTasks?.length || 0}
              </div>
              <div className="stat-label">Overdue Tasks</div>
            </div>
          </div>
        </div>

        {/* Task Status Breakdown */}
        <div className="dashboard-grid">
          {/* Task Distribution */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Task Distribution</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>To Do</span>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{stats?.tasksByStatus?.todo || 0}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${stats?.totalTasks ? (stats.tasksByStatus.todo / stats.totalTasks) * 100 : 0}%`,
                      background: 'var(--status-todo)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>In Progress</span>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{stats?.tasksByStatus?.inProgress || 0}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${stats?.totalTasks ? (stats.tasksByStatus.inProgress / stats.totalTasks) * 100 : 0}%`,
                      background: 'var(--status-progress)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Done</span>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{stats?.tasksByStatus?.done || 0}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${stats?.totalTasks ? (stats.tasksByStatus.done / stats.totalTasks) * 100 : 0}%`,
                      background: 'var(--status-done)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Tasks</h3>
              <Link to="/projects" style={{ fontSize: '13px', color: 'var(--accent-primary-hover)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats?.recentTasks?.length > 0 ? (
                stats.recentTasks.map((task) => (
                  <div
                    key={task._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--bg-glass)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {task.project?.name}
                      </div>
                    </div>
                    <span className={`badge badge-status-${task.status}`}>
                      {task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <CheckSquare />
                  <p>No tasks yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        {stats?.overdueTasks?.length > 0 && (
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <AlertTriangle size={18} />
                Overdue Tasks
              </h3>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.overdueTasks.map((task) => (
                    <tr key={task._id}>
                      <td style={{ fontWeight: '600' }}>{task.title}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: task.project?.color || 'var(--accent-primary)',
                            }}
                          />
                          {task.project?.name}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {task.assignee?.name || 'Unassigned'}
                      </td>
                      <td style={{ color: 'var(--danger)' }}>
                        <Clock size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                      </td>
                      <td>
                        <span className={`badge badge-priority-${task.priority}`}>
                          {task.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
