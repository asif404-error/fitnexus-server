import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  category: {
    type: String,
  },
  difficultyLevel: {
    type: String,
  },
  duration: {
    type: Number,
  },
  schedule: {
    days: [String],
    time: String,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  trainerName: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  bookingCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Class', classSchema);
