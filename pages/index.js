import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(uploadedFile.type)) {
        setError("Please upload a JPG or PNG image file.");
        return;
      }

      // Validate file size (10MB limit)
      if (uploadedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB.");
        return;
      }

      setFile(uploadedFile);
      setImageUrl("");
      setError("");
      const tempPreview = URL.createObjectURL(uploadedFile);
      setPreviewUrl(tempPreview);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError("Please upload an image first!");
      return;
    }

    setLoading(true);
    setImageUrl("");
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("🚀 Starting luxury showroom processing...");
      const res = await fetch("/api/enhance-image", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${text}`);
      }
      
      const data = await res.json();
      
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        console.log("✅ Image processed and uploaded successfully:", data.imageUrl);
      } else {
        throw new Error("No image URL returned from server.");
      }
      
    } catch (error) {
      console.error("❌ Processing error:", error);
      setError(error.message || "Error processing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    
    try {
      console.log("📥 Downloading image:", imageUrl);
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `luxury_showroom_car_${Date.now()}.png`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("✅ Download initiated");
    } catch (error) {
      console.error("❌ Download error:", error);
      setError("Failed to download image. Please try again.");
    }
  };
    
  const handleShare = async () => {
    if (!imageUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out my luxury showroom car image!",
          text: "Look at this professional car photo I created with AI.",
          url: imageUrl,
        });
        console.log("✅ Image shared successfully");
      } catch (error) {
        console.error("❌ Sharing error:", error);
        if (error.name !== 'AbortError') {
          setError("Failed to share image. Please try again.");
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(imageUrl);
        alert("Image URL copied to clipboard!");
      } catch (error) {
        console.error("❌ Clipboard error:", error);
        setError("Sharing is not supported on this device/browser.");
      }
    }
  };

  const clearAll = () => {
    setFile(null);
    setImageUrl("");
    setPreviewUrl("");
    setError("");
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  return (
    <main
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", color: "#1e293b" }}>
          🚗 Luxury Car Showroom AI
        </h1>
        <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
          Upload your car photo and get a professional luxury showroom image with AI.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#dc2626",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem",
          textAlign: "center"
        }}>
          {error}
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "2rem",
          marginTop: "2rem",
          flexWrap: "wrap"
        }}
      >
        {/* Left side: Upload box */}
        <div
          style={{
            flex: "1 1 500px",
            maxWidth: "500px",
            minHeight: "500px",
            border: "2px dashed #cbd5e1",
            borderRadius: "12px",
            padding: "1.5rem",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        >
          <div>
            <h2 style={{ marginBottom: "1rem", color: "#1e293b" }}>Upload Car Photo</h2>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              style={{ 
                width: "100%", 
                marginBottom: "1rem",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px"
              }}
            />

            {previewUrl && (
              <div style={{ marginTop: "1rem" }}>
                <h3 style={{ marginBottom: "0.5rem", color: "#374151" }}>Preview:</h3>
                <img
                  src={previewUrl}
                  alt="Uploaded preview"
                  style={{ 
                    width: "100%", 
                    borderRadius: "8px", 
                    border: "1px solid #e5e7eb"
                  }}
                />
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleGenerate}
              disabled={loading || !file}
              style={{
                backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                color: "white",
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "8px",
                cursor: loading || !file ? "not-allowed" : "pointer",
                width: "100%",
                fontSize: "1rem",
                fontWeight: "500"
              }}
            >
              {loading ? "🔄 Processing..." : "✨ Create Luxury Showroom Image"}
            </button>
            
            {(file || imageUrl) && (
              <button
                onClick={clearAll}
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  padding: "0.75rem 1rem",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem"
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right side: Result box */}
        <div
          style={{
            flex: "1 1 500px",
            maxWidth: "500px",
            minHeight: "500px",
            border: "2px dashed #cbd5e1",
            borderRadius: "12px",
            padding: "1.5rem",
            boxSizing: "border-box",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔄</div>
              <h3 style={{ color: "#374151", marginBottom: "0.5rem" }}>Creating Luxury Showroom Image</h3>
              <p style={{ color: "#6b7280" }}>
                Removing background and compositing with luxury showroom...
              </p>
              <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginTop: "1rem" }}>
                This may take 30-60 seconds
              </p>
            </div>
          ) : imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt="Luxury showroom car image"
                style={{ 
                  width: "100%", 
                  borderRadius: "8px", 
                  marginBottom: "1rem",
                  border: "1px solid #e5e7eb"
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button
                  onClick={handleDownload}
                  style={{
                    backgroundColor: "#22c55e",
                    color: "white",
                    padding: "0.75rem 1.5rem",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    width: "100%",
                    fontSize: "1rem",
                    fontWeight: "500"
                  }}
                >
                  📥 Download Image
                </button>
                <button
                  onClick={handleShare}
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "white",
                    padding: "0.75rem 1.5rem",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    width: "100%",
                    fontSize: "1rem",
                    fontWeight: "500"
                  }}
                >
                  📤 Share Image
                </button>
              </div>
            </>
          ) : (
            <div style={{ color: "#9ca3af" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏎️</div>
              <p style={{ fontSize: "1.1rem" }}>Your luxury showroom image will appear here</p>
              <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                Upload a car photo and click &quot;Create Luxury Showroom Image&quot;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: "center", 
        marginTop: "3rem", 
        color: "#6b7280",
        fontSize: "0.9rem"
      }}>
        <p>Powered by Flux Kontext Pro AI • Stored in Supabase</p>
      </div>
    </main>
  );
}
