require('dotenv').config();
const cloudinary = require('./config/cloudinary');

async function testUpload() {
  try {
    // A tiny 1x1 pixel PNG base64 string for testing
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wIAAgMBAZ9c4dEAAAAASUVORK5CYII=';

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'fastqash-test'
    });

    console.log('✅ Upload success:', result.secure_url);
  } catch (err) {
    console.error('❌ Upload failed:', err);
  }
}

testUpload();
