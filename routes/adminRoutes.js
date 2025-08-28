const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const Blog = require("../models/blog");
const ensureAuth = require("../middleware/auth");
const  cloudinary = require("../config/cloudinary");

// Middleware to set admin layout
router.use((req, res, next) => {
  res.locals.layout = "layouts/admin";
  next();
});

// ---------- Authentication Routes ----------

// Login Page
router.get("/login", (req, res) => {
  res.render("admin/login", { layout: false, title: "Admin Login" });
});

// Handle Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (admin && await admin.comparePassword(password)) {
      req.session.adminId = admin._id;
      return res.redirect("/admin");
    }
    res.render("admin/login", { error: "Invalid credentials", layout: false, title: "Admin Login" });
  } catch (err) {
    console.error(err);
    res.render("admin/login", { error: "Something went wrong", layout: false, title: "Admin Login" });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

// ---------- Dashboard ----------

router.get("/", ensureAuth, async (req, res) => {
  try {
    const totalPosts = await Blog.countDocuments();
    const totalCategories = (await Blog.distinct("category")).length;
    const totalImages = await Blog.countDocuments({ image: { $exists: true, $ne: "" } });
    const recentPosts = await Blog.find().sort({ date: -1 }).limit(3);

    res.render("admin/dashboard", {
      stats: { totalPosts, totalCategories, totalImages },
      recentPosts,
      title: "Dashboard",
      active: "dashboard"
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading dashboard");
  }
});

// ---------- Posts Management ----------

// All Posts (with optional search)
router.get("/posts", ensureAuth, async (req, res) => {
  try {
    const searchQuery = req.query.search ? req.query.search.trim() : '';
    let query = {};

    if (searchQuery) {
      query = {
        $or: [
          { title: { $regex: searchQuery, $options: "i" } },
          { category: { $regex: searchQuery, $options: "i" } },
          { excerpt: { $regex: searchQuery, $options: "i" } }
        ]
      };
    }

    const posts = await Blog.find(query).sort({ date: -1 });

    res.render("admin/posts", {
      posts,
      title: "All Posts",
      active: "posts",
      search: searchQuery
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching posts");
  }
});


// New Post Form
router.get("/posts/new", ensureAuth, (req, res) => {
  res.render("admin/new-post", { title: "Create New Post", active: "posts" });
});

// Save New Post (Cloudinary Base64)
router.post("/posts", ensureAuth, async (req, res) => {
  try {
    const { title, excerpt, content, category, imageBase64 } = req.body;

    let imageUrl = "";
    let imageId = "";

    if (imageBase64) {
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: "fastqash"
      });
      imageUrl = uploadResponse.secure_url;
      imageId = uploadResponse.public_id;
    }

    const newPost = new Blog({
      title,
      excerpt,
      content,
      category,
      image: imageUrl,
      imageId,
      slug: title.toLowerCase().replace(/\s+/g, "-")
    });

    await newPost.save();
    res.redirect("/admin/posts");
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).send("Error creating post");
  }
});

// Edit Post Form
router.get("/posts/edit/:id", ensureAuth, async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    res.render("admin/edit-post", { post, title: "Edit Post", active: "posts" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching post");
  }
});

// Update Post (Cloudinary Base64)
router.post("/posts/edit/:id", ensureAuth, async (req, res) => {
  try {
    const { title, excerpt, content, category, imageBase64 } = req.body;
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    // Upload new image if provided
    if (imageBase64) {
      if (post.imageId) {
        await cloudinary.uploader.destroy(post.imageId); // remove old image
      }
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, { folder: "fastqash" });
      post.image = uploadResponse.secure_url;
      post.imageId = uploadResponse.public_id;
    }

    post.title = title;
    post.excerpt = excerpt;
    post.content = content;
    post.category = category;
    post.slug = title.toLowerCase().replace(/\s+/g, "-");

    await post.save();
    res.redirect("/admin/posts");
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).send("Error updating post");
  }
});

// Delete Post
router.post("/posts/delete/:id", ensureAuth, async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (post && post.imageId) await cloudinary.uploader.destroy(post.imageId);
    await Blog.findByIdAndDelete(req.params.id);
    res.redirect("/admin/posts");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting post");
  }
});

module.exports = router;
