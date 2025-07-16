import { createClient } from "@supabase/supabase-js";
import * as formidable from "formidable";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import fetch from "node-fetch";

export const config = {
  api: { bodyParser: false },
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName) || ".png";
  return `car-${timestamp}-${randomId}${extension}`;
}

// Helper: validate file
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
    let tempFiles = [];
    let userId = fields.userId || fields.userid || fields.USERID || req.headers["x-user-id"];
    let newFilePath; // <-- Fix: declare newFilePath so it is always defined
    try {
      if (err) {
        return res.status(500).json({ error: "Form parse error" });
      }

      if (!files.file || !files.file[0]) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      // Check credits in Supabase
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();
      if (profileError || !profile) {
        return res.status(403).json({ error: "User not found" });
      }
      if ((profile.credits ?? 0) < 1) {
        return res.status(403).json({ error: "Not enough credits" });
      }

      const file = files.file[0];
      validateFile(file);

      const originalName = file.originalFilename || "uploaded-image";
      const fileName = generateUniqueFileName(originalName);
      const uploadsDir = "/tmp/uploads";

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      newFilePath = path.join(uploadsDir, fileName);
      fs.renameSync(file.filepath, newFilePath);
      console.log("✅ File moved to:", newFilePath);

      // Upload to Supabase first to get public URL
      const supaTempFileName = `original-car-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}${path.extname(fileName)}`;
      const { error: tempUploadError } = await supabase.storage
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

      // Call remove.bg API
      console.log("🤖 Removing background with remove.bg...");
      const removeBgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": process.env.REMOVEBG_API_KEY,
        },
        body: new URLSearchParams({
          image_url: carUrl,
          size: "auto",
          add_shadow: "true",
          bg_type: "auto"
        }),
      });
      if (!removeBgRes.ok) {
        const errorText = await removeBgRes.text();
        throw new Error(`remove.bg error: ${errorText}`);
      }
      const bgRemovedBuffer = await removeBgRes.buffer();
      console.log("✅ Background removed");

      // Create new minimalistic background
      const width = 1920;
      const height = 1080;
      const wallHeight = Math.floor(height * 0.65); // top part
      const floorHeight = height - wallHeight;

      // Wall (top) layer
      const wall = {
        create: {
          width: width,
          height: wallHeight,
          channels: 3,
          background: "#ffffff",
        },
      };

      // Floor (bottom) layer
      const floor = {
        create: {
          width,
          height: floorHeight,
          channels: 3,
          background: "#1F1F1F",
        },
      };

      // Merge wall and floor
      const wallBuffer = await sharp(wall).toBuffer();
      const floorBuffer = await sharp(floor).toBuffer();

      const background = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: "#FFFFFF", // temp background
        },
      })
        .composite([
          { input: wallBuffer, top: 0, left: 0 },
          { input: floorBuffer, top: wallHeight, left: 0 },
        ])
        .toBuffer();

      // Optional shadow under car
      const shadow = await sharp({
        create: {
          width: 800,
          height: 200,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0.3 },
        },
      })
        .blur(50)
        .toBuffer();

      // Compose final image
      const finalImage = await sharp(background)
        .composite([
          { input: shadow, top: wallHeight - 100, left: (width - 800) / 2 },
          { input: bgRemovedBuffer, top: 0, left: 0 },
        ])
        .png()
        .toBuffer();

      // Upload final image to Supabase
      const finalFileName = `luxury-showroom-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}.png`;

      const { error: finalUploadError } = await supabase.storage
        .from("car-images")
        .upload(finalFileName, finalBuffer, {
          contentType: "image/png",
          upsert: false,
        });

      if (finalUploadError) {
        throw new Error(`Supabase final upload error: ${finalUploadError.message}`);
      }

      // Atomically decrement credits
      const { error: updateError } = await supabase.rpc("decrement_credits", { user_id: userId, amount: 1 });
      if (updateError) {
        return res.status(500).json({ error: "Failed to decrement credits" });
      }

      const { data: finalPublicUrlData } = supabase
        .storage
        .from("car-images")
        .getPublicUrl(finalFileName);
      const finalPublicUrl = finalPublicUrlData.publicUrl;

      res.status(200).json({
        imageUrl: finalPublicUrl,
        success: true,
        message: "Image processed and uploaded successfully",
      });
    } catch (error) {
      console.error("🔥 API error:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    } finally {
      try {
        if (newFilePath && fs.existsSync(newFilePath)) {
          fs.unlinkSync(newFilePath);
          console.log("🧹 Cleaned up local file");
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup file:", cleanupError);
      }
    }
  });
}
