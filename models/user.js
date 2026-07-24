import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'trainer', 'admin'],
    default: 'user',
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active',
  },
  trainerApplicationStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  },
  trainerExperience: {
    type: Number,
  },
  trainerSpecialty: {
    type: String,
  },
  trainerFeedback: {
    type: String,
  },
}, {
  collection: 'user',
});

export default mongoose.model('User', userSchema);
