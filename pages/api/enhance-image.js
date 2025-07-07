import { createClient } from "@supabase/supabase-js";
import * as formidable from "formidable";
import fs from "fs";
import path from "path";
import Replicate from "replicate";
import sharp from "sharp";

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

function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName) || '.png';
  return `car-${timestamp}-${randomId}${extension}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable.default({
    uploadDir: "./",
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    multiples: false,
  });

  form.parse(req, async (err, fields, files) => {
    let localFilePath = null;

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

      const originalName = file.originalFilename || "uploaded-car.png";
      const fileName = generateUniqueFileName(originalName);

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      localFilePath = path.join(uploadsDir, fileName);
      fs.renameSync(file.filepath, localFilePath);
      console.log("✅ Saved file to:", localFilePath);

      // Build public URL
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const publicUrl = `${baseUrl}/uploads/${fileName}`;

      // 🔥 Remove background using Replicate RemBG
      console.log("🤖 Removing background with Replicate...");
      const output = await replicate.run(
        "cjwbw/rembg",
        {
          input: {
            image: publicUrl,
          },
        }
      );

      if (!output || !output[0]) {
        throw new Error("Replicate RemBG did not return a valid output URL");
      }

      const transparentUrl = output[0];
      console.log("✅ Background removed, URL:", transparentUrl);

      // Download transparent car image
      const response = await fetch(transparentUrl);
      if (!response.ok) {
        throw new Error(`Failed to download transparent car image: ${response.statusText}`);
      }
      const carBuffer = await response.arrayBuffer();

      // Prepare background
      const showroomBgPath = path.join(process.cwd(), "public", "showroom-bg.png");
      if (!fs.existsSync(showroomBgPath)) {
        throw new Error("Showroom background image not found at /public/showroom-bg.png");
      }

      // Composite with Sharp
      console.log("🖌️ Compositing car on showroom background...");
      const showroomBuffer = fs.readFileSync(showroomBgPath);
      const finalBuffer = await sharp(showroomBuffer)
        .composite([{ input: Buffer.from(carBuffer), blend: "over" }])
        .png()
        .toBuffer();

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
      console.log("✅ Uploaded to Supabase, URL:", finalPublicUrl);

      return res.status(200).json({
        imageUrl: finalPublicUrl,
        success: true,
        message: "Image processed and uploaded successfully",
      });
    } catch (error) {
      console.error("🔥 API error:", error);
      return res.status(500).json({ error: error.message || "Unknown error" });
    } finally {
      try {
        if (localFilePath && fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
          console.log("🧹 Cleaned up local file");
        }
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }
  });
}
