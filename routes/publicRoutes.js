const express = require("express");
const router = express.Router();
const Blog = require("../models/blog");
const { marked } = require('marked');

// Homepage → latest posts with pagination
router.get("/", async (req, res) => {
  try {
    const perPage = 3; // posts per page
    const page = parseInt(req.query.page) || 1;

    const totalPosts = await Blog.countDocuments();

    const latestPosts = await Blog.find()
      .sort({ date: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(totalPosts / perPage);

    // Handle AJAX pagination
    if (req.xhr || req.headers["x-requested-with"] === "XMLHttpRequest") {
      const postsHtml = latestPosts
        .map(
          (post) => `
          <div class="col-md-4 mb-4 fade-in">
            <div class="card h-100 shadow-sm">
              ${post.image ? `<img src="${post.image}" class="card-img-top" alt="${post.title}">` : ""}
              <div class="card-body">
                ${post.category ? `<span class="badge bg-primary mb-2">${post.category}</span>` : ""}
                <h5 class="card-title">${post.title}</h5>
                <p class="card-text">
                  ${post.excerpt
                    ? post.excerpt.substring(0, 100) + "..."
                    : (post.content ? post.content.substring(0, 100) + "..." : "")
                  }
                </p>
                ${post.date ? `<p class="date"><small>${new Date(post.date).toLocaleDateString()}</small></p>` : ""}
                <a href="/blog/${post.slug}" class="btn btn-outline-primary">Read More</a>
              </div>
            </div>
          </div>
        `
        )
        .join("");

      let paginationHtml = "";
      if (totalPages > 1) {
        paginationHtml += `<div class="pagination mt-4 text-center"><ul class="pagination justify-content-center">`;

        if (page > 1) {
          paginationHtml += `<li class="page-item"><a class="page-link" href="/?page=${page - 1}">Previous</a></li>`;
        }

        for (let i = 1; i <= totalPages; i++) {
          paginationHtml += `<li class="page-item ${page === i ? "active" : ""}"><a class="page-link" href="/?page=${i}">${i}</a></li>`;
        }

        if (page < totalPages) {
          paginationHtml += `<li class="page-item"><a class="page-link" href="/?page=${page + 1}">Next</a></li>`;
        }

        paginationHtml += `</ul></div>`;
      }

      return res.json({ postsHtml, paginationHtml });
    }

    res.render("home", {
      latestPosts,
      current: page,
      pages: totalPages,
      layout: false,
      title: "Home",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});



// Blog list → all posts
router.get("/blog", async (req, res) => {
  try {
    const posts = await Blog.find().sort({ date: -1 });
    res.render("blog", { posts, layout: false, title: "Blog" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Blog detail → by slug
router.get("/blog/:slug", async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug });
    if (!post) return res.status(404).render("404", { layout: false, title: "Post Not Found" });

    // Fetch related posts (same category, exclude current post)
    const relatedPosts = await Blog.find({
      category: post.category,
      _id: { $ne: post._id }
    }).sort({ date: -1 }).limit(3);

     // Convert Markdown content to HTML
    const contentHTML = marked(post.content);


    res.render("blogdetail", { 
      post, 
      contentHTML,  // <-- pass converted HTML content
      relatedPosts,   // <-- pass related posts
      layout: false, 
      title: post.title 
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


// Gallery → show posts with images
router.get("/gallery", async (req, res) => {
  try {
    const posts = await Blog.find({ image: { $exists: true, $ne: "" } }).sort({ date: -1 });
    res.render("gallery", { posts, layout: false, title: "Gallery" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


// Register page
router.get('/register', (req, res) => {
    res.render('register', { layout: false }); // disables express-ejs-layouts
});

// Static content pages
router.get("/legitimacy", (req, res) => res.render("legitimacy", { layout: false, title: "Legitimacy" }));
router.get("/how-it-works", (req, res) => res.render("how-it-works", { layout: false, title: "How It Works" }));
router.get("/countries", (req, res) => res.render("countries", { layout: false, title: "Countries" }));
router.get("/terms", (req, res) => res.render("terms", { layout: false, title: "Terms of Service" }));
router.get("/privacy", (req, res) => res.render("privacy", { layout: false, title: "Privacy Policy" }));
router.get("/faqs", (req, res) => res.render("faqs", {layout: false, title: "FAQs" }));
router.get("/contacts", (req, res) => res.render("contacts", {layout: false, title: "Contact Us" }));
router.get("/ghana", (req, res) => res.render("ghana", {layout: false, title: "Ghana" }));
router.get("/kenya", (req, res) => res.render("kenya", {layout: false, title: "kenya" }));
router.get("/zambia", (req, res) => res.render("zambia", {layout: false, title: "zambia" }));
module.exports = router;
