const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const slugify = require("slugify");

const Blog = sequelize.define("Blog", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  excerpt: {
    type: DataTypes.STRING,
  },
  content: {
    type: DataTypes.TEXT,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: "General",
  },
  slug: {
    type: DataTypes.STRING,
    unique: true,
  },
  image: {
    type: DataTypes.STRING, // Cloudinary URL
  },
  imageId: {
    type: DataTypes.STRING, // Cloudinary public_id
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Hook to auto-generate slug
Blog.beforeCreate((blog) => {
  if (blog.title) {
    blog.slug = slugify(blog.title, { lower: true, strict: true });
  }
});

Blog.beforeUpdate((blog) => {
  if (blog.changed("title")) {
    blog.slug = slugify(blog.title, { lower: true, strict: true });
  }
});

module.exports = Blog;
