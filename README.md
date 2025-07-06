# 🚗 Luxury Car Showroom AI

A Next.js application that uses Flux Kontext Pro AI to automatically remove backgrounds from car photos and place them in luxury showroom environments, then stores the results in Supabase cloud storage.

## ✨ Features

- **AI-Powered Background Removal**: Uses Flux Kontext Pro to intelligently remove backgrounds and add luxury showroom environments
- **One-Step Processing**: Background removal and showroom compositing happen in a single AI operation
- **Cloud Storage**: Results are automatically uploaded to Supabase storage with public URLs
- **Real-time Processing**: Live preview and processing status with detailed logging
- **Download & Share**: Download enhanced images or share them directly
- **File Validation**: Supports JPG and PNG images up to 10MB
- **Error Handling**: Comprehensive error handling and user feedback

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19
- **Backend**: Next.js API Routes
- **AI Processing**: Flux Kontext Pro (Replicate)
- **Cloud Storage**: Supabase Storage
- **File Upload**: Formidable
- **Styling**: Inline CSS with modern design

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Replicate API token
- Supabase account with storage bucket

### 1. Clone and Install

```bash
cd car-ai-app
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
cp env.example .env.local
```

Edit `.env.local` and add your API tokens:

```env
REPLICATE_API_TOKEN=your_actual_replicate_api_token_here
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**Get your Replicate API token:**
1. Go to [https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Create a new API token
3. Copy and paste it into your `.env.local` file

**Get your Supabase credentials:**
1. Go to [https://supabase.com](https://supabase.com) and create a project
2. Go to Settings → API to find your project URL and service role key
3. Create a storage bucket named `car-images` in your Supabase dashboard

### 3. Create Supabase Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket named `car-images`
4. Set the bucket to public (so images can be accessed via URL)

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing the Full Flow

### Step-by-Step Testing Guide

1. **Start the Server**
   ```bash
   npm run dev
   ```

2. **Open the Application**
   - Navigate to `http://localhost:3000`
   - You should see the Luxury Car Showroom AI interface

3. **Test File Upload**
   - Click "Choose File" or drag a car image
   - Supported formats: JPG, PNG
   - Maximum size: 10MB
   - You should see a preview of your uploaded image

4. **Test AI Processing**
   - Click "✨ Create Luxury Showroom Image"
   - Watch the loading state: "🔄 Processing..."
   - The process should take 30-60 seconds (Flux Kontext Pro is more sophisticated)

5. **Verify Results**
   - The luxury showroom image should appear on the right side
   - The car should be placed in a professional showroom environment
   - The image URL should be from Supabase storage

6. **Test Download**
   - Click "📥 Download Image"
   - The enhanced image should download to your computer

7. **Test Share** (if supported)
   - Click "📤 Share Image"
   - Should open native sharing dialog or copy Supabase URL to clipboard

### Expected Console Output

During processing, you should see logs like:
```
📁 Processing file: your_image.jpg
✅ File read successfully, size: 1234567
🤖 Running Flux Kontext Pro for background removal and luxury showroom compositing...
🔍 Flux Kontext Pro raw output: ["https://replicate.delivery/pbxt/..."]
📋 Extracted URL from array: https://replicate.delivery/pbxt/...
✅ Flux Kontext Pro processing completed
🎨 Processed image URL: https://replicate.delivery/pbxt/...
📥 Downloading processed image...
✅ Downloaded processed image, size: 456789
☁️ Uploading to Supabase storage...
✅ Uploaded to Supabase: luxury-showroom-1234567890.png
✅ Public URL generated: https://your-project.supabase.co/storage/v1/object/public/car-images/luxury-showroom-1234567890.png
🧹 Cleaned up temporary file
```

## 🔧 Troubleshooting

### Common Issues

1. **"REPLICATE_API_TOKEN not configured"**
   - Make sure you have a `.env.local` file with your Replicate API token
   - Restart the development server after adding the token

2. **"Supabase configuration missing"**
   - Ensure you have both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local`
   - Verify your Supabase project is active

3. **"Supabase upload failed"**
   - Make sure you have a storage bucket named `car-images` in your Supabase project
   - Check that the bucket is set to public
   - Verify your service role key has storage permissions

4. **"Invalid file type"**
   - Only JPG and PNG files are supported
   - Check that your image file isn't corrupted

5. **"File size must be less than 10MB"**
   - Compress your image or use a smaller file
   - The 10MB limit helps with processing speed

6. **Processing fails or times out**
   - Check your internet connection
   - Verify your Replicate API token is valid
   - Try with a smaller image file
   - Flux Kontext Pro can take 30-60 seconds for complex images

### Debug Mode

To see detailed logs, check your terminal where `npm run dev` is running. All processing steps are logged with emojis for easy identification.

## 📁 Project Structure

```
car-ai-app/
├── pages/
│   ├── index.js              # Main frontend interface
│   └── api/
│       └── enhance-image.js  # Backend API for AI processing and Supabase upload
├── public/
│   └── uploads/              # Temporary files (auto-created)
├── package.json
├── env.example               # Environment variables template
└── README.md
```

## 🔒 Security Notes

- API tokens are stored in environment variables
- File uploads are validated for type and size
- Temporary files are automatically cleaned up
- Images are stored in Supabase with public URLs
- No user data is stored permanently in the app

## 🚀 Deployment

This app can be deployed to Vercel, Netlify, or any Node.js hosting platform. Make sure to:

1. Set all environment variables in your hosting platform:
   - `REPLICATE_API_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Ensure your Supabase storage bucket is properly configured
3. Test the full flow after deployment

## 💡 How It Works

1. **Upload**: User uploads a car image (JPG/PNG)
2. **AI Processing**: Flux Kontext Pro removes background and adds luxury showroom environment
3. **Download**: The processed image is downloaded from Replicate
4. **Storage**: Image is uploaded to Supabase storage bucket
5. **Return**: Public Supabase URL is returned to the frontend
6. **Display**: User can view, download, or share the final image

## 📝 License

This project is open source and available under the MIT License.
