const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.use(protect);

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  let projectFilter = {};
  let taskFilter = {};

  if (req.user.role !== 'admin') {
    const userProjects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select('_id');
    const projectIds = userProjects.map((p) => p._id);
    projectFilter = { _id: { $in: projectIds } };
    taskFilter = { project: { $in: projectIds } };
  }

  const [totalProjects, totalTasks, tasks, projects, totalUsers] = await Promise.all([
    Project.countDocuments(projectFilter),
    Task.countDocuments(taskFilter),
    Task.find(taskFilter)
      .populate('assignee', 'name email')
      .populate('project', 'name color'),
    Project.find(projectFilter).populate('members', 'name email role'),
    req.user.role === 'admin' ? User.countDocuments() : Promise.resolve(0),
  ]);

  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  );

  // Get unique team members count
  const memberSet = new Set();
  projects.forEach((p) => {
    p.members.forEach((m) => memberSet.add(m._id.toString()));
  });

  // Recent tasks (last 5)
  const recentTasks = tasks
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // My tasks (assigned to current user)
  const myTasks = tasks.filter(
    (t) => t.assignee && t.assignee._id.toString() === req.user._id.toString()
  );

  // Priority distribution
  const tasksByPriority = {
    high: tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low: tasks.filter((t) => t.priority === 'low').length,
  };

  // Project-wise completion
  const projectStats = await Promise.all(
    projects.map(async (project) => {
      const projectTasks = tasks.filter(
        (t) => t.project && t.project._id.toString() === project._id.toString()
      );
      const done = projectTasks.filter((t) => t.status === 'done').length;
      return {
        _id: project._id,
        name: project.name,
        color: project.color,
        totalTasks: projectTasks.length,
        completedTasks: done,
        completionRate: projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0,
      };
    })
  );

  res.json({
    success: true,
    data: {
      totalProjects,
      totalTasks,
      totalMembers: memberSet.size,
      totalUsers,
      tasksByStatus: {
        todo: todoTasks,
        inProgress: inProgressTasks,
        done: doneTasks,
      },
      tasksByPriority,
      overdueTasks: overdueTasks.map((t) => ({
        _id: t._id,
        title: t.title,
        dueDate: t.dueDate,
        status: t.status,
        priority: t.priority,
        project: t.project,
        assignee: t.assignee,
      })),
      recentTasks,
      myTasks: myTasks.length,
      completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      projectStats,
    },
  });
}));

module.exports = router;
