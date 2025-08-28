const express = require("express");
const router = express.Router();
const Blog = require("../models/blog");
const { marked } = require('marked');
  

// Homepage → latest posts with sliding window pagination
router.get("/", async (req, res) => {
  try {
    const perPage = 3; // posts per page
    const page = parseInt(req.query.page) || 1;

    const totalPosts = await Blog.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    const latestPosts = await Blog.find()
      .sort({ date: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    // Helper function to generate pagination HTML
    function getPaginationHtml(current, total) {
      const middleWindow = 3; // number of middle pages
      let startPage = Math.max(2, current - 1);
      let endPage = Math.min(total - 1, current + 1);

      // Adjust if near start
      if (current === 1) {
        startPage = 2;
        endPage = 2 + middleWindow - 1;
      }
      // Adjust if near end
      if (current === total) {
        startPage = total - middleWindow;
        endPage = total - 1;
      }
      startPage = Math.max(2, startPage);
      endPage = Math.min(total - 1, endPage);

      let html = `<div class="pagination mt-4 text-center"><ul class="pagination justify-content-center">`;

      // Previous
      if (current > 1) html += `<li class="page-item"><a class="page-link" href="/?page=${current - 1}">&lt;</a></li>`;

      // First page
      html += `<li class="page-item ${current === 1 ? "active" : ""}"><a class="page-link" href="/?page=1">1</a></li>`;

      // Ellipsis before window
      if (startPage > 2) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;

      // Middle pages
      for (let i = startPage; i <= endPage; i++) {
        html += `<li class="page-item ${current === i ? "active" : ""}"><a class="page-link" href="/?page=${i}">${i}</a></li>`;
      }

      // Ellipsis after window
      if (endPage < total - 1) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;

      // Last page
      if (total > 1) html += `<li class="page-item ${current === total ? "active" : ""}"><a class="page-link" href="/?page=${total}">${total}</a></li>`;

      // Next
      if (current < total) html += `<li class="page-item"><a class="page-link" href="/?page=${current + 1}">&gt;</a></li>`;

      html += `</ul></div>`;
      return html;
    }

          // Handle AJAX request
      if (req.xhr || req.headers["x-requested-with"] === "XMLHttpRequest") {
        const postsHtml = latestPosts
          .map(post => `
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
                  ${
                    post.date
                      ? `<p class="date"><small>${new Date(post.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}</small></p>`
                      : ""
                  }
                  <a href="/blog/${post.slug}" class="btn btn-outline-primary">Read More</a>
                </div>
              </div>
            </div>
          `).join("");

        const paginationHtml = getPaginationHtml(page, totalPages);

        return res.json({ postsHtml, paginationHtml });
      }


    // Normal render
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

// Blog search API (AJAX live search)
router.get("/blog/search", async (req, res) => {
  try {
    const searchQuery = req.query.q ? req.query.q.trim() : '';
    let query = {};

    if (searchQuery) {
      query = {
        $or: [
          { title: { $regex: searchQuery, $options: "i" } },
          { excerpt: { $regex: searchQuery, $options: "i" } },
          { category: { $regex: searchQuery, $options: "i" } }
        ]
      };
    }

    const posts = await Blog.find(query).sort({ date: -1 });
    res.json(posts); // Return JSON for AJAX
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
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


    res.render("blogDetail", { 
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
