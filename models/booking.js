import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userEmail: {
    type: String,
  },
  className: {
    type: String,
  },
  trainerName: {
    type: String,
  },
  price: {
    type: Number,
  },
  transactionId: {
    type: String,
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Booking', bookingSchema);
