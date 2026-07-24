import express from 'express';
const router = express.Router();
import Stripe from 'stripe';
import Class from '../models/class.js';
import Booking from '../models/booking.js';
import Transaction from '../models/transaction.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.get('/stats', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const transactions = await Transaction.find();
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    res.json({ totalRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/transactions', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/create-checkout-session', verifyToken, async (req, res) => {
  try {
    const { classId } = req.body;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const existingBooking = await Booking.findOne({ classId, userId: req.user.id });
    if (existingBooking) {
      return res.status(400).json({ message: 'Already booked this class' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: classData.name,
              description: classData.description || `Book ${classData.name}`,
            },
            unit_amount: Math.round(classData.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?sessionId={CHECKOUT_SESSION_ID}&classId=${classId}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata: {
        classId,
        userId: req.user.id,
        userEmail: req.user.email,
        className: classData.name,
        trainerName: classData.trainerName,
        price: classData.price,
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/verify-session', verifyToken, async (req, res) => {
  try {
    const { sessionId, classId } = req.body;

    if (!sessionId || !classId) {
      return res.status(400).json({ message: 'Session ID and Class ID are required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const existingBooking = await Booking.findOne({ classId, userId: req.user.id });
    if (existingBooking) {
      return res.json({ booking: existingBooking, alreadyBooked: true });
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
      transactionId: sessionId,
    });

    await Class.findByIdAndUpdate(classId, { $inc: { bookingCount: 1 } });

    await Transaction.create({
      userId: req.user.id,
      classId,
      userEmail: req.user.email,
      className: classData.name,
      amount: classData.price,
      transactionId: sessionId,
    });

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
