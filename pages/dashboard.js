import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import {
  Box, Button, Typography, IconButton, Paper, Stack, CircularProgress, Grid, Tooltip,
  AppBar, Toolbar, Drawer, List, ListItem, ListItemText, ListItemIcon
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import DownloadIcon from "@mui/icons-material/Download";
import ShareIcon from "@mui/icons-material/Share";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dealership, setDealership] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [initError, setInitError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Check if user is coming from payment-success
          const isFromPaymentSuccess = window.location.search.includes('fromCheckout=1') || 
                                     document.referrer.includes('payment-success');
          
          if (isFromPaymentSuccess) {
            // Give a moment for session to be established
            await new Promise(r => setTimeout(r, 2000));
            const { data: { user: retryUser } } = await supabase.auth.getUser();
            if (!retryUser) {
              router.replace("/signup?redirect=/dashboard");
              return;
            }
            setUser(retryUser);
          } else {
            router.replace("/signup?redirect=/dashboard");
            return;
          }
        } else {
          setUser(user);
        }
        
        // Fetch credits from credits table
        const { data: creditRow, error: creditError } = await supabase
          .from("credits")
          .select("balance")
          .eq("user_id", user.id)
          .single();
        if (creditError || !creditRow) {
          setCredits(0);
        } else {
          setCredits(creditRow.balance ?? 0);
        }
        const d = localStorage.getItem("dealership");
        setDealership(d || "");
      } catch (e) {
        setInitError("Failed to load user or credits. Please try again later.");
      }
    })();
  }, [router]);

  // When results change, reset currentIndex to last image
  useEffect(() => {
    if (results.length > 0) {
      setCurrentIndex(results.length - 1);
    } else {
      setCurrentIndex(0);
    }
  }, [results]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/signup");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Validate file
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setError("Only JPG and PNG files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be less than 10MB.");
      return;
    }
    setFiles([file]);
    setError("");
    setResults([]);
    setPreviews([{
      url: URL.createObjectURL(file),
      name: file.name
    }]);
  };

  const handleGenerate = async () => {
    if (!files.length) {
      setError("Please upload images first!");
      return;
    }
    if (credits <= 0) {
      setError("You have no credits left. Please upgrade your plan.");
      return;
    }
    setLoading(true);
    setError("");
    const formData = new FormData();
    files.forEach(file => formData.append("file", file));
    if (user && user.id) {
      formData.append("userId", String(user.id)); // Ensure it's a string
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
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${text}`);
      }
      const data = await res.json();
      if (data.imageUrl) {
        setResults(prev => [
          ...prev,
          {
            url: data.imageUrl,
            name: `Generated Image ${prev.length + 1}`
          }
        ]);
        // Refetch credits from credits table after generation
        const { data: creditRow, error: creditError } = await supabase
          .from("credits")
          .select("balance")
          .eq("user_id", user.id)
          .single();
        setCredits(creditRow?.balance ?? 0);
      } else {
        throw new Error("No image URL returned from server.");
      }
    } catch (error) {
      setError(error.message || "Error processing images. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url, name) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const dlUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = dlUrl;
      link.download = name.replace(/\.[^/.]+$/, "") + "_showroom.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(dlUrl);
    } catch {
      setError("Failed to download image. Please try again.");
    }
  };

  const handleShare = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out my luxury showroom car image!",
          text: "Look at this professional car photo I created with AI.",
          url,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert("Image URL copied to clipboard!");
      } catch {
        setError("Sharing not supported on this device/browser.");
      }
    }
  };

  const clearAll = () => {
    setFiles([]);
    setPreviews([]);
    setResults([]);
    setError("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  if (initError) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        p: { xs: 2, md: 4 }
      }}>
        <Typography variant="h6" color="error" mb={2}>
          {initError}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Mobile App Bar */}
      <AppBar position="static" elevation={0} sx={{ 
        bgcolor: '#fff', 
        color: '#2563eb', 
        boxShadow: 'none', 
        borderBottom: '1px solid #e5eaf2',
        display: { xs: 'block', md: 'none' }
      }}>
        <Toolbar sx={{ minHeight: '56px !important', px: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setMobileMenuOpen(true)}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#2563eb', fontWeight: 600 }}>
            {credits} credits
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Box sx={{ width: 250, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Menu
            </Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List>
            <ListItem button onClick={() => { router.push('/'); setMobileMenuOpen(false); }}>
              <ListItemText primary="Home" />
            </ListItem>
            <ListItem button onClick={() => { router.push('/pricing'); setMobileMenuOpen(false); }}>
              <ListItemText primary="Pricing" />
            </ListItem>
            <ListItem button onClick={() => { router.push('/dashboard'); setMobileMenuOpen(false); }}>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Desktop Header */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: "space-between", alignItems: "center", mb: 4, p: { xs: 2, md: 6 } }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button color="inherit" sx={{ mr: 2 }} onClick={() => router.push("/pricing")}>Pricing</Button>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body1" color="text.secondary" sx={{ mr: 3 }}>
            <b>{dealership || user.email}</b> • <b>{credits}</b> credits
          </Typography>
          <IconButton onClick={handleLogout} size="small" sx={{ color: "#2563eb", border: "1px solid #e5eaf2", borderRadius: 2, ml: 1 }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      {/* Main Content */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="flex-start" justifyContent="center">
        {/* Upload Box */}
        <Paper elevation={0} sx={{
          flex: "1 1 520px", maxWidth: 600, minHeight: 600, p: 4, borderRadius: 4,
          bgcolor: "#fff", boxShadow: "0 2px 16px 0 rgba(37,99,235,0.04)",
          display: "flex", flexDirection: "column", justifyContent: "center",
          alignItems: "center"
        }}>
          <Typography variant="h6" color="primary.main" mb={2} fontWeight={700}>
            Upload Car Photo
          </Typography>
          <Button
            component="label"
            variant="outlined"
            fullWidth
            sx={{
              mb: 2, py: 2, borderRadius: 2, borderColor: "#e5eaf2",
              color: "#2563eb", fontWeight: 500,
              "&:hover": { borderColor: "#2563eb", bgcolor: "#f0f6ff" }
            }}
          >
            Choose File
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          {previews.length > 0 && (
            <Box sx={{ mt: 2, mb: 2, width: 360, height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5eaf2', borderRadius: 3, bgcolor: '#fafbfc' }}>
              <Box
                component="img"
                src={previews[0].url}
                alt={previews[0].name}
                sx={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 3 }}
              />
            </Box>
          )}
          <Button
            onClick={handleGenerate}
            disabled={loading || !files.length || credits <= 0}
            variant="outlined"
            fullWidth
            size="large"
            sx={{
              mt: 3, fontWeight: 700, borderRadius: 2, color: "#2563eb", borderColor: "#2563eb",
              "&:hover": { bgcolor: "#f0f6ff", borderColor: "#174bbd" }
            }}
          >
            {loading ? <CircularProgress size={22} sx={{ mr: 1 }} /> : "✨ Generate Image"}
          </Button>
          {(files.length > 0 || results.length > 0) && (
            <Button
              onClick={clearAll}
              variant="text"
              color="error"
              size="medium"
              sx={{
                mt: 2,
                borderRadius: 2,
                minWidth: 0,
                alignSelf: "center",
                fontWeight: 600,
                textTransform: "none",
                px: 4,
                py: 1.2,
                fontSize: 16,
                letterSpacing: 0.2,
                width: { xs: '100%', sm: 180 },
                justifyContent: 'center',
                bgcolor: 'transparent',
                '&:hover': { bgcolor: '#fff0f0' }
              }}
            >
              Clear
            </Button>
          )}
          {error && (
            <Typography mt={2} color="error.main" fontWeight={500}>
              {error}
            </Typography>
          )}
        </Paper>
        {/* Result Box */}
        <Paper elevation={0} sx={{
          flex: "1 1 520px", maxWidth: 600, minHeight: 600, p: 4, borderRadius: 4,
          bgcolor: "#fff", boxShadow: "0 2px 16px 0 rgba(37,99,235,0.04)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          {loading ? (
            <Box textAlign="center">
              <CircularProgress size={48} sx={{ mb: 2, color: "#2563eb" }} />
              <Typography variant="h6" color="primary.main" mb={1}>Creating Showroom Image</Typography>
              <Typography color="text.secondary">Processing your photo...</Typography>
            </Box>
          ) : results.length > 0 ? (
            <Box width="100%" display="flex" flexDirection="column" alignItems="center">
              <Box
                component="img"
                src={results[0].url}
                alt={results[0].name}
                sx={{ width: 420, height: 420, objectFit: 'contain', borderRadius: 3, border: '1px solid #e5eaf2', boxShadow: '0 2px 8px 0 rgba(37,99,235,0.07)', mb: 2, bgcolor: '#fafbfc' }}
              />
              <Typography variant="subtitle2" sx={{ mb: 2, textAlign: "center", maxWidth: 420, wordBreak: "break-all" }}>
                {results[0].name.length > 30 ? results[0].name.slice(0, 27) + "..." : results[0].name}
              </Typography>
              <Stack direction="row" spacing={4} justifyContent="center" mt={1}>
                <Tooltip title="Download">
                  <IconButton
                    onClick={() => handleDownload(results[0].url, results[0].name)}
                    size="large"
                    sx={{ color: "#2563eb", width: 56, height: 56, border: '2px solid #2563eb', borderRadius: 2 }}
                  >
                    <DownloadIcon fontSize="large" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share">
                  <IconButton
                    onClick={() => handleShare(results[0].url)}
                    size="large"
                    sx={{ color: "#2563eb", width: 56, height: 56, border: '2px solid #2563eb', borderRadius: 2 }}
                  >
                    <ShareIcon fontSize="large" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          ) : (
            <Box color="text.disabled" textAlign="center">
              <Typography fontSize={44} mb={1}>🏎️</Typography>
              <Typography fontSize={18} fontWeight={500}>Your showroom image will appear here</Typography>
              <Typography fontSize={14} mt={1} color="text.secondary">
                Upload a car photo and click &quot;Generate Image&quot;
              </Typography>
            </Box>
          )}
        </Paper>
      </Stack>
      <Box textAlign="center" mt={6} color="text.secondary" fontSize={14}>
        <Typography variant="body2">Powered by AutoPic.co.uk</Typography>
      </Box>
    </Box>
  );
}
