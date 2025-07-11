'use server';

import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema({
  text: { type: String, reqired: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Tweet', default: null },
  retweetOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Tweet', default: null },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  createdAt: { type: Date, default: Date.now },
  parentId: {type: String },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tweet' }],
  likes: { type: Number, default: 0 },
});

const Tweet = mongoose.models.Tweet || mongoose.model("Tweet", tweetSchema);

export default Tweet;