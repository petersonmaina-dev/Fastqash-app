const mongoose = require('mongoose');
const slugify = require('slugify');

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String },
  content: { type: String },
  image: { type: String },
  category: { type: String, default: 'General' },
  slug: { type: String, unique: true },
  image: String,      // Cloudinary URL
  imageId: String,    // Cloudinary public_id (for deletion)
  date: { type: Date, default: Date.now }
});

// Auto-generate slug before save
BlogSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// Check if the model already exists before defining it
module.exports = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
