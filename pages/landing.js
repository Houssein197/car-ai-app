import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import ClearIcon from '@mui/icons-material/Clear';

export default function Home() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(uploadedFile.type)) {
        setError("Please upload a JPG or PNG image file.");
        return;
      }
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
      } else {
        throw new Error("No image URL returned from server.");
      }
    } catch (error) {
      setError(error.message || "Error processing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `luxury_showroom_car_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
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
      } catch (error) {
        if (error.name !== 'AbortError') {
          setError("Failed to share image. Please try again.");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(imageUrl);
        alert("Image URL copied to clipboard!");
      } catch (error) {
        setError("Sharing is not supported on this device/browser.");
      }
    }
  };

  const clearAll = () => {
    setFile(null);
    setImageUrl("");
    setPreviewUrl("");
    setError("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Luxury Car Showroom AI
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" fontWeight={700} color="text.primary" gutterBottom>
            🚗 Luxury Car Showroom AI
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Upload your car photo and get a professional luxury showroom image with AI.
          </Typography>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center" alignItems="flex-start">
          {/* Upload Card */}
          <Card sx={{ flex: '1 1 400px', maxWidth: 500, minHeight: 500, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h5" color="text.primary" mb={2}>
                Upload Car Photo
              </Typography>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                fullWidth
                sx={{ mb: 2, py: 2 }}
              >
                Choose File
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              {previewUrl && (
                <Box mt={2}>
                  <Typography variant="subtitle1" color="text.secondary" mb={1}>Preview:</Typography>
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Uploaded preview"
                    sx={{ width: '100%', borderRadius: 2, border: 1, borderColor: 'grey.200' }}
                  />
                </Box>
              )}
            </CardContent>
            <CardActions sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                onClick={handleGenerate}
                disabled={loading || !file}
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ fontWeight: 600 }}
              >
                {loading ? <><CircularProgress size={24} sx={{ mr: 1 }} /> Processing...</> : '✨ Create Luxury Showroom Image'}
              </Button>
              {(file || imageUrl) && (
                <Button
                  onClick={clearAll}
                  color="error"
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  fullWidth
                  size="large"
                >
                  Clear
                </Button>
              )}
            </CardActions>
          </Card>
          {/* Result Card */}
          <Card sx={{ flex: '1 1 400px', maxWidth: 500, minHeight: 500, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2, boxShadow: 3, textAlign: 'center' }}>
            {loading ? (
              <Box textAlign="center">
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="h6" color="text.primary" mb={1}>Creating Luxury Showroom Image</Typography>
                <Typography color="text.secondary">Removing background and compositing with luxury showroom...</Typography>
                <Typography color="text.disabled" fontSize={14} mt={2}>This may take 30-60 seconds</Typography>
              </Box>
            ) : imageUrl ? (
              <>
                <Box
                  component="img"
                  src={imageUrl}
                  alt="Luxury showroom car image"
                  sx={{ width: '100%', borderRadius: 2, mb: 2, border: 1, borderColor: 'grey.200' }}
                />
                <Stack direction="column" spacing={1} width="100%">
                  <Button
                    onClick={handleDownload}
                    variant="contained"
                    color="success"
                    startIcon={<DownloadIcon />}
                    fullWidth
                    size="large"
                  >
                    Download Image
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="outlined"
                    color="primary"
                    startIcon={<ShareIcon />}
                    fullWidth
                    size="large"
                  >
                    Share Image
                  </Button>
                </Stack>
              </>
            ) : (
              <Box color="text.disabled">
                <Typography fontSize={48} mb={1}>🏎️</Typography>
                <Typography fontSize={18} fontWeight={500}>Your luxury showroom image will appear here</Typography>
                <Typography fontSize={14} mt={1} color="text.secondary">
                  Upload a car photo and click &quot;Create Luxury Showroom Image&quot;
                </Typography>
              </Box>
            )}
          </Card>
        </Stack>
        <Box textAlign="center" mt={6} color="text.secondary" fontSize={14}>
          <Typography variant="body2">Powered by Abdulhakim Houssein</Typography>
        </Box>
      </Container>
    </Box>
  );
}
