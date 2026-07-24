import express from 'express';
const router = express.Router();
import Comment from '../models/comment.js';
import User from '../models/user.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';

router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:postId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }

    const comment = await Comment.create({
      postId: req.params.postId,
      authorId: req.user.id,
      authorName: user?.name || req.user.name || 'Unknown',
      text: req.body.text,
      parentCommentId: req.body.parentCommentId || null,
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:commentId', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    comment.text = req.body.text;
    await comment.save();

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:commentId', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
