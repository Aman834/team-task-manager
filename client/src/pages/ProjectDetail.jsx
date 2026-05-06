import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI, tasksAPI, usersAPI } from '../services/api';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Plus,
  X,
  Trash2,
  Edit3,
  UserPlus,
  Calendar,
  CheckSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'medium',
    dueDate: '',
    status: 'todo',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        projectsAPI.getById(id),
        tasksAPI.getAll({ project: id }),
      ]);
      setProject(projectRes.data.data);
      setTasks(tasksRes.data.data);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setAllUsers(res.data.data);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...taskForm,
        project: id,
        assignee: taskForm.assignee || null,
        dueDate: taskForm.dueDate || null,
      };

      if (editingTask) {
        await tasksAPI.update(editingTask._id, data);
        toast.success('Task updated!');
      } else {
        await tasksAPI.create(data);
        toast.success('Task created!');
      }

      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({ title: '', description: '', assignee: '', priority: 'medium', dueDate: '', status: 'todo' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      toast.success('Status updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(taskId);
      toast.success('Task deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignee: task.assignee?._id || '',
      priority: task.priority,
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      status: task.status,
    });
    fetchUsers();
    setShowTaskModal(true);
  };

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', assignee: '', priority: 'medium', dueDate: '', status: 'todo' });
    fetchUsers();
    setShowTaskModal(true);
  };

  const handleAddMember = async (userId) => {
    try {
      await projectsAPI.addMember(id, userId);
      toast.success('Member added!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await projectsAPI.removeMember(id, userId);
      toast.success('Member removed');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const canUpdateTask = (task) => {
    return isAdmin || (task.assignee && task.assignee._id === user?._id);
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="page-header-content">
            <div><h1 className="page-title">Loading...</h1></div>
          </div>
        </div>
        <div className="loading-spinner"><div className="spinner"></div></div>
      </>
    );
  }

  const renderTaskCard = (task) => (
    <div key={task._id} className="task-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div className="task-card-title">{task.title}</div>
        {(isAdmin || canUpdateTask(task)) && (
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            {isAdmin && (
              <button
                className="btn-icon"
                style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}
                onClick={() => handleEditTask(task)}
                title="Edit"
              >
                <Edit3 size={13} />
              </button>
            )}
            {isAdmin && (
              <button
                className="btn-icon"
                style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}
                onClick={() => handleDeleteTask(task._id)}
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>
      {task.description && <div className="task-card-desc">{task.description}</div>}
      <div className="task-card-meta">
        <div className="task-card-footer">
          <span className={`badge badge-priority-${task.priority}`}>{task.priority}</span>
          {task.dueDate && (
            <span style={{
              fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px',
              color: new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'var(--danger)' : 'var(--text-muted)',
            }}>
              <Calendar size={11} />
              {format(new Date(task.dueDate), 'MMM dd')}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {task.assignee && (
            <div className="project-member-avatar" style={{ width: '24px', height: '24px', fontSize: '9px', marginLeft: 0 }} title={task.assignee.name}>
              {getInitials(task.assignee.name)}
            </div>
          )}
          {canUpdateTask(task) && (
            <select
              className="status-select"
              value={task.status}
              onChange={(e) => handleStatusChange(task._id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div className="page-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => navigate('/projects')}
              style={{ padding: '10px' }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: project?.color || '#6366f1' }} />
                <h1 className="page-title">{project?.name}</h1>
              </div>
              <p className="page-subtitle">{project?.description || 'No description'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isAdmin && (
              <>
                <button className="btn btn-secondary" onClick={() => { fetchUsers(); setShowMemberModal(true); }}>
                  <UserPlus size={16} />
                  Members
                </button>
                <button className="btn btn-primary" onClick={openCreateTask}>
                  <Plus size={16} />
                  Add Task
                </button>
                <button className="btn btn-danger btn-icon" onClick={handleDeleteProject} title="Delete Project" style={{ padding: '10px' }}>
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="page-content slide-up">
        {/* Members strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginRight: '4px' }}>Team:</span>
          {project?.members?.map((m) => (
            <div key={m._id} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '4px 12px 4px 4px', background: 'var(--bg-glass)',
              borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)',
            }}>
              <div className="project-member-avatar" style={{ width: '24px', height: '24px', fontSize: '9px', marginLeft: 0 }}>
                {getInitials(m.name)}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '500' }}>{m.name}</span>
              <span className={`badge badge-role-${m.role}`} style={{ fontSize: '10px', padding: '1px 6px' }}>{m.role}</span>
            </div>
          ))}
        </div>

        {/* Task Board */}
        <div className="task-board">
          <div className="task-column">
            <div className="task-column-header">
              <div className="task-column-title">
                <span className="column-dot" style={{ background: 'var(--status-todo)' }} />
                To Do
              </div>
              <span className="column-count">{todoTasks.length}</span>
            </div>
            {todoTasks.length > 0 ? todoTasks.map(renderTaskCard) : (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <CheckSquare />
                <p>No tasks</p>
              </div>
            )}
          </div>

          <div className="task-column">
            <div className="task-column-header">
              <div className="task-column-title">
                <span className="column-dot" style={{ background: 'var(--status-progress)' }} />
                In Progress
              </div>
              <span className="column-count">{inProgressTasks.length}</span>
            </div>
            {inProgressTasks.length > 0 ? inProgressTasks.map(renderTaskCard) : (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <CheckSquare />
                <p>No tasks</p>
              </div>
            )}
          </div>

          <div className="task-column">
            <div className="task-column-header">
              <div className="task-column-title">
                <span className="column-dot" style={{ background: 'var(--status-done)' }} />
                Done
              </div>
              <span className="column-count">{doneTasks.length}</span>
            </div>
            {doneTasks.length > 0 ? doneTasks.map(renderTaskCard) : (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <CheckSquare />
                <p>No tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  placeholder="Task description..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select
                    className="form-select"
                    value={taskForm.assignee}
                    onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {(project?.members || []).map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Manage Members</h3>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Current Members
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {project?.members?.map((m) => (
                  <div key={m._id} className="team-member-card" style={{ padding: '12px 16px' }}>
                    <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                      {getInitials(m.name)}
                    </div>
                    <div className="team-member-info" style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.email}</div>
                    </div>
                    <span className={`badge badge-role-${m.role}`}>{m.role}</span>
                    {m._id !== project?.owner?._id && isAdmin && (
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleRemoveMember(m._id)}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div>
                <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Add Members
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {allUsers
                    .filter((u) => !project?.members?.some((m) => m._id === u._id))
                    .map((u) => (
                      <div key={u._id} className="team-member-card" style={{ padding: '12px 16px' }}>
                        <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                          {getInitials(u.name)}
                        </div>
                        <div className="team-member-info" style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>{u.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => handleAddMember(u._id)}>
                          <UserPlus size={13} /> Add
                        </button>
                      </div>
                    ))}
                  {allUsers.filter((u) => !project?.members?.some((m) => m._id === u._id)).length === 0 && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                      All users are already members
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectDetail;
