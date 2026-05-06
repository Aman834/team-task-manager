const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/projects
// @desc    Get all projects for current user (with pagination)
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  const { status, search } = req.query;

  let filter = {};

  // Role-based filtering
  if (req.user.role !== 'admin') {
    filter.$or = [{ owner: req.user._id }, { members: req.user._id }];
  }

  // Status filter
  if (status && ['active', 'completed', 'archived'].includes(status)) {
    filter.status = status;
  }

  // Search by name
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'name email')
      .populate('members', 'name email role')
      .populate('taskCount')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filter),
  ]);

  // Get task stats for each project
  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      const tasks = await Task.find({ project: project._id });
      const todoCount = tasks.filter((t) => t.status === 'todo').length;
      const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
      const doneCount = tasks.filter((t) => t.status === 'done').length;
      const overdueCount = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
      ).length;

      return {
        ...project.toObject(),
        taskStats: {
          total: tasks.length,
          todo: todoCount,
          inProgress: inProgressCount,
          done: doneCount,
          overdue: overdueCount,
        },
      };
    })
  );

  res.json({
    success: true,
    data: projectsWithStats,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// @route   POST /api/projects
// @desc    Create a new project
// @access  Admin only
router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
    body('color').optional().trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { name, description, color } = req.body;

    const project = await Project.create({
      name,
      description,
      color,
      owner: req.user._id,
      members: [req.user._id],
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    res.status(201).json({ success: true, data: populated });
  })
);

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private (project members or admin)
router.get('/:id', asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('members', 'name email role');

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check access
  const isMember = project.members.some(
    (m) => m._id.toString() === req.user._id.toString()
  );
  const isOwner = project.owner._id.toString() === req.user._id.toString();

  if (!isMember && !isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to access this project');
  }

  res.json({ success: true, data: project });
}));

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Admin only
router.put(
  '/:id',
  authorize('admin'),
  [
    body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
    body('description').optional().trim(),
    body('status').optional().isIn(['active', 'completed', 'archived']),
    body('color').optional().trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const { name, description, status, color } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (color) project.color = color;

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    res.json({ success: true, data: updated });
  })
);

// @route   DELETE /api/projects/:id
// @desc    Delete project and all its tasks
// @access  Admin only
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Delete all tasks in this project
  await Task.deleteMany({ project: project._id });
  await Project.findByIdAndDelete(project._id);

  res.json({ success: true, message: 'Project and all tasks deleted' });
}));

// @route   POST /api/projects/:id/members
// @desc    Add member to project
// @access  Admin only
router.post('/:id/members', authorize('admin'), asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    throw new ApiError(400, 'userId is required');
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if already a member
  if (project.members.includes(userId)) {
    throw new ApiError(400, 'User is already a member of this project');
  }

  project.members.push(userId);
  await project.save();

  const updated = await Project.findById(project._id)
    .populate('owner', 'name email')
    .populate('members', 'name email role');

  res.json({ success: true, data: updated });
}));

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project
// @access  Admin only
router.delete('/:id/members/:userId', authorize('admin'), asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Can't remove the owner
  if (project.owner.toString() === req.params.userId) {
    throw new ApiError(400, 'Cannot remove the project owner');
  }

  project.members = project.members.filter(
    (m) => m.toString() !== req.params.userId
  );
  await project.save();

  const updated = await Project.findById(project._id)
    .populate('owner', 'name email')
    .populate('members', 'name email role');

  res.json({ success: true, data: updated });
}));

module.exports = router;
