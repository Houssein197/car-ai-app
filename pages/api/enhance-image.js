import * as formidable from "formidable";
import fs from "fs";
import path from "path";
import sharp from "sharp";
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable.default();
  form.uploadDir = "./";
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Form parse error" });
    }

    const file = files.file[0];
    const filePath = file.filepath;

    try {
      // Upload to Replicate delivery
      const fileBuffer = fs.readFileSync(filePath);

      const uploadRes = await fetch("https://api.replicate.delivery/v1/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        },
        body: fileBuffer,
      });

      const uploadData = await uploadRes.json();
      const uploadedUrl = uploadData.url;

      console.log("✅ Uploaded image URL for rembg:", uploadedUrl);

      // Call rembg with uploaded URL
      const rembgOutput = await replicate.run("cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003", {
        input: {
          image: uploadedUrl,
        },
      });

      console.log("✅ rembg output:", rembgOutput);

      const carImageUrl = rembgOutput[0];
      console.log("Car without background URL:", carImageUrl);

      // Download car transparent image
      const carBuffer = await fetch(carImageUrl).then((res) => res.arrayBuffer());

      // Load showroom background
      const showroomPath = path.join(process.cwd(), "public", "showroom-bg.png");

      const finalBuffer = await sharp(showroomPath)
        .composite([{ input: Buffer.from(carBuffer), gravity: "center" }])
        .png()
        .toBuffer();

      // Save final image
      const outputFileName = `public/uploads/composited-${Date.now()}.png`;
      fs.writeFileSync(outputFileName, finalBuffer);

      const finalUrl = `/uploads/${path.basename(outputFileName)}`;
      console.log("✅ Returning final URL to frontend:", finalUrl);

      return res.status(200).json({ imageUrl: finalUrl });
    } catch (error) {
      console.error("🔥 Processing error:", error);
      return res.status(500).json({ error: "Image processing failed" });
    } finally {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
    }
  });
}
