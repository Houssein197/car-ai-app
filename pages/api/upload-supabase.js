require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const app = express();

// Store uploaded file in memory
const upload = multer({ storage: multer.memoryStorage() });

// Connect to Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );  

const bucketName = 'car-images'; // your bucket name in Supabase

app.post('/upload', upload.single('pdf'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileName = Date.now() + '-' + file.originalname;

  // Upload to Supabase bucket
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Get public URL for the uploaded file
  const { data: publicUrlData } = supabase
    .storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return res.json({ url: publicUrlData.publicUrl });
});

app.listen(3000, () => {
  console.log('Supabase upload server running on http://localhost:3000');
});
