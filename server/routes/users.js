const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const router = express.Router();

router.use(protect);

// @route   GET /api/users
// @desc    Get all users (with pagination)
// @access  Admin only
router.get('/', authorize('admin'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  const { role } = req.query;

  const filter = {};
  if (role && ['admin', 'member'].includes(role)) {
    filter.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ name: 1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// @route   GET /api/users/search
// @desc    Search users by name or email
// @access  Private
router.get('/search', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    throw new ApiError(400, 'Search query must be at least 2 characters');
  }

  const users = await User.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ],
  })
    .select('-password')
    .limit(10);

  res.json({ success: true, data: users });
}));

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Admin only
router.get('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  res.json({ success: true, data: user });
}));

// @route   PUT /api/users/:id/role
// @desc    Update user role
// @access  Admin only
router.put('/:id/role', authorize('admin'), asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role || !['admin', 'member'].includes(role)) {
    throw new ApiError(400, 'Valid role is required (admin or member)');
  }

  // Prevent admin from changing their own role
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot change your own role');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.role = role;
  await user.save();

  res.json({ success: true, data: user });
}));

// @route   DELETE /api/users/:id
// @desc    Delete a user (and unassign their tasks)
// @access  Admin only
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Unassign tasks assigned to this user
  const Task = require('../models/Task');
  await Task.updateMany({ assignee: user._id }, { assignee: null });

  // Remove user from project members
  const Project = require('../models/Project');
  await Project.updateMany(
    { members: user._id },
    { $pull: { members: user._id } }
  );

  await User.findByIdAndDelete(user._id);

  res.json({ success: true, message: 'User deleted and tasks unassigned' });
}));

module.exports = router;
