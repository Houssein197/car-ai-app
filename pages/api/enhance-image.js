import { createClient } from "@supabase/supabase-js";
import * as formidable from "formidable";
import fs from "fs";
import path from "path";
import Replicate from "replicate";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false,
  },
};

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to generate unique filename
function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName) || '.jpg';
  return `car-${timestamp}-${randomId}${extension}`;
}

// Helper function to validate file
function validateFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPG and PNG files are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB.');
  }
}

// Helper function to validate and clean URL
function validateAndCleanUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL: URL is not a string or is empty');
  }
  
  // Remove any whitespace
  url = url.trim();
  
  // Check if it's a valid URL
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`);
  }
  
  return url;
}

// Helper function to wait for URL to be accessible
async function waitForUrlAccess(url, maxAttempts = 10, delay = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔍 Checking URL accessibility (attempt ${attempt}/${maxAttempts}): ${url}`);
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 10000 
      });
      
      if (response.ok) {
        console.log(`✅ URL is accessible: ${url}`);
        return true;
      } else {
        console.log(`⚠️ URL returned status ${response.status}, retrying...`);
      }
    } catch (error) {
      console.log(`⚠️ URL check failed (attempt ${attempt}): ${error.message}`);
    }
    
    if (attempt < maxAttempts) {
      console.log(`⏳ Waiting ${delay}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`URL not accessible after ${maxAttempts} attempts: ${url}`);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Fix: Pass options in constructor for formidable v3+
  const form = formidable.default({
    uploadDir: "./",
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    multiples: false
  });

  form.parse(req, async (err, fields, files) => {
    let newFilePath = null;
    
    
    try {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(500).json({ error: "Form parse error" });
      }

      if (!files.file || !files.file[0]) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = files.file[0];
      console.log("📁 Processing file:", file.originalFilename);
      
      // Validate file
      validateFile(file);

      const filePath = file.filepath;
      const originalName = file.originalFilename || 'uploaded-image';
      const fileName = generateUniqueFileName(originalName);

      // Move file to /public/uploads so it's publicly accessible
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      newFilePath = path.join(uploadsDir, fileName);
      fs.renameSync(filePath, newFilePath);
      console.log("✅ File moved to uploads directory:", fileName);

      // Build public URL for Replicate
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const publicUrl = `${baseUrl}/uploads/${fileName}`;
      console.log("📤 Public URL for Replicate:", publicUrl);

      // 🚨 Replace your existing Replicate call + output parsing section with this:

      // --------------------- START NEW SNIPPET ---------------------

      console.log("🤖 Calling Replicate (Flux Kontext Pro)...");

      // Create prediction directly (more reliable for image editing models)
      const prediction = await replicate.predictions.create({
        version: "0f1178f5a27e9aa2d2d39c8a43c110f7fa7cbf64062ff04a04cd40899e546065", // or your specific version if needed
        input: {
          image: publicUrl,
          prompt: "Change the background to a luxury white showroom with glossy floor and bright lighting. Keep the original car exactly the same without any changes to color, shape, details, or reflections. Do not alter the car at all. Only change the background.",
          negative_prompt: "blurry, low quality, distorted, new cars, different cars, car modifications, hallucinated vehicles",
          num_inference_steps: 20,
          guidance_scale: 7.5,
          strength: 0.5,
          seed: Math.floor(Math.random() * 1000000),
        },
      });

      console.log("🟢 Prediction status:", prediction.status);

      // Wait for the prediction to finish
      while (prediction.status !== "succeeded" && prediction.status !== "failed") {
        console.log("⏳ Waiting for prediction to finish...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const refreshed = await replicate.predictions.get(prediction.id);
        prediction.status = refreshed.status;
        prediction.output = refreshed.output;
        if (prediction.status === "failed") {
          throw new Error(`Replicate prediction failed: ${refreshed.error}`);
        }
      }

      console.log("✅ Prediction succeeded");
      console.log("🔍 Prediction output:", prediction.output);

      let finalImageUrl = "";

      if (Array.isArray(prediction.output) && prediction.output.length > 0 && typeof prediction.output[0] === "string") {
        finalImageUrl = prediction.output[0];
      } else if (typeof prediction.output === "string") {
        finalImageUrl = prediction.output;
      } else {
      throw new Error("Invalid URL: Replicate output did not return a valid URL");
      }

      if (!finalImageUrl) {
        throw new Error("Invalid URL: URL is not a string or is empty");
      }

      console.log("🎨 Final processed image URL:", finalImageUrl);


      // --------------------- END NEW SNIPPET ---------------------

      // Download final image with retry logic
      let finalBuffer;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          console.log(`📥 Downloading final image (attempt ${retryCount + 1}/${maxRetries})...`);
          const finalResponse = await fetch(finalImageUrl, {
            timeout: 30000, // 30 second timeout
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; CarAI/1.0)'
            }
          });
          
          if (!finalResponse.ok) {
            throw new Error(`HTTP ${finalResponse.status}: ${finalResponse.statusText}`);
          }

          finalBuffer = await finalResponse.arrayBuffer();
          console.log("✅ Final image downloaded, size:", finalBuffer.byteLength);
          break; // Success, exit retry loop
        } catch (downloadError) {
          retryCount++;
          console.error(`❌ Download attempt ${retryCount} failed:`, downloadError.message);
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to download final image after ${maxRetries} attempts: ${downloadError.message}`);
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Upload to Supabase
      const supaFileName = `luxury-showroom-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;
      console.log("☁️ Uploading to Supabase:", supaFileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("car-images")
        .upload(supaFileName, Buffer.from(finalBuffer), {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Supabase upload error: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase
        .storage
        .from("car-images")
        .getPublicUrl(supaFileName);

      const finalPublicUrl = publicUrlData.publicUrl;
      console.log("✅ Uploaded to Supabase, public URL:", finalPublicUrl);
      
      return res.status(200).json({
        imageUrl: finalPublicUrl,
        success: true,
        message: "Image processed and uploaded successfully",
      });
    } catch (error) {
      console.error("🔥 API error:", error);
      return res.status(500).json({ error: error.message || "Unknown error" });
    } finally {
      // Clean up local file AFTER processing is complete
      try {
        if (newFilePath && fs.existsSync(newFilePath)) {
          fs.unlinkSync(newFilePath);
          console.log("🧹 Cleaned up uploaded file");
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup file:", cleanupError);
      }
    }
  });
}
