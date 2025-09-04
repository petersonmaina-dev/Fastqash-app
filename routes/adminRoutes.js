const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const Blog = require("../models/blog");
const ensureAuth = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");
const { Op } = require("sequelize");

// ---------- Middleware ----------
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
    const admin = await Admin.findOne({ where: { username } });
    if (admin && (await admin.comparePassword(password))) {
      req.session.adminId = admin.id;
      return res.redirect("/admin");
    }
    res.render("admin/login", {
      error: "Invalid credentials",
      layout: false,
      title: "Admin Login",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.render("admin/login", {
      error: "Something went wrong",
      layout: false,
      title: "Admin Login",
    });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

// ---------- Dashboard ----------
router.get("/", ensureAuth, async (req, res) => {
  try {
    const totalPosts = await Blog.count();
    const totalCategories = (
      await Blog.aggregate("category", "DISTINCT", { plain: false })
    ).length;
    const totalImages = await Blog.count({
      where: { image: { [Op.ne]: "" } },
    });
    const recentPosts = await Blog.findAll({
      order: [["date", "DESC"]],
      limit: 3,
    });

    res.render("admin/dashboard", {
      stats: { totalPosts, totalCategories, totalImages },
      recentPosts,
      title: "Dashboard",
      active: "dashboard",
      layout: "layouts/admin",
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).send("Error loading dashboard");
  }
});

// ---------- Posts Management ----------

// All Posts (with optional search)
router.get("/posts", ensureAuth, async (req, res) => {
  try {
    const searchQuery = req.query.search?.trim() || "";
    let where = {};

    if (searchQuery) {
      where = {
        [Op.or]: [
          { title: { [Op.like]: `%${searchQuery}%` } },
          { category: { [Op.like]: `%${searchQuery}%` } },
          { excerpt: { [Op.like]: `%${searchQuery}%` } },
        ],
      };
    }

    const posts = await Blog.findAll({ where, order: [["date", "DESC"]] });

    res.render("admin/posts", {
      posts,
      title: "All Posts",
      active: "posts",
      layout: "layouts/admin",
      search: searchQuery,
    });
  } catch (err) {
    console.error("Fetch posts error:", err);
    res.status(500).send("Error fetching posts");
  }
});

// New Post Form
router.get("/posts/new", ensureAuth, (req, res) => {
  res.render("admin/new-post", {
    title: "Create New Post",
    active: "posts",
    layout: "layouts/admin",
  });
});

// Save New Post (Cloudinary Base64)
router.post("/posts", ensureAuth, async (req, res) => {
  try {
    const { title, excerpt, content, category, imageBase64 } = req.body;

    let imageUrl = "";
    let imageId = "";

    if (imageBase64) {
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: "fastqash",
      });
      imageUrl = uploadResponse.secure_url;
      imageId = uploadResponse.public_id;
    }

    await Blog.create({
      title,
      excerpt,
      content,
      category,
      image: imageUrl,
      imageId,
      slug: title.toLowerCase().replace(/\s+/g, "-"),
    });

    res.redirect("/admin/posts");
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).send("Error creating post");
  }
});

// Edit Post Form
router.get("/posts/edit/:id", ensureAuth, async (req, res) => {
  try {
    const post = await Blog.findByPk(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    res.render("admin/edit-post", {
      post,
      title: "Edit Post",
      active: "posts",
      layout: "layouts/admin",
    });
  } catch (err) {
    console.error("Fetch post for edit error:", err);
    res.status(500).send("Error fetching post");
  }
});

// Update Post (Cloudinary Base64)
router.post("/posts/edit/:id", ensureAuth, async (req, res) => {
  try {
    const { title, excerpt, content, category, imageBase64 } = req.body;
    const post = await Blog.findByPk(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    if (imageBase64) {
      if (post.imageId) {
        await cloudinary.uploader.destroy(post.imageId);
      }
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: "fastqash",
      });
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
    console.error("Update post error:", err);
    res.status(500).send("Error updating post");
  }
});

// Delete Post
router.post("/posts/delete/:id", ensureAuth, async (req, res) => {
  try {
    const post = await Blog.findByPk(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    if (post.imageId) {
      await cloudinary.uploader.destroy(post.imageId);
    }

    await post.destroy();
    res.redirect("/admin/posts");
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).send("Error deleting post");
  }
});

module.exports = router;
