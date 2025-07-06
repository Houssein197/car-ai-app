import { createClient } from "@supabase/supabase-js";
import * as formidable from "formidable";
import fs from "fs";
import Replicate from "replicate";
import fetch from "node-fetch";
import path from "path";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable.default();
  form.uploadDir = "./";
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    let filePath = null;
    try {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(500).json({ error: "Form parse error" });
      }

      if (!files.file || !files.file[0]) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = files.file[0];
      filePath = file.filepath;

      // Build public URL to local file (for local dev only)
      const fileName = path.basename(filePath);
      const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/uploads/${fileName}`;

      console.log("📤 Using public URL:", publicUrl);

      // Call Replicate with public URL
      const output = await replicate.run("black-forest-labs/flux-kontext-pro", {
        input: {
          image: publicUrl,
          prompt:
            "Keep the original car exactly as is. Only replace the background with a luxury white showroom with glossy floor and bright lighting. Do not change the car.",
          negative_prompt:
            "blurry, low quality, distorted, new cars, different cars, car modifications, hallucinated vehicles",
          num_inference_steps: 20,
          guidance_scale: 7.5,
          strength: 0.5,
          seed: Math.floor(Math.random() * 1000000),
        },
      });

      console.log("🔍 Replicate output:", output);

      let finalImageUrl;
      if (Array.isArray(output)) {
        finalImageUrl = output[0];
      } else if (typeof output === "string") {
        finalImageUrl = output;
      } else {
        finalImageUrl = output.output || output.url;
      }

      if (!finalImageUrl) {
        throw new Error("No final image URL found from Replicate");
      }

      // Download final image
      const finalResponse = await fetch(finalImageUrl);
      if (!finalResponse.ok) {
        throw new Error(`Failed to download final image: ${finalResponse.status}`);
      }

      const finalBuffer = await finalResponse.arrayBuffer();
      console.log("✅ Final image downloaded, size:", finalBuffer.byteLength);

      // Upload to Supabase
      const supaFileName = `luxury-showroom-${Date.now()}.png`;
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

      // Always respond with JSON
      return res.status(200).json({
        imageUrl: finalPublicUrl,
        success: true,
        message: "Image processed and uploaded successfully",
      });
    } catch (error) {
      console.error("🔥 API error:", error);
      return res.status(500).json({ error: error.message || "Unknown error" });
    } finally {
      // Clean up
      try {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("🧹 Cleaned up temporary file");
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup file:", cleanupError);
      }
    }
  });
}
