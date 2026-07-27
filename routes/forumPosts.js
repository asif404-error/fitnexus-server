import express from 'express';
const router = express.Router();
import ForumPost from '../models/forumPost.js';
import User from '../models/user.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';

router.get('/stats', async (req, res) => {
  try {
    const totalPosts = await ForumPost.countDocuments();
    res.json({ totalPosts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const posts = await ForumPost.find().sort({ createdAt: -1 }).limit(4);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my-posts', verifyToken, verifyRole('trainer', 'admin'), async (req, res) => {
  try {
    const posts = await ForumPost.find({ authorId: req.user.id }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id).populate('authorId', 'name image');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', verifyToken, verifyRole('trainer', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = await ForumPost.create({
      ...req.body,
      authorId: req.user.id,
      authorName: user.name,
      authorImage: user.image,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await ForumPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/like', verifyToken, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
      post.dislikes.pull(userId);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/dislike', verifyToken, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;
    const isDisliked = post.dislikes.includes(userId);

    if (isDisliked) {
      post.dislikes.pull(userId);
    } else {
      post.dislikes.push(userId);
      post.likes.pull(userId);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 6;

    const total = await ForumPost.countDocuments();
    const posts = await ForumPost.find()
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.json({ posts, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
