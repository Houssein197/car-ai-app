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
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import React from "react";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

export default function Home() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // On mount, check login and fetch credits
  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/signup?redirect=/landing");
        return;
      }
      setUser(user);
      // Fetch credits from credits table
      const { data: creditRow, error: creditError } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      setCredits(creditRow?.balance ?? 0);
    })();
    // eslint-disable-next-line
  }, []);

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
    if (credits === 0) {
      setError("You have no credits left. Please upgrade your plan.");
      return;
    }
    setLoading(true);
    setImageUrl("");
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    if (user && user.id) {
      formData.append("userId", String(user.id));
    } else {
      setError("User not found. Please log in again.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/enhance-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setImageUrl(data.url);
        // Update credits
        setCredits(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError("Failed to process image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'enhanced-car-image.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to download image.");
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Enhanced Car Image',
          text: 'Check out this enhanced car image created with AutoPic!',
          url: imageUrl,
        });
      } else {
        await navigator.clipboard.writeText(imageUrl);
        setError("Image URL copied to clipboard!");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("Failed to share image.");
    }
  };

  const clearAll = () => {
    setFile(null);
    setImageUrl("");
    setPreviewUrl("");
    setError("");
    if (file) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh', pb: 8 }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: '#2563eb', boxShadow: 'none', borderBottom: '1px solid #e5eaf2' }}>
        <Toolbar sx={{ 
          minHeight: { xs: '56px', md: '64px' },
          px: { xs: 1, md: 2 }
        }}>
          <Typography variant="h6" sx={{ 
            flexGrow: 1, 
            fontWeight: 800, 
            letterSpacing: 1, 
            color: '#2563eb',
            fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
          }}>
            {isMobile ? 'autopic' : 'autopic.co.uk'}
          </Typography>
          
          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button color="inherit" sx={{ color: '#2563eb', fontSize: '1.25rem' }} onClick={() => router.push("/")}>
              Home
            </Button>
            <Button color="inherit" sx={{ color: '#2563eb', fontSize: '1.25rem' }} onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
            <Button color="inherit" sx={{ color: '#2563eb', fontSize: '1.25rem' }} onClick={() => router.push("/pricing")}>
              Pricing
            </Button>
            <Button color="inherit" sx={{ color: '#2563eb', fontSize: '1.25rem' }} onClick={async () => { await supabase.auth.signOut(); router.push("/signup"); }}>
              Logout
            </Button>
          </Box>
          
          {/* Mobile Navigation */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 0.5 }}>
            <Button 
              size="small" 
              color="inherit" 
              sx={{ color: '#2563eb', fontSize: '0.75rem', px: 1 }} 
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </Button>
            <Button 
              size="small" 
              color="primary" 
              variant="outlined" 
              sx={{ color: '#2563eb', borderColor: '#2563eb', fontSize: '0.75rem', px: 1 }} 
              onClick={() => router.push("/pricing")}
            >
              Pricing
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
        <Box textAlign="center" mb={{ xs: 4, md: 6 }}>
          <Typography variant="h3" fontWeight={800} color="#2563eb" gutterBottom sx={{ 
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
            lineHeight: { xs: 1.2, md: 1.1 }
          }}>
            Transform your car photos
          </Typography>
          <Typography variant="h5" color="#222" mb={{ xs: 2, md: 3 }} sx={{
            fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
            lineHeight: { xs: 1.4, md: 1.3 }
          }}>
            Upload and enhance your car images instantly
          </Typography>
          <Typography variant="body1" color="#666" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Credits remaining: {credits}
          </Typography>
        </Box>

        {/* Upload Section - Fixed height for mobile */}
        <Card elevation={2} sx={{ 
          maxWidth: { xs: '100%', sm: 600 }, 
          mx: 'auto', 
          borderRadius: { xs: 2, md: 3 },
          p: { xs: 2, md: 3 },
          minHeight: { xs: 'auto', md: 'auto' }
        }}>
          <CardContent sx={{ p: { xs: 1, md: 2 } }}>
            <Stack spacing={{ xs: 2, md: 3 }}>
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth={isMobile}
                    startIcon={<UploadFileIcon />}
                    sx={{ 
                      mb: { xs: 1, md: 0 },
                      mr: { xs: 0, md: 2 },
                      height: { xs: 48, md: 40 }
                    }}
                  >
                    Choose Image
                  </Button>
                </label>
                {!isMobile && (
                  <Button
                    variant="contained"
                    onClick={handleGenerate}
                    disabled={loading || !file}
                    sx={{ height: 40 }}
                  >
                    {loading ? <CircularProgress size={20} /> : "Generate"}
                  </Button>
                )}
              </Box>
              
              {isMobile && (
                <Button
                  variant="contained"
                  onClick={handleGenerate}
                  disabled={loading || !file}
                  fullWidth
                  sx={{ height: 48 }}
                >
                  {loading ? <CircularProgress size={20} /> : "Generate Enhanced Image"}
                </Button>
              )}

              {error && (
                <Alert severity="error" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  {error}
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Image Display Section - Separate from upload */}
        {(previewUrl || imageUrl) && (
          <Card elevation={2} sx={{ 
            maxWidth: { xs: '100%', sm: 600 }, 
            mx: 'auto', 
            mt: { xs: 2, md: 3 },
            borderRadius: { xs: 2, md: 3 },
            p: { xs: 2, md: 3 }
          }}>
            <CardContent sx={{ p: { xs: 1, md: 2 } }}>
              <Stack spacing={{ xs: 2, md: 3 }}>
                {previewUrl && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" mb={1} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Original Image
                    </Typography>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: 8,
                        maxHeight: 300
                      }}
                    />
                  </Box>
                )}

                {imageUrl && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" mb={1} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Enhanced Image
                    </Typography>
                    <img
                      src={imageUrl}
                      alt="Enhanced"
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: 8,
                        maxHeight: 300
                      }}
                    />
                    
                    <CardActions sx={{ 
                      justifyContent: 'center', 
                      pt: { xs: 2, md: 3 },
                      gap: { xs: 1, md: 2 }
                    }}>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                        size={isMobile ? "large" : "medium"}
                        fullWidth={isMobile}
                        sx={{ 
                          height: { xs: 48, md: 40 },
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        Download
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ShareIcon />}
                        onClick={handleShare}
                        size={isMobile ? "large" : "medium"}
                        fullWidth={isMobile}
                        sx={{ 
                          height: { xs: 48, md: 40 },
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        Share
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={clearAll}
                        size={isMobile ? "large" : "medium"}
                        fullWidth={isMobile}
                        sx={{ 
                          height: { xs: 48, md: 40 },
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        Clear
                      </Button>
                    </CardActions>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
