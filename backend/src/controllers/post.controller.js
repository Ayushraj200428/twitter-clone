import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import Post from "../models/post.model.js";
import cloudinary from "../config/cloudinary.js";
import Notification from "../models/notification.model.js";
import Comment from "../models/comment.model.js";
import User from "../models/user.model.js";
import { getAuth } from "@clerk/express";


export const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  res.status(200).json({ posts });
});


export const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

  const post = await Post.findById(postId)
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  if (!post) return res.status(404).json({ error: "Post not found" });

  res.status(200).json({ post });
});


export const getUserPosts = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const user = await User.findOne({ username: new RegExp(`^${escapedUsername}$`, "i") });
  if (!user) return res.status(404).json({ error: "User not found" });

  const posts = await Post.find({ user: user._id })
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  res.status(200).json({ posts });
});


export const createPost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { content, imageBase64 } = req.body;

  const trimmedContent = content ? content.trim() : "";

  if (!trimmedContent && !imageBase64) {
    return res.status(400).json({ error: "Post must contain either text or image" });
  }

  if (trimmedContent.length > 280) {
    return res.status(400).json({ error: "Post cannot exceed 280 characters" });
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  let imageUrl = "";

  if (imageBase64) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: "social_media_posts",
        resource_type: "image",
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto" },
          { format: "auto" },
        ],
      });
      imageUrl = uploadResponse.secure_url;
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.status(400).json({ error: "Failed to upload image" });
    }
  }

  const post = await Post.create({
    user: user._id,
    content: trimmedContent,
    image: imageUrl,
  });

  await post.populate("user", "username firstName lastName profilePicture");

  res.status(201).json({ post });
});


export const deletePost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post) return res.status(404).json({ error: "User or post not found" });

  if (post.user.toString() !== user._id.toString()) {
    return res.status(403).json({ error: "You can only delete your own posts" });
  }

  // Cascading deletes for comments and notifications associated with the post
  await Comment.deleteMany({ post: postId });
  await Notification.deleteMany({ post: postId });
  await Post.findByIdAndDelete(postId);

  res.status(200).json({ message: "Post deleted successfully" });
});


export const likePost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const isLiked = post.likes.some((id) => id.toString() === user._id.toString());

  if (isLiked) {
    // unlike: remove user from likes and clean up notification
    await Post.findByIdAndUpdate(postId, { $pull: { likes: user._id } });
    await Notification.findOneAndDelete({
      from: user._id,
      to: post.user,
      type: "like",
      post: postId,
    });
    return res.status(200).json({ message: "Post unliked successfully" });
  } else {
    // like: add user uniquely to likes and notify owner if not self
    await Post.findByIdAndUpdate(postId, { $addToSet: { likes: user._id } });

    if (post.user.toString() !== user._id.toString()) {
      await Notification.create({
        from: user._id,
        to: post.user,
        type: "like",
        post: postId,
      });
    }

    return res.status(200).json({ message: "Post liked successfully" });
  }
});
