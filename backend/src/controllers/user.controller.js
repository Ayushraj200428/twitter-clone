import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import { getAuth, clerkClient } from "@clerk/express";
import Notification from "../models/notification.model.js";

export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const user = await User.findOne({
    username: new RegExp(`^${escapedUsername}$`, "i"),
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const { firstName, lastName, bio, location, bannerImage, profilePicture } = req.body;

  if (bio !== undefined && typeof bio === "string" && bio.length > 160) {
    return res.status(400).json({ error: "Bio cannot exceed 160 characters" });
  }

  const allowedUpdates = { firstName, lastName, bio, location, bannerImage, profilePicture };
  // strip undefined fields so partial updates work cleanly
  Object.keys(allowedUpdates).forEach(
    (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
  );

  const user = await User.findOneAndUpdate({ clerkId: userId }, allowedUpdates, {
    new: true,
    runValidators: true,
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const syncUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const existingUser = await User.findOne({ clerkId: userId });
  if (existingUser) {
    return res.status(200).json({ user: existingUser, message: "User already exists" });
  }

  const clerkUser = await clerkClient.users.getUser(userId);

  const rawBase =
    clerkUser.username ||
    (clerkUser.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0]) ||
    "user";
  const baseUsername = rawBase.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";

  let username = baseUsername;
  let attempt = 0;
  while (await User.findOne({ username })) {
    attempt++;
    username = `${baseUsername}${attempt}`;
  }

  const userData = {
    clerkId: userId,
    email: clerkUser.emailAddresses?.[0]?.emailAddress || `${userId}@example.com`,
    firstName: clerkUser.firstName || "",
    lastName: clerkUser.lastName || "",
    username,
    profilePicture: clerkUser.imageUrl || "",
  };

  const user = await User.create(userData);

  res.status(201).json({ user, message: "User created successfully" });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOne({ clerkId: userId });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== "string" || q.trim() === "") {
    return res.status(200).json({ users: [] });
  }

  const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQ, "i");
  const users = await User.find({
    $or: [
      { username: { $regex: regex } },
      { firstName: { $regex: regex } },
      { lastName: { $regex: regex } },
    ],
  })
    .select("username firstName lastName profilePicture bio followers following")
    .limit(20);

  res.status(200).json({ users });
});

export const followUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { targetUserId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const currentUser = await User.findOne({ clerkId: userId });
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) return res.status(404).json({ error: "User not found" });

  // prevent self-follow using MongoDB _id comparison
  if (currentUser._id.toString() === targetUser._id.toString()) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }

  const isFollowing = currentUser.following.some(
    (id) => id.toString() === targetUser._id.toString()
  );

  if (isFollowing) {
    // unfollow
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { following: targetUser._id },
    });
    await User.findByIdAndUpdate(targetUser._id, {
      $pull: { followers: currentUser._id },
    });
    await Notification.findOneAndDelete({
      from: currentUser._id,
      to: targetUser._id,
      type: "follow",
    });
  } else {
    // follow uniquely
    await User.findByIdAndUpdate(currentUser._id, {
      $addToSet: { following: targetUser._id },
    });
    await User.findByIdAndUpdate(targetUser._id, {
      $addToSet: { followers: currentUser._id },
    });

    // create notification
    await Notification.create({
      from: currentUser._id,
      to: targetUser._id,
      type: "follow",
    });
  }

  res.status(200).json({
    message: isFollowing ? "User unfollowed successfully" : "User followed successfully",
  });
});