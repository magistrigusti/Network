"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import { FilterQuery, SortOrder } from "mongoose";
import Tweet from "../models/tweet.model";
import Group from "../models/group.model";

interface CreateUserParams {
  userId: string;
  email: string;
  username?: string | null;
  name?: string | null;
  image?: string | null;
}

interface SyncTelegramUserParams {
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  photoUrl?: string | null;
}

const USERNAME_LIMIT = 24;

const normalizeUsername = (value: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .slice(0, USERNAME_LIMIT);

  return normalized;
};

const buildUsernameSeed = ({
  email,
  username,
  userId,
}: Pick<CreateUserParams, "email" | "username" | "userId">) => {
  const emailPrefix = email.split("@")[0] ?? "";
  const fallback = `user_${userId.slice(-8).toLowerCase()}`;

  return (
    normalizeUsername(username ?? "") ||
    normalizeUsername(emailPrefix) ||
    normalizeUsername(fallback) ||
    "portal_user"
  );
};

const resolveUniqueUsername = async (base: string, userId: string) => {
  let suffix = 0;

  while (true) {
    const candidate =
      suffix === 0
        ? base
        : `${base.slice(0, Math.max(3, USERNAME_LIMIT - String(suffix).length - 1))}_${suffix}`;

    const existingUser = await User.findOne({ username: candidate });
    if (!existingUser || existingUser.id === userId) {
      return candidate;
    }

    suffix += 1;
  }
};

export const syncUserFromClerk = async ({
  userId,
  email,
  name,
  username,
  image,
}: CreateUserParams) => {
  await connectToDB();

  if (!email) {
    throw new Error("Email is required to sync Clerk user");
  }

  const existingUser = await User.findOne({ id: userId });
  const resolvedUsername =
    existingUser?.username ??
    (await resolveUniqueUsername(
      buildUsernameSeed({ email, username, userId }),
      userId
    ));

  const resolvedName =
    existingUser?.name ||
    name?.trim() ||
    resolvedUsername;

  const resolvedImage = image || existingUser?.image || "";

  return User.findOneAndUpdate(
    { id: userId },
    {
      $set: {
        email,
        authProvider: "clerk",
        name: resolvedName,
        image: resolvedImage,
        username: resolvedUsername,
      },
      $setOnInsert: {
        onboarded: false,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const syncUserFromTelegram = async ({
  telegramId,
  firstName,
  lastName,
  username,
  photoUrl,
}: SyncTelegramUserParams) => {
  await connectToDB();

  const userId = `telegram:${telegramId}`;
  const email = `telegram_${telegramId}@portal.local`;
  const existingUser = await User.findOne({ id: userId });
  const resolvedUsername =
    existingUser?.username ??
    (await resolveUniqueUsername(
      normalizeUsername(username ?? "") ||
        normalizeUsername(`${firstName}_${telegramId}`) ||
        `telegram_${telegramId}`,
      userId
    ));

  const name = [firstName, lastName].filter(Boolean).join(" ").trim();

  return User.findOneAndUpdate(
    { id: userId },
    {
      $set: {
        id: userId,
        email,
        authProvider: "telegram",
        telegramId,
        username: resolvedUsername,
        name: existingUser?.name || name || resolvedUsername,
        image: photoUrl || existingUser?.image || "/images/logo.png",
      },
      $setOnInsert: {
        onboarded: false,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const createUser = async ({
  userId,
  email,
  name,
  username,
  image,
}: CreateUserParams): Promise<void> => {
  try {
    await syncUserFromClerk({
      userId,
      email,
      name,
      username,
      image,
    });
  } catch (err: any) {
    throw new Error(`Failed to create user: ${err.message}`);
  }
};

export const fetchUser = async (userId: string) => {
  try {
    await connectToDB();

    return await User.findOne({
      id: userId,
    });
  } catch (err: any) {
    throw new Error(`Failed to fetch user: ${err.message}`);
  }
};

interface updateUserParams {
  userId: string;
  email?: string;
  username?: string;
  name?: string;
  bio?: string;
  image?: string;
  path?: string;
}

export const updateUser = async ({
  userId,
  name,
  email,
  username,
  bio,
  path,
  image,
}: updateUserParams): Promise<void> => {
  try {
    await connectToDB();
    await User.findOneAndUpdate(
      { id: userId },
      {
        name,
        email,
        username,
        bio,
        path,
        image,
        onboarded: true,
      }
    );

    if (path === "/profile/edit") revalidatePath(path);
  } catch (err: any) {
    throw new Error(`Failed to update user info: ${err.message}`);
  }
};

export const fetchUsers = async ({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) => {
  try {
    await connectToDB();
    const skipAmount = (pageNumber - 1) * pageSize;
    const regex = new RegExp(searchString, "i");
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId },
    };

    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    const sortOptions = { createdAt: sortBy };

    const userQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    const totalUserCount = await User.countDocuments(query);
    const users = await userQuery.exec();
    const isNext = totalUserCount > skipAmount + users.length;

    return { users, isNext };
  } catch (err: any) {
    throw new Error(`Failed to fetch users: ${err.message}`);
  }
};

export async function likeOrDislikeTweet(
  userId: string,
  tweetId: string,
  path: string
) {
  try {
    await connectToDB();

    // Find the user and check if they have already liked the tweet
    const user = await User.findOne({ id: userId });
    if (!user) throw new Error("User not found");

    let tweet;

    if (user.likedTweets.includes(tweetId)) {
      // If the tweet is already liked, decrement its likes and remove it from the user's likedTweets
      tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $inc: { likes: -1 } },
        { new: true } // Return the updated document
      );

      if (!tweet) {
        throw new Error("Tweet not found");
      }

      // Remove the tweet from the user's likedTweets array
      user.likedTweets = user.likedTweets.filter(
        (id: any) => id.toString() !== tweetId
      );
    } else {
      // If the tweet is not liked, increment its likes and add it to the user's likedTweets
      tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $inc: { likes: 1 } },
        { new: true } // Return the updated document
      );

      if (!tweet) {
        throw new Error("Tweet not found");
      }

      // Add the tweet to the user's likedTweets array
      user.likedTweets.push(tweetId);
    }

    await user.save();
    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to like or dislike tweet: ${error.message}`);
  }
}

export const fetchUserPosts = async (userId: string) => {
  try {
    await connectToDB();

    // Find all tweets authored by the user with the given userId
    const tweets = await User.findOne({ id: userId }).populate({
      path: "tweets",
      model: Tweet,
      options: {
        sort: { createdAt: "desc" },
      }, // Sort tweets in descending order by createdAt
      populate: [
        {
          path: "group",
          model: Group,
          select: "name id image _id", // Select the "name" and "_id" fields from the "Group" model
        },
        {
          path: "retweetOf", // Populate the retweetOf field
          populate: {
            path: "author",
            model: User,
            select: "_id name image",
          },
        },
        {
          path: "children",
          model: Tweet,
          populate: {
            path: "author",
            model: User,
            select: "name image id", // Select the "name" and "_id" fields from the "User" model
          },
        },
      ],
    });
    return tweets;
  } catch (error) {
    console.error("Error fetching user tweets:", error);
    throw error;
  }
};

export const fetchUserReplies = async (userId: string) => {
  try {
    await connectToDB();

    // Find all replies authored by the user with the given userId
    const replies = await User.findOne({ id: userId }).populate({
      path: "replies",
      model: Tweet,
      populate: [
        {
          path: "group",
          model: Group,
          select: "name id image _id", // Select the "name", "id", "image", and "_id" fields from the "Group" model
        },
        {
          path: "children",
          model: Tweet,
          populate: {
            path: "author",
            model: User,
            select: "name image id", // Select the "name", "image", and "id" fields from the "User" model
          },
        },
      ],
    });
    return replies;
  } catch (error: any) {
    console.error("Error fetching user replies:", error);
    throw error;
  }
};

export const getActivity = async (userId: string) => {
  try {
    await connectToDB();

    // Find all tweets created by the user
    const userTweets = await Tweet.find({ author: userId });

    // Collect all the child tweet ids (replies) from the 'children' field of each user tweet
    const childTweetIds = userTweets.reduce((acc, userTweet) => {
      return acc.concat(userTweet.children);
    }, []);

    // Find and return the child tweets (replies) excluding the ones created by the same user
    const replies = await Tweet.find({
      _id: { $in: childTweetIds },
      author: { $ne: userId }, // Exclude tweets authored by the same user
    }).populate({
      path: "author",
      model: User,
      select: "name image _id",
    });

    return replies;
  } catch (error) {
    console.error("Error fetching replies: ", error);
    throw error;
  }
};
