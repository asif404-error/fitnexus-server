import express from 'express';
const router = express.Router();
import Favorite from '../models/favorite.js';
import { verifyToken } from '../middleware/auth.js';

router.get('/my-favorites', verifyToken, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id }).populate('classId');
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { classId } = req.body;

    const existing = await Favorite.findOne({ classId, userId: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'Already in favorites' });
    }

    const favorite = await Favorite.create({ classId, userId: req.user.id });
    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:classId', verifyToken, async (req, res) => {
  try {
    await Favorite.findOneAndDelete({ classId: req.params.classId, userId: req.user.id });
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/check/:classId', verifyToken, async (req, res) => {
  try {
    const favorite = await Favorite.findOne({ classId: req.params.classId, userId: req.user.id });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
