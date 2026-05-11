const express = require("express");
const Post = require("../Models/Post");
const Comment = require("../Models/Comment");
const User=require("../Models/Users");
const authMiddleware = require("../Middlewares/authMiddleware");
const upload = require("../Middlewares/uploadMiddleware");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// 🔹 CREATE POST (Protected)
router.post("/", authMiddleware, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "All fields required" });
    }

   const BASE_URL = "http://localhost:5000";

const post = await Post.create({
  title,
  content,
  author: req.user._id,
  coverImage: req.file ? req.file.path : null
});

// Convert to object so we can modify
const postObj = post.toObject();

if (postObj.coverImage) {
  postObj.coverImage = BASE_URL + "/" + postObj.coverImage;
}

res.status(201).json(postObj);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔹 GET ALL POSTS (Public)
router.get("/", async (req, res) => {
  try {

    const BASE_URL = "http://localhost:5000";

    // 🧠 Get query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const skip = (page - 1) * limit;

    // Total count (important for frontend)
    const totalPosts = await Post.countDocuments();

    const posts = await Post.find()
      .populate("author", "username")
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Format posts (image URL fix)
    const formattedPosts = posts.map(post => {
      const postObj = post.toObject();

      if (postObj.coverImage) {
        postObj.coverImage = BASE_URL + "/" + postObj.coverImage;
      }

      return postObj;
    });

    res.json({
      page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
      posts: formattedPosts
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// UPDATE POST (Author Only)
// UPDATE POST (Author Only)
router.put("/:id", authMiddleware, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, content } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ownership check
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    
    if (req.file && post.coverImage) {
      try {
        const oldImagePath = path.join(__dirname, "..", post.coverImage);
        await fs.promises.unlink(oldImagePath);
      } catch (err) {
        console.log("Old image delete failed:", err.message);
      }
    }

    
    post.title = title || post.title;
    post.content = content || post.content;

   
    if (req.file) {
      post.coverImage = req.file.path;
    }

    await post.save();

    res.json({
      message: "Post updated",
      post
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// DELETE POST (Author Only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ownership check
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 🧹 Delete image
    if (post.coverImage) {
      const imagePath = path.join(__dirname, "..", post.coverImage);

      fs.unlink(imagePath, (err) => {
        if (err) {
          console.log("Failed to delete image:", err.message);
        } else {
          console.log("Image deleted successfully");
        }
      });
    }

    await post.deleteOne();

    res.json({ message: "Post deleted" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// LIKE / UNLIKE POST
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user._id;

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      // UNLIKE
      post.likes = post.likes.filter(
        id => id.toString() !== userId.toString()
      );
    } else {
      // LIKE
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      message: alreadyLiked ? "Post unliked" : "Post liked",
      totalLikes: post.likes.length
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// ADD COMMENT
router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {

    const { content } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = await Comment.create({
      content,
      author: req.user._id,
      post: post._id
    });

    res.json({
      message: "Comment added",
      comment
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// GET COMMENTS OF POST
router.get("/:id/comments", async (req, res) => {
  try {

    const comments = await Comment.find({ post: req.params.id })
      .populate("author", "username")
      .sort({ createdAt: -1 });

    res.json(comments);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// DELETE COMMENT
router.delete("/comment/:commentId", authMiddleware, async (req, res) => {
  try {

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await comment.deleteOne();

    res.json({ message: "Comment deleted" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;


// 69ab3cbcfbfa76470487bbfe