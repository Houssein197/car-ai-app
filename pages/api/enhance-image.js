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
  const extension = path.extname(originalName) || ".jpg";
  return `car-${timestamp}-${randomId}${extension}`;
}

// Helper function to validate file
function validateFile(file) {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type. Only JPG and PNG files are allowed.");
  }

  if (file.size > maxSize) {
    throw new Error("File size must be less than 10MB.");
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable.default({
    uploadDir: "/tmp",
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
    multiples: false,
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
      const originalName = file.originalFilename || "uploaded-image";
      const fileName = generateUniqueFileName(originalName);

      // Use /tmp for Vercel, public/uploads locally
      const isVercel = process.env.VERCEL === "1";
      const uploadsDir = isVercel
        ? path.join("/tmp", "uploads")
        : path.join(process.cwd(), "public", "uploads");

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      newFilePath = path.join(uploadsDir, fileName);
      fs.renameSync(filePath, newFilePath);
      console.log("✅ File moved to uploads directory:", fileName);

      // ✅ Upload original to Supabase first
      const supaTempFileName = `original-car-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}${path.extname(fileName)}`;
      console.log("☁️ Uploading original file to Supabase first:", supaTempFileName);

      const { data: tempUploadData, error: tempUploadError } = await supabase.storage
        .from("car-images")
        .upload(supaTempFileName, fs.readFileSync(newFilePath), {
          contentType: file.mimetype,
          upsert: false,
        });

      if (tempUploadError) {
        throw new Error(`Supabase upload error: ${tempUploadError.message}`);
      }

      const { data: tempPublicUrlData } = supabase
        .storage
        .from("car-images")
        .getPublicUrl(supaTempFileName);

      const supaPublicUrl = tempPublicUrlData.publicUrl;
      console.log("✅ Uploaded to Supabase, public URL for Replicate:", supaPublicUrl);

      // 🔥 Call Replicate with public Supabase URL
      console.log("🤖 Removing background with Replicate...");

      const prediction = await replicate.predictions.create({
        version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003", // rembg
        input: {
          image: supaPublicUrl,
        },
      });

      console.log("🟢 Prediction status:", prediction.status);

      // Wait for prediction to finish
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

      return res.status(200).json({
        imageUrl: finalImageUrl,
        success: true,
        message: "Image processed and background removed successfully",
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
