// server.js
require("dotenv").config(); // ✅ Must be at the very top
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const connectDB = require("./config/db");
const expressLayouts = require('express-ejs-layouts');

// ✅ Add sitemap deps
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const Blog = require('./models/blog'); // <-- make sure this path is correct

const app = express();

// Connect to DB
connectDB();

// ===== Middleware =====
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, "public")));

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: { maxAge: 1000 * 60 * 60 }, // 1hr
  })
);

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", false);

// ===== Routes =====
const adminRoutes = require("./routes/adminRoutes");
const publicRoutes = require("./routes/publicRoutes");
app.use("/admin", adminRoutes);
app.use("/", publicRoutes);

// ✅ Dynamic Sitemap Route
app.get('/sitemap.xml', async (req, res) => {
  try {
    // Fetch blogs from DB
    const blogs = await Blog.find().select('slug updatedAt');

    // Static routes
    const links = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/terms', changefreq: 'monthly', priority: 0.8 },
      { url: '/contacts', changefreq: 'monthly', priority: 0.8 },
      { url: '/privacy-policy', changefreq: 'monthly', priority: 0.6 },
      { url: '/register', changefreq: 'weekly', priority: 0.9 },
      { url: '/faqs', changefreq: 'weekly', priority: 0.7 },
      { url: '/legitimacy', changefreq: 'monthly', priority: 0.7 },
      { url: '/ghana', changefreq: 'daily', priority: 0.8 },
      { url: '/kenya', changefreq: 'weekly', priority: 0.8 },
      { url: '/gallery', changefreq: 'monthly', priority: 0.7 },
      { url: '/zambia', changefreq: 'monthly', priority: 0.8 },
      { url: '/how-it-works', changefreq: 'monthly', priority: 0.6 },
      { url: '/blog', changefreq: 'daily', priority: 1.0 },
    
    ];

    // Add blogs dynamically
    blogs.forEach(blog => {
      links.push({
        url: `/blog/${post.slug}`,
        changefreq: 'daily',
        priority: 0.9,
        lastmod: blog.updatedAt ? blog.updatedAt.toISOString() : undefined
      });
    });

    // Build sitemap
    const stream = new SitemapStream({ hostname: 'https://www.fastqashagencies.com' });
    const xml = await streamToPromise(Readable.from(links).pipe(stream)).then(data => data.toString());

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error("❌ Sitemap error:", err);
    res.status(500).end();
  }
});

// Default 404
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
