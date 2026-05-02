"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

export type FriendshipStatus =
  | "self"
  | "friends"
  | "incoming"
  | "outgoing"
  | "none";

const toStringId = (value: any) => value?.toString?.() ?? String(value);

const includesObjectId = (items: any[] = [], id: any) =>
  items.some((item) => toStringId(item) === toStringId(id));

const serializeFriend = (user: any, currentFriendIds: string[] = []) => {
  const userFriendIds = (user.friends ?? []).map(toStringId);
  const mutualCount = userFriendIds.filter((id: string) =>
    currentFriendIds.includes(id)
  ).length;

  return {
    id: user.id,
    objectId: user._id.toString(),
    name: user.name,
    username: user.username,
    image: user.image,
    bio: user.bio ?? "",
    friendsCount: user.friends?.length ?? 0,
    mutualCount,
  };
};

const getUsersForFriendship = async (
  currentUserId: string,
  targetUserId: string
) => {
  await connectToDB();

  if (currentUserId === targetUserId) {
    throw new Error("You cannot add yourself as a friend");
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findOne({ id: currentUserId }),
    User.findOne({ id: targetUserId }),
  ]);

  if (!currentUser || !targetUser) throw new Error("User not found");

  return { currentUser, targetUser };
};

export const getFriendshipStatus = async (
  currentUserId: string,
  targetUserId: string
): Promise<FriendshipStatus> => {
  await connectToDB();

  if (currentUserId === targetUserId) return "self";

  const [currentUser, targetUser] = await Promise.all([
    User.findOne({ id: currentUserId }),
    User.findOne({ id: targetUserId }),
  ]);

  if (!currentUser || !targetUser) return "none";

  if (includesObjectId(currentUser.friends, targetUser._id)) return "friends";
  if (includesObjectId(currentUser.friendRequestsSent, targetUser._id)) {
    return "outgoing";
  }
  if (includesObjectId(currentUser.friendRequestsReceived, targetUser._id)) {
    return "incoming";
  }

  return "none";
};

export const sendFriendRequest = async ({
  currentUserId,
  targetUserId,
  path,
}: {
  currentUserId: string;
  targetUserId: string;
  path: string;
}) => {
  const { currentUser, targetUser } = await getUsersForFriendship(
    currentUserId,
    targetUserId
  );

  if (includesObjectId(currentUser.friends, targetUser._id)) return;

  if (includesObjectId(currentUser.friendRequestsReceived, targetUser._id)) {
    await acceptFriendRequest({ currentUserId, targetUserId, path });
    return;
  }

  await Promise.all([
    User.findByIdAndUpdate(currentUser._id, {
      $addToSet: { friendRequestsSent: targetUser._id },
    }),
    User.findByIdAndUpdate(targetUser._id, {
      $addToSet: { friendRequestsReceived: currentUser._id },
    }),
  ]);

  revalidatePath(path);
  revalidatePath("/friends");
};

export const acceptFriendRequest = async ({
  currentUserId,
  targetUserId,
  path,
}: {
  currentUserId: string;
  targetUserId: string;
  path: string;
}) => {
  const { currentUser, targetUser } = await getUsersForFriendship(
    currentUserId,
    targetUserId
  );

  await Promise.all([
    User.findByIdAndUpdate(currentUser._id, {
      $addToSet: { friends: targetUser._id },
      $pull: { friendRequestsReceived: targetUser._id },
    }),
    User.findByIdAndUpdate(targetUser._id, {
      $addToSet: { friends: currentUser._id },
      $pull: { friendRequestsSent: currentUser._id },
    }),
  ]);

  revalidatePath(path);
  revalidatePath("/friends");
};

export const declineFriendRequest = async ({
  currentUserId,
  targetUserId,
  path,
}: {
  currentUserId: string;
  targetUserId: string;
  path: string;
}) => {
  const { currentUser, targetUser } = await getUsersForFriendship(
    currentUserId,
    targetUserId
  );

  await Promise.all([
    User.findByIdAndUpdate(currentUser._id, {
      $pull: { friendRequestsReceived: targetUser._id },
    }),
    User.findByIdAndUpdate(targetUser._id, {
      $pull: { friendRequestsSent: currentUser._id },
    }),
  ]);

  revalidatePath(path);
  revalidatePath("/friends");
};

export const cancelFriendRequest = async ({
  currentUserId,
  targetUserId,
  path,
}: {
  currentUserId: string;
  targetUserId: string;
  path: string;
}) => {
  const { currentUser, targetUser } = await getUsersForFriendship(
    currentUserId,
    targetUserId
  );

  await Promise.all([
    User.findByIdAndUpdate(currentUser._id, {
      $pull: { friendRequestsSent: targetUser._id },
    }),
    User.findByIdAndUpdate(targetUser._id, {
      $pull: { friendRequestsReceived: currentUser._id },
    }),
  ]);

  revalidatePath(path);
  revalidatePath("/friends");
};

export const removeFriend = async ({
  currentUserId,
  targetUserId,
  path,
}: {
  currentUserId: string;
  targetUserId: string;
  path: string;
}) => {
  const { currentUser, targetUser } = await getUsersForFriendship(
    currentUserId,
    targetUserId
  );

  await Promise.all([
    User.findByIdAndUpdate(currentUser._id, {
      $pull: { friends: targetUser._id },
    }),
    User.findByIdAndUpdate(targetUser._id, {
      $pull: { friends: currentUser._id },
    }),
  ]);

  revalidatePath(path);
  revalidatePath("/friends");
};

export const fetchFriendsDashboard = async ({
  currentUserId,
  searchString = "",
}: {
  currentUserId: string;
  searchString?: string;
}) => {
  await connectToDB();

  const currentUser = await User.findOne({ id: currentUserId })
    .populate({
      path: "friends",
      model: User,
      select: "id name username image bio friends",
    })
    .populate({
      path: "friendRequestsReceived",
      model: User,
      select: "id name username image bio friends",
    })
    .populate({
      path: "friendRequestsSent",
      model: User,
      select: "id name username image bio friends",
    });

  if (!currentUser) throw new Error("User not found");

  const currentFriendIds = (currentUser.friends ?? []).map((friend: any) =>
    friend._id ? friend._id.toString() : friend.toString()
  );

  const blockedIds = [
    currentUser._id.toString(),
    ...currentFriendIds,
    ...(currentUser.friendRequestsReceived ?? []).map((user: any) =>
      user._id.toString()
    ),
    ...(currentUser.friendRequestsSent ?? []).map((user: any) =>
      user._id.toString()
    ),
  ];

  const regex = new RegExp(searchString, "i");
  const friendFilter = (user: any) =>
    !searchString.trim() ||
    regex.test(user.name) ||
    regex.test(user.username) ||
    regex.test(user.bio ?? "");

  const suggestions = await User.find({
    _id: { $nin: blockedIds },
    onboarded: true,
  })
    .sort({ createdAt: "desc" })
    .limit(8)
    .select("id name username image bio friends");

  return {
    friends: currentUser.friends
      .filter(friendFilter)
      .map((user: any) => serializeFriend(user, currentFriendIds)),
    incoming: currentUser.friendRequestsReceived.map((user: any) =>
      serializeFriend(user, currentFriendIds)
    ),
    outgoing: currentUser.friendRequestsSent.map((user: any) =>
      serializeFriend(user, currentFriendIds)
    ),
    suggestions: suggestions.map((user: any) =>
      serializeFriend(user, currentFriendIds)
    ),
  };
};
