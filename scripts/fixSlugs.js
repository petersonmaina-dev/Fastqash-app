// scripts/fixSlugs.js
require("dotenv").config();
const sequelize = require("../config/db");
const Blog = require("../models/blog");
const slugify = require("slugify");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to MySQL");

    const blogs = await Blog.findAll();
    console.log(`Found ${blogs.length} posts.`);

    for (let blog of blogs) {
      const newSlug = slugify(blog.title, { lower: true, strict: true });
      if (blog.slug !== newSlug) {
        console.log(`Updating: ${blog.title} → ${newSlug}`);
        blog.slug = newSlug;
        await blog.save();
      }
    }

    console.log("✅ All slugs updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating slugs:", err);
    process.exit(1);
  }
})();
