'use server'
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  authProvider: { type: String, enum: ['clerk', 'telegram'], default: 'clerk' },
  telegramId: { type: String, unique: true, sparse: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: String,
  bio: String,
  tweets: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Tweet' }
  ],
  retweets: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Tweet' }
  ],
  likedTweets: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Tweet' }
  ],
  replies: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Tweet' }
  ],
  onboarded: {
    type: Boolean, default: false
  },
  groups: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Group'}
  ],
  friends: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  friendRequestsSent: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  friendRequestsReceived: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ]
}, {
  timestamps: true,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
