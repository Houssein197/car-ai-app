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

// Ensure uploads directory exists for temporary files
const ensureUploadsDir = () => {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check for required environment variables
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("❌ REPLICATE_API_TOKEN not configured");
    return res.status(500).json({ error: "REPLICATE_API_TOKEN not configured" });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Supabase configuration missing");
    return res.status(500).json({ error: "Supabase configuration missing" });
  }

  const form = formidable.default();
  form.uploadDir = "./";
  form.keepExtensions = true;
  form.maxFileSize = 10 * 1024 * 1024; // 10MB limit

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("🔥 Form parse error:", err);
      return res.status(500).json({ error: "Form parse error" });
    }

    if (!files.file || !files.file[0]) {
      console.error("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = files.file[0];
    const filePath = file.filepath;
    const originalName = file.originalFilename;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      console.error("❌ Invalid file type:", file.mimetype);
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Invalid file type. Please upload JPG or PNG images only." });
    }

    try {
      console.log("🚀 Starting image processing...");
      console.log("📁 Processing file:", originalName);
      console.log("📏 File size:", file.size, "bytes");
      console.log("🎨 File type:", file.mimetype);
      
      // Ensure uploads directory exists
      const uploadsDir = ensureUploadsDir();
      
      // Read the uploaded file
      const fileBuffer = fs.readFileSync(filePath);
      console.log("✅ File read successfully, size:", fileBuffer.length, "bytes");

      // Convert to base64 for Replicate
      console.log("🔄 Converting image to base64...");
      const base64Image = fileBuffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64Image}`;
      console.log("✅ Image converted to base64");

      // Use Flux Kontext Pro to remove background and place in luxury showroom
      console.log("🤖 Processing with Flux Kontext Pro...");
      console.log("📝 Using improved prompt for better results...");
      
      let fluxOutput;
      try {
        fluxOutput = await replicate.run("black-forest-labs/flux-kontext-pro", {
          input: {
            image: dataUrl,
            prompt: "Keep the original car exactly as is. Only replace the background with a luxury white showroom with glossy floor and bright lighting. Do not change the car.",
            negative_prompt: "blurry, low quality, distorted, new cars, different cars, car modifications, hallucinated vehicles",
            num_inference_steps: 20,
            guidance_scale: 7.5,
            strength: 0.5, // Lower strength to avoid hallucination
            seed: Math.floor(Math.random() * 1000000)
          },
        });
        
        console.log("🔍 Flux Kontext Pro raw output:", JSON.stringify(fluxOutput, null, 2));
        
      } catch (replicateError) {
        console.error("🔥 Flux Kontext Pro API error:", replicateError);
        throw new Error(`Flux Kontext Pro API failed: ${replicateError.message}`);
      }

      // Extract the processed image URL
      if (!fluxOutput) {
        console.error("❌ Flux Kontext Pro returned empty response");
        throw new Error("Flux Kontext Pro returned empty response");
      }

      let finalImageUrl;
      if (Array.isArray(fluxOutput)) {
        finalImageUrl = fluxOutput[0];
      } else if (typeof fluxOutput === 'string') {
        finalImageUrl = fluxOutput;
      } else {
        finalImageUrl = fluxOutput.url || fluxOutput.image || fluxOutput.output;
      }

      if (!finalImageUrl) {
        console.error("❌ Could not extract final image URL from Flux Kontext Pro response");
        throw new Error("Failed to extract processed image URL from Flux Kontext Pro response");
      }

      console.log("✅ Flux Kontext Pro processing completed");
      console.log("🎨 Final image URL:", finalImageUrl);

      // Download the final image with retry logic
      console.log("📥 Downloading final processed image...");
      console.log("🔗 Download URL:", finalImageUrl);
      let finalResponse;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          finalResponse = await fetch(finalImageUrl, {
            timeout: 30000, // 30 second timeout
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; CarAI/1.0)'
            }
          });
          if (!finalResponse.ok) {
            throw new Error(`Failed to download final image: ${finalResponse.status} ${finalResponse.statusText}`);
          }
          break; // Success, exit retry loop
        } catch (fetchError) {
          retryCount++;
          console.error(`🔥 Fetch error (attempt ${retryCount}/${maxRetries}):`, fetchError);
          console.error("🔥 URL that failed:", finalImageUrl);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to download final image from Replicate after ${maxRetries} attempts: ${fetchError.message}`);
          }
          
          // Wait before retrying
          console.log(`⏳ Retrying in ${retryCount * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
        }
      }

      const finalBuffer = await finalResponse.arrayBuffer();
      console.log("✅ Downloaded final image, size:", finalBuffer.byteLength, "bytes");

      // Upload to Supabase storage
      console.log("☁️ Uploading to Supabase storage...");
      
      const timestamp = Date.now();
      const fileName = `luxury-showroom-${timestamp}.png`;
      const fileBufferForUpload = Buffer.from(finalBuffer);

      try {
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('car-images')
          .upload(fileName, fileBufferForUpload, {
            contentType: 'image/png',
            upsert: false,
          });

        if (uploadError) {
          console.error("🔥 Supabase upload error:", uploadError);
          throw new Error(`Supabase upload failed: ${uploadError.message}`);
        }

        console.log("✅ Uploaded to Supabase:", uploadData.path);

        // Get public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('car-images')
          .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;
        console.log("✅ Public URL generated:", publicUrl);
        console.log("🎉 Processing completed successfully!");

        return res.status(200).json({ 
          imageUrl: publicUrl,
          success: true,
          message: "Image processed and uploaded successfully",
          fileName: fileName
        });

      } catch (supabaseError) {
        console.error("🔥 Supabase error:", supabaseError);
        throw new Error(`Supabase operation failed: ${supabaseError.message}`);
      }
      
    } catch (error) {
      console.error("🔥 Processing error:", error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = "Image processing failed";
      let errorDetails = error.message;
      
      if (error.message.includes("REPLICATE_API_TOKEN")) {
        errorMessage = "API configuration error";
        errorDetails = "Replicate API token is missing or invalid. Please check your .env.local file.";
      } else if (error.message.includes("Supabase")) {
        errorMessage = "Storage configuration error";
        errorDetails = "Supabase configuration is missing or invalid. Please check your .env.local file.";
      } else if (error.message.includes("Flux Kontext Pro API failed")) {
        errorMessage = "AI processing error";
        errorDetails = "The AI service encountered an error. Please try again or check your API quota.";
      } else if (error.message.includes("Failed to download")) {
        errorMessage = "Download error";
        errorDetails = "Failed to download processed image. Please try again.";
      } else if (error.message.includes("Supabase upload failed")) {
        errorMessage = "Upload error";
        errorDetails = "Failed to upload image to storage. Please try again.";
      }
      
      return res.status(500).json({ 
        error: errorMessage, 
        details: errorDetails,
        fullError: error.message
      });
    } finally {
      // Clean up uploaded file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("🧹 Cleaned up temporary file");
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup temporary file:", cleanupError);
      }
    }
  });
}
