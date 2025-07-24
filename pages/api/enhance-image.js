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
    if (Array.isArray(userId)) {
      userId = userId[0];
    }
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
      const { data: creditRow, error: creditError } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();
      if (creditError || !creditRow) {
        return res.status(403).json({ error: "User not found or no credits record" });
      }
      if ((creditRow.balance ?? 0) < 1) {
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

      // Wait for Supabase public URL to be available
      await new Promise(r => setTimeout(r, 1500));

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
      const contentType = removeBgRes.headers.get('content-type');
      console.log('remove.bg content-type:', contentType);

      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('remove.bg did not return an image. Check your API key, credits, or file type.');
      }

      if (!bgRemovedBuffer || bgRemovedBuffer.length < 1000) {
        throw new Error("remove.bg did not return a valid image. Buffer too small.");
      }

      // Validate the buffer is a real image before proceeding
      try {
        await sharp(bgRemovedBuffer).metadata(); // Just validation here
      } catch (err) {
        // Log the first 200 bytes for debugging
        console.error("remove.bg buffer is not a valid image. First 200 bytes as text:\n", bgRemovedBuffer.slice(0, 200).toString());
        throw new Error("Invalid image returned from remove.bg — sharp couldn't read it.");
      }

      // Get dimensions of the car image returned from remove.bg
      const carMeta = await sharp(bgRemovedBuffer).metadata();
      const carWidth = carMeta.width;
      const carHeight = carMeta.height;
      const padding = 80; // px padding around car
      const wallHeight = Math.floor(carHeight * 0.65) + Math.floor(padding / 2);
      const floorHeight = Math.floor(carHeight * 0.35) + Math.floor(padding / 2);
      const bgWidth = carWidth + padding * 2;
      const bgHeight = wallHeight + floorHeight;

      // --- MODERN GRADIENT BACKGROUND BASED ON CAR SIZE ---
      // Create a vertical gradient from #f5f5f5 (top) to #ffffff (bottom)
      const { createCanvas } = require('canvas');
      const canvas = createCanvas(bgWidth, bgHeight);
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, bgHeight);
      gradient.addColorStop(0, '#f5f5f5');
      gradient.addColorStop(1, '#ffffff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, bgWidth, bgHeight);
      const background = canvas.toBuffer('image/png');

      // Center car horizontally, place at top with padding
      const carLeft = Math.floor((bgWidth - carWidth) / 2);
      const carTop = Math.floor(padding / 2);

      // Ensure car image buffer is a valid PNG for sharp composite
      let carImage;
      try {
        carImage = await sharp(bgRemovedBuffer).png().toBuffer();
      } catch (err) {
        // Log the first 200 bytes for debugging
        console.error("remove.bg buffer could not be converted to PNG. First 200 bytes as text:\n", bgRemovedBuffer.slice(0, 200).toString());
        return res.status(500).json({ error: "remove.bg returned an invalid image buffer. Possibly an HTML or error message." });
      }

      // Compose final image (no custom shadow)
      let finalImage;
      try {
        finalImage = await sharp(background)
          .composite([
            { input: carImage, top: carTop, left: carLeft },
          ])
          .png()
          .toBuffer();
      } catch (err) {
        throw new Error("Sharp failed to compose the image: " + err.message);
      }

      // Upload final image to Supabase
      const finalFileName = `luxury-showroom-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}.png`;

      const { error: finalUploadError } = await supabase.storage
        .from("car-images")
        .upload(finalFileName, finalImage, {
          contentType: "image/png",
          upsert: false,
        });

      if (finalUploadError) {
        throw new Error(`Supabase final upload error: ${finalUploadError.message}`);
      }

      // Atomically decrement credits ONLY after successful upload
      const { error: updateError, data: updateData } = await supabase
        .from("credits")
        .update({ 
          balance: creditRow.balance - 1,
          last_updated: new Date().toISOString()
        })
        .eq("user_id", userId)
        .select();
      if (updateError) {
        console.error("❌ Failed to decrement credits:", updateError);
        // Optionally: delete the uploaded image if credit decrement fails
        await supabase.storage.from("car-images").remove([finalFileName]);
        return res.status(500).json({ error: updateError.message || "Failed to decrement credits. Image not delivered." });
      }

      const { data: finalPublicUrlData } = supabase
        .storage
        .from("car-images")
        .getPublicUrl(finalFileName);
      const finalPublicUrl = finalPublicUrlData.publicUrl;

      return res.status(200).json({
        imageUrl: finalPublicUrlData.publicUrl,
        name: finalFileName,
        success: true
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
