"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

const buildParticipantKey = (firstId: string, secondId: string) =>
  [firstId, secondId].sort().join(":");

const requireUserByClerkId = async (userId: string) => {
  const user = await User.findOne({ id: userId });
  if (!user) throw new Error("User not found");
  return user;
};

const ensureConversationAccess = async (
  conversationId: string,
  userObjectId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new Error("Invalid conversation id");
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userObjectId,
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
};

export const getOrCreateConversation = async (
  currentUserId: string,
  targetUserId: string
) => {
  await connectToDB();

  if (currentUserId === targetUserId) {
    throw new Error("You cannot message yourself");
  }

  const [currentUser, targetUser] = await Promise.all([
    requireUserByClerkId(currentUserId),
    requireUserByClerkId(targetUserId),
  ]);

  const currentObjectId = currentUser._id.toString();
  const targetObjectId = targetUser._id.toString();
  const participantKey = buildParticipantKey(currentObjectId, targetObjectId);

  const conversation = await Conversation.findOneAndUpdate(
    { participantKey },
    {
      $setOnInsert: {
        participants: [currentUser._id, targetUser._id],
        participantKey,
        lastMessageAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return conversation._id.toString();
};

export const startConversation = async (
  currentUserId: string,
  targetUserId: string
) => {
  const conversationId = await getOrCreateConversation(
    currentUserId,
    targetUserId
  );

  redirect(`/messages/${conversationId}`);
};

export const fetchConversations = async (currentUserId: string) => {
  await connectToDB();

  const currentUser = await requireUserByClerkId(currentUserId);

  const conversations = await Conversation.find({
    participants: currentUser._id,
  })
    .sort({ lastMessageAt: "desc" })
    .populate({
      path: "participants",
      model: User,
      select: "id name username image",
    })
    .populate({
      path: "lastMessage",
      model: Message,
      select: "text sender createdAt",
    })
    .lean();

  return conversations.map((conversation: any) => {
    const otherUser = conversation.participants.find(
      (participant: any) => participant.id !== currentUserId
    );

    return {
      id: conversation._id.toString(),
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        username: otherUser.username,
        image: otherUser.image,
      },
      lastMessage: conversation.lastMessage
        ? {
            text: conversation.lastMessage.text,
            sender: conversation.lastMessage.sender.toString(),
            createdAt: conversation.lastMessage.createdAt.toISOString(),
          }
        : null,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
    };
  });
};

export const fetchConversation = async (
  conversationId: string,
  currentUserId: string
) => {
  await connectToDB();

  const currentUser = await requireUserByClerkId(currentUserId);
  const conversation = await ensureConversationAccess(
    conversationId,
    currentUser._id.toString()
  );

  const populatedConversation = await conversation.populate({
    path: "participants",
    model: User,
    select: "id name username image",
  });

  const messages = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: "asc" })
    .populate({
      path: "sender",
      model: User,
      select: "id name username image",
    })
    .lean();

  await Message.updateMany(
    {
      conversation: conversation._id,
      recipient: currentUser._id,
      readBy: { $ne: currentUser._id },
    },
    { $addToSet: { readBy: currentUser._id } }
  );

  const otherUser = (populatedConversation.participants as any[]).find(
    (participant: any) => participant.id !== currentUserId
  );

  return {
    id: conversation._id.toString(),
    otherUser: {
      id: otherUser.id,
      name: otherUser.name,
      username: otherUser.username,
      image: otherUser.image,
    },
    messages: messages.map((message: any) => ({
      id: message._id.toString(),
      text: message.text,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        username: message.sender.username,
        image: message.sender.image,
      },
    })),
  };
};

export const sendMessage = async ({
  conversationId,
  currentUserId,
  text,
  path,
}: {
  conversationId: string;
  currentUserId: string;
  text: string;
  path: string;
}) => {
  const cleanText = text.trim();
  if (!cleanText) throw new Error("Message cannot be empty");
  if (cleanText.length > 2000) throw new Error("Message is too long");

  await connectToDB();

  const currentUser = await requireUserByClerkId(currentUserId);
  const conversation = await ensureConversationAccess(
    conversationId,
    currentUser._id.toString()
  );

  const recipientId = conversation.participants.find(
    (participantId: any) =>
      participantId.toString() !== currentUser._id.toString()
  );

  if (!recipientId) throw new Error("Recipient not found");

  const message = await Message.create({
    conversation: conversation._id,
    sender: currentUser._id,
    recipient: recipientId,
    text: cleanText,
    readBy: [currentUser._id],
  });

  await Conversation.findByIdAndUpdate(conversation._id, {
    lastMessage: message._id,
    lastMessageAt: message.createdAt,
  });

  revalidatePath("/messages");
  revalidatePath(path);
};
