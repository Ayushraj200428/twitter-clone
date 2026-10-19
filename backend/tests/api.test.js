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
