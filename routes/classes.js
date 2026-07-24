import express from 'express';
const router = express.Router();
import Class from '../models/class.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';

router.get('/stats', async (req, res) => {
  try {
    const totalClasses = await Class.countDocuments();
    const pendingCount = await Class.countDocuments({ status: 'pending' });
    const approvedCount = await Class.countDocuments({ status: 'approved' });
    res.json({ totalClasses, pendingCount, approvedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const featuredClasses = await Class.find({ status: 'approved' })
      .sort({ bookingCount: -1 })
      .limit(6);
    res.json(featuredClasses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/all', verifyToken, verifyRole('admin', 'trainer'), async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '' } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const total = await Class.countDocuments(query);
    const classes = await Class.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.json({ classes, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my-classes', verifyToken, verifyRole('trainer', 'admin'), async (req, res) => {
  try {
    const classes = await Class.find({ trainerId: req.user.id });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', verifyToken, verifyRole('trainer', 'admin'), async (req, res) => {
  try {
    const { scheduleDays, scheduleTime, ...rest } = req.body;
    const classData = {
      ...rest,
      trainerId: req.user.id,
      trainerName: req.user.name,
    };
    if (scheduleDays || scheduleTime) {
      classData.schedule = {
        days: scheduleDays || [],
        time: scheduleTime || '',
      };
    }
    const newClass = await Class.create(classData);
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id', verifyToken, verifyRole('trainer', 'admin'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classData.trainerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { scheduleDays, scheduleTime, ...rest } = req.body;
    const updateData = { ...rest };
    if (scheduleDays || scheduleTime) {
      updateData.schedule = {
        days: scheduleDays || classData.schedule?.days || [],
        time: scheduleTime || classData.schedule?.time || '',
      };
    }

    const updated = await Class.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', verifyToken, verifyRole('trainer', 'admin'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classData.trainerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/approve/:id', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const updated = await Class.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/reject/:id', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const updated = await Class.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;

    const query = { status: 'approved' };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      const categories = category.split(',');
      query.category = { $in: categories };
    }

    const total = await Class.countDocuments(query);
    const classes = await Class.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.json({ classes, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
