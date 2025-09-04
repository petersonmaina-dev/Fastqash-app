const express = require("express");
const router = express.Router();
const Blog = require("../models/blog");

const { Op } = require("sequelize");


// ✅ Fix for Node.js (dynamic import)
let marked;
(async () => {
  marked = (await import("marked")).marked;
})();

// Homepage → latest posts with sliding window pagination
router.get("/", async (req, res) => {
  try {
    const perPage = 3;
    const page = parseInt(req.query.page) || 1;

    const totalPosts = await Blog.count();
    const totalPages = Math.ceil(totalPosts / perPage);

    const latestPosts = await Blog.findAll({
      order: [["date", "DESC"]],
      offset: (page - 1) * perPage,
      limit: perPage,
    });

    // Helper: Pagination HTML
    function getPaginationHtml(current, total) {
      const middleWindow = 3;
      let startPage = Math.max(2, current - 1);
      let endPage = Math.min(total - 1, current + 1);

      if (current === 1) {
        startPage = 2;
        endPage = 2 + middleWindow - 1;
      }
      if (current === total) {
        startPage = total - middleWindow;
        endPage = total - 1;
      }
      startPage = Math.max(2, startPage);
      endPage = Math.min(total - 1, endPage);

      let html = `<div class="pagination mt-4 text-center"><ul class="pagination justify-content-center">`;
      if (current > 1)
        html += `<li class="page-item"><a class="page-link" href="/?page=${current - 1}">&lt;</a></li>`;
      html += `<li class="page-item ${
        current === 1 ? "active" : ""
      }"><a class="page-link" href="/?page=1">1</a></li>`;
      if (startPage > 2)
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      for (let i = startPage; i <= endPage; i++) {
        html += `<li class="page-item ${
          current === i ? "active" : ""
        }"><a class="page-link" href="/?page=${i}">${i}</a></li>`;
      }
      if (endPage < total - 1)
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      if (total > 1)
        html += `<li class="page-item ${
          current === total ? "active" : ""
        }"><a class="page-link" href="/?page=${total}">${total}</a></li>`;
      if (current < total)
        html += `<li class="page-item"><a class="page-link" href="/?page=${
          current + 1
        }">&gt;</a></li>`;
      html += `</ul></div>`;
      return html;
    }

    // AJAX request
    if (req.xhr || req.headers["x-requested-with"] === "XMLHttpRequest") {
      const postsHtml = latestPosts
        .map(
          (post) => `
        <div class="col-md-4 mb-4 fade-in">
          <div class="card h-100 shadow-sm">
            ${
              post.image
                ? `<img src="${post.image}" class="card-img-top" alt="${post.title}">`
                : ""
            }
            <div class="card-body">
              ${
                post.category
                  ? `<span class="badge bg-primary mb-2">${post.category}</span>`
                  : ""
              }
              <h5 class="card-title">${post.title}</h5>
              <p class="card-text">
                ${
                  post.excerpt
                    ? post.excerpt.substring(0, 100) + "..."
                    : post.content
                    ? post.content.substring(0, 100) + "..."
                    : ""
                }
              </p>
              ${
                post.date
                  ? `<p class="date"><small>${new Date(
                      post.date
                    ).toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}</small></p>`
                  : ""
              }
              <a href="/blog/${post.slug}" class="btn btn-outline-primary">Read More</a>
            </div>
          </div>
        </div>
      `
        )
        .join("");

      const paginationHtml = getPaginationHtml(page, totalPages);

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

// 📰 Blog page
router.get("/blog", (req, res) => {
  res.render("blog", { layout: false, title: "Blog" });
});

// 🔍 Blog search + pagination API
router.get("/blog/search", async (req, res) => {
  try {
    const searchQuery = req.query.q ? req.query.q.trim() : "";
    const page = parseInt(req.query.page) || 1;
    const perPage = 9;

    let where = {};
    if (searchQuery) {
      where = {
        [Op.or]: [
          { title: { [Op.like]: `%${searchQuery}%` } },
          { excerpt: { [Op.like]: `%${searchQuery}%` } },
          { category: { [Op.like]: `%${searchQuery}%` } },
        ],
      };
    }

    const { count: totalPosts, rows: posts } = await Blog.findAndCountAll({
      where,
      order: [["date", "DESC"]],
      offset: (page - 1) * perPage,
      limit: perPage,
    });

    const totalPages = Math.ceil(totalPosts / perPage);

    const postsHtml = posts
      .map(
        (post) => `
      <div class="col-md-4 mb-4 post-item fade-in">
        <div class="card h-100 shadow-sm">
          ${
            post.image
              ? `<img src="${post.image}" class="card-img-top" alt="${post.title}">`
              : ""
          }
          <div class="card-body">
            ${
              post.category
                ? `<span class="badge bg-primary mb-2">${post.category}</span>`
                : ""
            }
            <h5 class="card-title">${post.title}</h5>
            <p class="card-text">
              ${
                post.excerpt
                  ? post.excerpt.substring(0, 100) + "..."
                  : post.content
                  ? post.content.substring(0, 100) + "..."
                  : ""
              }
            </p>
            ${
              post.date
                ? `<p class="date"><small>${new Date(
                    post.date
                  ).toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}</small></p>`
                : ""
            }
            <a href="/blog/${post.slug}" class="btn btn-sm btn-outline-primary">Read More</a>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    // Pagination builder
    let paginationHtml = "";
    if (totalPages > 1) {
      let startPage = Math.max(1, page - 2);
      let endPage = Math.min(totalPages, page + 2);

      paginationHtml += `<ul class="pagination justify-content-center">`;
      if (page > 1) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${
          page - 1
        }">Previous</a></li>`;
      }
      if (startPage > 1) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
        if (startPage > 2)
          paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `<li class="page-item ${
          i === page ? "active" : ""
        }"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
      }
      if (endPage < totalPages) {
        if (endPage < totalPages - 1)
          paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
      }
      if (page < totalPages) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${
          page + 1
        }">Next</a></li>`;
      }
      paginationHtml += `</ul>`;
    }

    res.json({ postsHtml, paginationHtml });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});// Blog detail → by slug
router.get("/blog/:slug", async (req, res) => {
  try {
    const post = await Blog.findOne({ where: { slug: req.params.slug } });

    if (!post) {
      return res.status(404).render("404", { layout: false, title: "Post Not Found" });
    }

    const relatedPosts = await Blog.findAll({
      where: { category: post.category, id: { [Op.ne]: post.id } },
      order: [["date", "DESC"]],
      limit: 3,
    });

    const { marked } = require("marked");
    const contentHTML = marked(post.content || "");

    // --- Safe dates ---
    const safeDate = (d) => {
      const dt = d ? new Date(d) : new Date();
      return isNaN(dt) ? new Date() : dt;
    };

    const publishedDate = safeDate(post.date);
    const modifiedDate = safeDate(post.updatedAt || post.date);

    res.render("blogdetail", {
      post,
      contentHTML,
      relatedPosts,
      publishedDate,
      modifiedDate,
      layout: false,
      title: post.title,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Gallery → posts with images
router.get("/gallery", async (req, res) => {
  try {
    const posts = await Blog.findAll({
      where: { image: { [Op.ne]: "" } },
      order: [["date", "DESC"]],
    });
    res.render("gallery", { posts, layout: false, title: "Gallery" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Register page
router.get("/register", (req, res) => {
  res.render("register", { layout: false });
});

// Static pages
router.get("/legitimacy", (req, res) =>
  res.render("legitimacy", { layout: false, title: "Legitimacy" })
);
router.get("/how-it-works", (req, res) =>
  res.render("how-it-works", { layout: false, title: "How It Works" })
);
router.get("/countries", (req, res) =>
  res.render("countries", { layout: false, title: "Countries" })
);
router.get("/terms", (req, res) =>
  res.render("terms", { layout: false, title: "Terms of Service" })
);
router.get("/privacy-policy", (req, res) =>
  res.render("privacy-policy", { layout: false, title: "Privacy Policy" })
);
router.get("/faqs", (req, res) =>
  res.render("faqs", { layout: false, title: "FAQs" })
);
router.get("/contacts", (req, res) =>
  res.render("contacts", { layout: false, title: "Contact Us" })
);
router.get("/ghana", (req, res) =>
  res.render("ghana", { layout: false, title: "Ghana" })
);
router.get("/kenya", (req, res) =>
  res.render("kenya", { layout: false, title: "Kenya" })
);
router.get("/zambia", (req, res) =>
  res.render("zambia", { layout: false, title: "Zambia" })
);

module.exports = router;
