// server.js
require("dotenv").config(); // ✅ Must be at the very top
console.log("🚀 Starting Fastqash app...");
console.log("Environment:", process.env.NODE_ENV);
console.log("DB Host:", process.env.MYSQL_HOST);
console.log("DB Name:", process.env.MYSQL_DB);

const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

// ✅ Add sitemap deps
const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");
const Blog = require("./models/blog"); // Sequelize model

// Sequelize connection
const sequelize = require("./config/db");

// Test DB connection
sequelize.authenticate()
  .then(() => console.log("✅ MySQL Connected"))
  .catch(err => console.error("❌ MySQL Error:", err));

const app = express();

// ===== Middleware =====
console.log("⚙️ Setting up middleware...");
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve static files
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

// Sessions with MySQL
console.log("⚙️ Setting up session store...");
const sessionStore = new MySQLStore({
  host: process.env.MYSQL_HOST,
  port: 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallbacksecret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1hr
  })
);

// View engine
console.log("⚙️ Setting up view engine...");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", false);

// ===== Routes =====
console.log("⚙️ Loading routes...");
const adminRoutes = require("./routes/adminRoutes");
const publicRoutes = require("./routes/publicRoutes");
app.use("/admin", adminRoutes);
app.use("/", publicRoutes);

// ✅ Dynamic Sitemap Route (Sequelize version)
app.get("/sitemap.xml", async (req, res) => {
  try {
    console.log("📄 Generating sitemap...");
    const blogs = await Blog.findAll({ attributes: ["slug", "updatedAt"] });

    const links = [
      { url: "/", changefreq: "daily", priority: 1.0 },
      { url: "/terms", changefreq: "monthly", priority: 0.8 },
      { url: "/contacts", changefreq: "monthly", priority: 0.8 },
      { url: "/privacy-policy", changefreq: "monthly", priority: 0.6 },
      { url: "/register", changefreq: "weekly", priority: 0.9 },
      { url: "/faqs", changefreq: "weekly", priority: 0.7 },
      { url: "/legitimacy", changefreq: "monthly", priority: 0.7 },
      { url: "/ghana", changefreq: "daily", priority: 0.8 },
      { url: "/kenya", changefreq: "weekly", priority: 0.8 },
      { url: "/gallery", changefreq: "monthly", priority: 0.7 },
      { url: "/zambia", changefreq: "monthly", priority: 0.8 },
      { url: "/how-it-works", changefreq: "monthly", priority: 0.6 },
      { url: "/blog", changefreq: "daily", priority: 1.0 },
    ];

    blogs.forEach(blog => {
      links.push({
        url: `/blog/${blog.slug}`,
        changefreq: "daily",
        priority: 0.9,
        lastmod: blog.updatedAt ? blog.updatedAt.toISOString() : undefined,
      });
    });

    const stream = new SitemapStream({ hostname: "https://www.fastqashagencies.com" });
    const xml = await streamToPromise(Readable.from(links).pipe(stream)).then(data =>
      data.toString()
    );

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error("❌ Sitemap error:", err);
    res.status(500).end();
  }
});

// Default 404
app.use((req, res) => {
  console.warn("⚠️ 404 Not Found:", req.originalUrl);
  res.status(404).render("404", { title: "Page Not Found" });
});

// Start server (sync DB first)
const PORT = process.env.PORT || 5000;
console.log("⚙️ Syncing database and starting server...");
sequelize.sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Server startup error:", err);
  });
