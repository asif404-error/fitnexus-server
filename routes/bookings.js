import express from 'express';
const router = express.Router();
import Booking from '../models/booking.js';
import Class from '../models/class.js';
import User from '../models/user.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';

router.get('/stats', async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    res.json({ totalBookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/all', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/check/:classId', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findOne({ classId: req.params.classId, userId: req.user.id });
    res.json({ booked: !!booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { classId } = req.body;

    const user = await User.findById(req.user.id);
    if (user && user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }

    const existingBooking = await Booking.findOne({ classId, userId: req.user.id });
    if (existingBooking) {
      return res.status(400).json({ message: 'Already booked' });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const booking = await Booking.create({
      classId,
      userId: req.user.id,
      userEmail: req.user.email,
      className: classData.name,
      trainerName: classData.trainerName,
      price: classData.price,
      transactionId: req.body.transactionId || '',
    });

    await Class.findByIdAndUpdate(classId, { $inc: { bookingCount: 1 } });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my-bookings', verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:classId', verifyToken, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classData.trainerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bookings = await Booking.find({ classId: req.params.classId });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
