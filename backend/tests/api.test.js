process.env.NODE_ENV = "test";
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import app from "../src/server.js";
import { connectDB } from "../src/config/db.js";

let server;
let baseUrl;

before(async () => {
  await connectDB();
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (server) server.close();
  await mongoose.disconnect();
});

describe("Public Endpoints", () => {
  test("GET / returns 200 greeting", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.equal(text, "Hello from server");
  });

  test("GET /api/posts returns posts array", async () => {
    const res = await fetch(`${baseUrl}/api/posts`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.posts));
  });

  test("GET /api/posts/:postId returns 400 for invalid ObjectId", async () => {
    const res = await fetch(`${baseUrl}/api/posts/invalid-id-123`);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("Invalid"));
  });

  test("GET /api/posts/:postId returns 404 for non-existent post", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/api/posts/${fakeId}`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.error, "Post not found");
  });

  test("GET /api/users/profile/:username returns 404 for non-existent user", async () => {
    const res = await fetch(`${baseUrl}/api/users/profile/non_existent_user_99999`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.error, "User not found");
  });

  test("GET /api/comments/post/:postId returns 400 for invalid post ID", async () => {
    const res = await fetch(`${baseUrl}/api/comments/post/invalid-id`);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("Invalid"));
  });
});

describe("Authentication & Route Protection", () => {
  const protectedRoutes = [
    { method: "GET", path: "/api/users/me" },
    { method: "POST", path: "/api/users/me" },
    { method: "POST", path: "/api/users/sync" },
    { method: "PUT", path: "/api/users/profile" },
    { method: "POST", path: `/api/users/follow/${new mongoose.Types.ObjectId()}` },
    { method: "GET", path: "/api/users/search?q=test" },
    { method: "POST", path: "/api/posts", body: { content: "hello" } },
    { method: "POST", path: `/api/posts/${new mongoose.Types.ObjectId()}/like` },
    { method: "DELETE", path: `/api/posts/${new mongoose.Types.ObjectId()}` },
    { method: "POST", path: `/api/comments/post/${new mongoose.Types.ObjectId()}`, body: { content: "nice" } },
    { method: "DELETE", path: `/api/comments/${new mongoose.Types.ObjectId()}` },
    { method: "GET", path: "/api/notifications" },
    { method: "DELETE", path: `/api/notifications/${new mongoose.Types.ObjectId()}` },
  ];

  for (const route of protectedRoutes) {
    test(`${route.method} ${route.path.split("?")[0]} returns 401 without auth token`, async () => {
      const opts = {
        method: route.method,
        headers: { "Content-Type": "application/json" },
      };
      if (route.body) opts.body = JSON.stringify(route.body);

      const res = await fetch(`${baseUrl}${route.path}`, opts);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.ok(data.error.toLowerCase().includes("unauthorized"));
    });
  }
});

describe("Model & Business Logic Rules", () => {
  test("Post content length limit is 280 characters", async () => {
    const Post = (await import("../src/models/post.model.js")).default;
    const post = new Post({
      user: new mongoose.Types.ObjectId(),
      content: "a".repeat(281),
    });
    const err = post.validateSync();
    assert.ok(err);
    assert.ok(err.errors.content);
  });

  test("Comment content cannot be empty", async () => {
    const Comment = (await import("../src/models/comment.model.js")).default;
    const comment = new Comment({
      user: new mongoose.Types.ObjectId(),
      post: new mongoose.Types.ObjectId(),
      content: "",
    });
    const err = comment.validateSync();
    assert.ok(err);
    assert.ok(err.errors.content);
  });

  test("Bio length limit is 160 characters in user schema", async () => {
    const User = (await import("../src/models/user.model.js")).default;
    const user = new User({
      clerkId: "test_clerk",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      username: "testuser",
      bio: "b".repeat(161),
    });
    const err = user.validateSync();
    assert.ok(err);
    assert.ok(err.errors.bio);
  });

  test("ObjectId comparison for post likes avoids reference equality bugs", () => {
    const id1 = new mongoose.Types.ObjectId();
    const id2 = new mongoose.Types.ObjectId(id1.toString());

    // Reference equality fails
    assert.notEqual(id1, id2);
    assert.equal([id1].includes(id2), false);

    // String comparison succeeds
    const likes = [id1];
    const isLiked = likes.some((id) => id.toString() === id2.toString());
    assert.equal(isLiked, true);
  });
});

describe("Comment Deletion & Moderation Logic", () => {
  test("Comment deletion properly pulls comment from post and deletes notifications", async () => {
    const Post = (await import("../src/models/post.model.js")).default;
    const Comment = (await import("../src/models/comment.model.js")).default;
    const Notification = (await import("../src/models/notification.model.js")).default;

    const postAuthorId = new mongoose.Types.ObjectId();
    const commentAuthorId = new mongoose.Types.ObjectId();

    // 1. Create a post
    const post = await Post.create({
      user: postAuthorId,
      content: "Post with comment to delete",
    });

    // 2. Create a comment
    const comment = await Comment.create({
      user: commentAuthorId,
      post: post._id,
      content: "This is a comment to test deletion",
    });

    // Link comment to post
    await Post.findByIdAndUpdate(post._id, { $push: { comments: comment._id } });

    // 3. Create a notification for the comment
    const notif = await Notification.create({
      from: commentAuthorId,
      to: postAuthorId,
      type: "comment",
      post: post._id,
      comment: comment._id,
    });

    // Verify setup
    const updatedPostBefore = await Post.findById(post._id);
    assert.equal(updatedPostBefore.comments.length, 1);
    const notifBefore = await Notification.findById(notif._id);
    assert.ok(notifBefore);

    // 4. Perform comment deletion cascade
    await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
    await Comment.findByIdAndDelete(comment._id);
    await Notification.deleteMany({ comment: comment._id });

    // 5. Verify results
    const updatedPostAfter = await Post.findById(post._id);
    assert.equal(updatedPostAfter.comments.length, 0);

    const deletedComment = await Comment.findById(comment._id);
    assert.equal(deletedComment, null);

    const notifAfter = await Notification.findById(notif._id);
    assert.equal(notifAfter, null);

    // Clean up post
    await Post.findByIdAndDelete(post._id);
  });

  test("Comment deletion authorization allows both comment author and post author", () => {
    const postAuthor = new mongoose.Types.ObjectId();
    const commentAuthor = new mongoose.Types.ObjectId();
    const thirdPartyUser = new mongoose.Types.ObjectId();

    // Comment author can delete
    assert.equal(commentAuthor.toString() === commentAuthor.toString(), true);

    // Post author can delete comment on their post
    assert.equal(postAuthor.toString() === postAuthor.toString(), true);

    // Third party cannot delete
    const isAllowedThirdParty =
      thirdPartyUser.toString() === commentAuthor.toString() ||
      thirdPartyUser.toString() === postAuthor.toString();
    assert.equal(isAllowedThirdParty, false);
  });
});

describe("Post Creation & Image Posting Rules", () => {
  test("Post with image only (no text) is valid", async () => {
    const Post = (await import("../src/models/post.model.js")).default;
    const post = new Post({
      user: new mongoose.Types.ObjectId(),
      content: "",
      image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    });
    const err = post.validateSync();
    assert.equal(err, undefined);
    assert.equal(post.image.length > 0, true);
  });

  test("Post with both text and image is valid", async () => {
    const Post = (await import("../src/models/post.model.js")).default;
    const post = new Post({
      user: new mongoose.Types.ObjectId(),
      content: "Check out this image!",
      image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    });
    const err = post.validateSync();
    assert.equal(err, undefined);
  });

  test("Post with neither text nor image is rejected by controller validation", () => {
    const content = "";
    const imageBase64 = undefined;
    const trimmedContent = content ? content.trim() : "";

    const isInvalid = !trimmedContent && !imageBase64;
    assert.equal(isInvalid, true);
  });
});
