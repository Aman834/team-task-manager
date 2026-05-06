import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../services/api';
import {
  FolderKanban,
  Plus,
  X,
  Users,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
  '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
];

const Projects = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.getAll();
      setProjects(res.data.data);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    setSaving(true);
    try {
      await projectsAPI.create(form);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '', color: '#6366f1' });
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} />
              New Project
            </button>
          )}
        </div>
      </div>

      <div className="page-content slide-up">
        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : projects.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 20px' }}>
            <FolderKanban size={56} />
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div
                key={project._id}
                className="project-card"
                onClick={() => navigate(`/projects/${project._id}`)}
                style={{ '--card-color': project.color || '#6366f1' }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: project.color || '#6366f1',
                }} />
                <div className="project-card-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3>{project.name}</h3>
                  </div>
                  <div
                    className="project-color-dot"
                    style={{ background: project.color || '#6366f1' }}
                  />
                </div>
                <p>{project.description || 'No description'}</p>

                <div className="project-members">
                  {project.members?.slice(0, 4).map((m) => (
                    <div key={m._id} className="project-member-avatar" title={m.name}>
                      {getInitials(m.name)}
                    </div>
                  ))}
                  {project.members?.length > 4 && (
                    <div className="project-member-avatar" style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)', border: '2px solid var(--border-color)' }}>
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>

                <div className="project-stats">
                  <div className="project-stat">
                    <CheckSquare size={13} />
                    <strong>{project.taskStats?.total || 0}</strong> tasks
                  </div>
                  <div className="project-stat">
                    <Users size={13} />
                    <strong>{project.members?.length || 0}</strong> members
                  </div>
                  {project.taskStats?.overdue > 0 && (
                    <div className="project-stat" style={{ color: 'var(--danger)' }}>
                      <AlertTriangle size={13} />
                      <strong>{project.taskStats.overdue}</strong> overdue
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Project</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  className="form-input"
                  placeholder="Enter project name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  placeholder="Brief description..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: c, border: form.color === c ? '2px solid white' : '2px solid transparent',
                        cursor: 'pointer', transition: 'transform 0.15s',
                        transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Projects;
