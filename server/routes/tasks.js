const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/tasks
// @desc    Get tasks (filter by project, status, assignee, priority) with pagination
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  const { project, status, assignee, priority, search, sortBy, order } = req.query;

  const filter = {};

  if (project) filter.project = project;
  if (status) filter.status = status;
  if (assignee) filter.assignee = assignee;
  if (priority) filter.priority = priority;

  // Search by title
  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }

  // If member, only show tasks from their projects
  if (req.user.role !== 'admin') {
    const userProjects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select('_id');
    const projectIds = userProjects.map((p) => p._id);
    filter.project = filter.project
      ? { $in: [filter.project].filter((id) => projectIds.includes(id)) }
      : { $in: projectIds };
  }

  // Build sort object
  const sortOptions = {};
  if (sortBy && ['title', 'status', 'priority', 'dueDate', 'createdAt'].includes(sortBy)) {
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
  } else {
    sortOptions.createdAt = -1;
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', 'name email role')
      .populate('createdBy', 'name email')
      .populate('project', 'name color')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: tasks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Admin only
router.post(
  '/',
  authorize('admin'),
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('project').notEmpty().withMessage('Project ID is required'),
    body('description').optional().trim(),
    body('assignee').optional(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional(),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { title, description, project, assignee, priority, dueDate, status } = req.body;

    // Verify project exists
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      throw new ApiError(404, 'Project not found');
    }

    // If assignee is specified, verify they are a member of the project
    if (assignee) {
      const isMember = projectDoc.members.some(
        (m) => m.toString() === assignee.toString()
      );
      if (!isMember) {
        throw new ApiError(400, 'Assignee must be a member of the project');
      }
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignee: assignee || null,
      createdBy: req.user._id,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      status: status || 'todo',
    });

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email role')
      .populate('createdBy', 'name email')
      .populate('project', 'name color');

    res.status(201).json({ success: true, data: populated });
  })
);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email role')
    .populate('createdBy', 'name email')
    .populate('project', 'name color');

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  res.json({ success: true, data: task });
}));

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Admin or Assignee
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('assignee').optional(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional(),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    // Check authorization: admin or assignee
    const isAssignee =
      task.assignee && task.assignee.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isAssignee) {
      throw new ApiError(403, 'Not authorized to update this task');
    }

    // Members can only update status
    if (req.user.role !== 'admin' && isAssignee) {
      if (req.body.status) task.status = req.body.status;
    } else {
      // Admin can update everything
      const { title, description, assignee, priority, dueDate, status } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignee !== undefined) task.assignee = assignee || null;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
      if (status) task.status = status;
    }

    await task.save();

    const updated = await Task.findById(task._id)
      .populate('assignee', 'name email role')
      .populate('createdBy', 'name email')
      .populate('project', 'name color');

    res.json({ success: true, data: updated });
  })
);

// @route   PATCH /api/tasks/:id/status
// @desc    Quick status update
// @access  Admin or Assignee
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status || !['todo', 'in-progress', 'done'].includes(status)) {
    throw new ApiError(400, 'Valid status is required (todo, in-progress, done)');
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const isAssignee =
    task.assignee && task.assignee.toString() === req.user._id.toString();
  if (req.user.role !== 'admin' && !isAssignee) {
    throw new ApiError(403, 'Not authorized to update this task');
  }

  task.status = status;
  await task.save();

  const updated = await Task.findById(task._id)
    .populate('assignee', 'name email role')
    .populate('createdBy', 'name email')
    .populate('project', 'name color');

  res.json({ success: true, data: updated });
}));

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Admin only
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await Task.findByIdAndDelete(task._id);
  res.json({ success: true, message: 'Task deleted' });
}));

module.exports = router;
