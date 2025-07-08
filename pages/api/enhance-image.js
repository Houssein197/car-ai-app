import { createClient } from "@supabase/supabase-js";
import * as formidable from "formidable";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper: generate unique filename
function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName) || ".jpg";
  return `car-${timestamp}-${randomId}${extension}`;
}

// Helper: validate file
function validateFile(file) {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type. Only JPG and PNG allowed.");
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
      validateFile(file);

      const filePath = file.filepath;
      const originalName = file.originalFilename || "uploaded-image";
      const fileName = generateUniqueFileName(originalName);

      // Local or Vercel
      const isVercel = process.env.VERCEL === "1";
      const uploadsDir = isVercel ? path.join("/tmp", "uploads") : path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      newFilePath = path.join(uploadsDir, fileName);
      fs.renameSync(filePath, newFilePath);

      // Upload to Supabase first
      const supaTempFileName = `original-car-${Date.now()}-${Math.random().toString(36).substring(2, 15)}${path.extname(fileName)}`;
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
      const carUrl = tempPublicUrlData.publicUrl;

      // 🔥 Remove background with remove.bg
      if (!process.env.REMOVEBG_API_KEY) {
        throw new Error("Missing remove.bg API key!");
      }
      console.log("🤖 Removing background with remove.bg...");
      const removeBgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": process.env.REMOVEBG_API_KEY,
        },
        body: new URLSearchParams({
          image_url: carUrl,
          size: "auto",
        }),
      });
      if (!removeBgRes.ok) {
        const errorText = await removeBgRes.text();
        throw new Error(`remove.bg error: ${errorText}`);
      }
      const bgRemovedBuffer = await removeBgRes.buffer();
      console.log("✅ Background removed.");

      // Get original image dimensions
      const originalMeta = await sharp(fs.readFileSync(newFilePath)).metadata();
      const { width, height } = originalMeta;

      // Create minimalistic showroom background
      const wallHeight = Math.floor(height * 0.6);
      const floorHeight = height - wallHeight;

      // Wall (top): #F5F5F5
      const wall = {
        create: {
          width,
          height: wallHeight,
          channels: 3,
          background: "#F5F5F5",
        },
      };
      // Floor (bottom): #1F1F1F
      const floor = {
        create: {
          width,
          height: floorHeight,
          channels: 3,
          background: "#1F1F1F",
        },
      };

      const wallBuffer = await sharp(wall).png().toBuffer();
      const floorBuffer = await sharp(floor).png().toBuffer();

      // Combine wall and floor vertically
      const showroomBuffer = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: "#ffffff",
        },
      })
        .composite([
          { input: wallBuffer, top: 0, left: 0 },
          { input: floorBuffer, top: wallHeight, left: 0 },
        ])
        .png()
        .toBuffer();

      // Composite car PNG onto showroom
      const finalBuffer = await sharp(showroomBuffer)
        .composite([{ input: bgRemovedBuffer, top: 0, left: 0 }])
        .png()
        .toBuffer();

      // Upload final to Supabase
      const finalFileName = `luxury-showroom-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;
      const { data: finalUploadData, error: finalUploadError } = await supabase.storage
        .from("car-images")
        .upload(finalFileName, finalBuffer, {
          contentType: "image/png",
          upsert: false,
        });
      if (finalUploadError) {
        throw new Error(`Supabase upload error: ${finalUploadError.message}`);
      }
      const { data: finalPublicUrlData } = supabase
        .storage
        .from("car-images")
        .getPublicUrl(finalFileName);
      const finalPublicUrl = finalPublicUrlData.publicUrl;

      return res.status(200).json({
        imageUrl: finalPublicUrl,
        success: true,
        message: "Image processed and composited successfully",
      });
    } catch (error) {
      console.error("🔥 API error:", error);
      return res.status(500).json({ error: error.message || "Unknown error" });
    } finally {
      try {
        if (newFilePath && fs.existsSync(newFilePath)) {
          fs.unlinkSync(newFilePath);
          console.log("🧹 Cleaned up local file");
        }
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }
  });
}
