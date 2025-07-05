import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setImageUrl("");
      const tempPreview = URL.createObjectURL(uploadedFile);
      setPreviewUrl(tempPreview);
    }
  };

  const handleGenerate = async () => {
    if (!file) return alert("Please upload an image first!");
    setLoading(true);
    setImageUrl("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/enhance-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Full API Response:", data);
      console.log("data.imageUrl:", data.imageUrl);
      console.log("API Response:", data);

      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        alert("Error: No image URL returned from server.");
      }
    } catch (error) {
      console.error(error);
      alert("Error processing image");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    console.log("Final imageUrl before download:", imageUrl);

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "enhanced_car.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  const handleShare = async () => {
    if (!imageUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out my enhanced car image!",
          text: "Look at this showroom-style car photo I created.",
          url: imageUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      alert("Sharing is not supported on this device/browser.");
    }
  };

  return (
    <main
      style={{
        backgroundColor: "#ffffff",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        padding: "2rem",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🚗 Car Photo Enhancer</h1>
        <p style={{ color: "#555" }}>
          Upload your car photo and get a showroom-style enhanced image instantly.
        </p>
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "2rem",
          marginTop: "2rem",
        }}
      >
        {/* Left side: Upload box */}
        <div
          style={{
            flex: 1,
            maxWidth: "500px",
            minHeight: "500px",
            border: "2px dashed #ccc",
            borderRadius: "8px",
            padding: "1rem",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ marginBottom: "1rem" }}>Upload Car Photo</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: "100%", marginBottom: "1rem" }}
            />

            {previewUrl && (
              <img
                src={previewUrl}
                alt="Uploaded preview"
                style={{ width: "100%", borderRadius: "8px", marginTop: "1rem" }}
              />
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              backgroundColor: "#0070f3",
              color: "white",
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              width: "100%",
              marginTop: "1rem",
            }}
          >
            {loading ? "Processing..." : "Generate Enhanced Image"}
          </button>
        </div>

        {/* Right side: Result box */}
        <div
          style={{
            flex: 1,
            maxWidth: "500px",
            minHeight: "500px",
            border: "2px dashed #ccc",
            borderRadius: "8px",
            padding: "1rem",
            boxSizing: "border-box",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt="Enhanced"
                style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }}
              />
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
                  marginBottom: "0.5rem",
                }}
              >
                Download Image
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
                }}
              >
                Share Image
              </button>
            </>
          ) : (
            <p style={{ color: "#888" }}>Your enhanced image will appear here.</p>
          )}
        </div>
      </div>
    </main>
  );
}
