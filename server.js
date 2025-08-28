// server.js
require("dotenv").config(); // ✅ Must be at the very top
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const connectDB = require("./config/db");
const expressLayouts = require('express-ejs-layouts');

const app = express();

// Connect to DB
connectDB();

// ===== Middleware =====
// For parsing application/json with large payloads
app.use(express.json({ limit: '50mb' }));

// For parsing application/x-www-form-urlencoded with large payloads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the "public" directory
app.use(express.static('public'));

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

// Static files
app.use(express.static(path.join(__dirname, "public")));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Express EJS Layouts
app.use(expressLayouts);


// Default: no layout unless you specify
app.set("layout", false);

// ===== Routes =====
const adminRoutes = require("./routes/adminRoutes");
const publicRoutes = require("./routes/publicRoutes");

// Admin routes → already sets admin layout internally
app.use("/admin", adminRoutes);

// Public routes
app.use("/", publicRoutes);

// Default 404
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
