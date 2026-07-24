import express from 'express';
const router = express.Router();
import User from '../models/user.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '' } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.json({ users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/block/:id', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status: newStatus } },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/make-admin/:id', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role: 'admin' } },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/apply-trainer', verifyToken, async (req, res) => {
  try {
    const { experience, specialty } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'trainer' || user.role === 'admin') {
      return res.status(400).json({ message: 'You are already a trainer or admin.' });
    }

    if (user.trainerApplicationStatus === 'pending') {
      return res.status(400).json({ message: 'You already have a pending application. Please wait for admin review.' });
    }

    if (user.trainerApplicationStatus === 'approved') {
      return res.status(400).json({ message: 'Your application has already been approved.' });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          trainerApplicationStatus: 'pending',
          trainerExperience: experience,
          trainerSpecialty: specialty,
        },
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/trainer-applications/my-application', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.json({ status: 'none' });
    }
    res.json({
      status: user.trainerApplicationStatus || 'none',
      feedback: user.trainerFeedback,
      experience: user.trainerExperience,
      specialty: user.trainerSpecialty,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/trainer-applications', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const applications = await User.find({ trainerApplicationStatus: 'pending' }).select('-password');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/approve-trainer/:id', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          role: 'trainer',
          trainerApplicationStatus: 'approved',
        },
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/reject-trainer/:id', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const { feedback } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          trainerApplicationStatus: 'rejected',
          trainerFeedback: feedback,
        },
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/trainers', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '' } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;

    const query = { role: 'trainer' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const trainers = await User.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.json({ trainers, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/demote-trainer/:id', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role: 'user' } },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
