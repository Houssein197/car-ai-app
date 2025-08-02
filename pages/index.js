import { useState } from "react";
import { useRouter } from "next/router";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const plans = [
  {
    key: "one-time",
    name: "One-time",
    desc: "Perfect for trying out — pay once and get 10 credits.",
    price: "£25",
    highlight: false,
  },
  {
    key: "basic",
    name: "Basic",
    desc: "Monthly plan with 100 credits, perfect for small dealerships.",
    price: "£150/mo",
    highlight: true,
  },
  {
    key: "pro",
    name: "Pro",
    desc: "For high-volume sellers — 250 credits each month.",
    price: "£248/mo",
    highlight: false,
  },
];

export default function Home() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    
    // Redirect to signup page when user tries to generate
    router.push("/signup");
  };

  const clearAll = () => {
    setFiles([]);
    setPreviews([]);
    setError("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBuyPlan = (planKey) => {
    // Redirect to signup tab specifically
    router.push("/signup?tab=signup");
  };

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: '#000', boxShadow: 'none', borderBottom: '1px solid #e5eaf2' }}>
        <Toolbar sx={{ 
          minHeight: { xs: '56px', md: '64px' },
          px: { xs: 1, md: 2 }
        }}>
          <Typography variant="h6" sx={{ 
            flexGrow: 1, 
            fontWeight: 600, 
            color: '#ffffff',
            fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
          }}>
            AutoPic.co.uk
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              color="inherit" 
              sx={{ 
                color: '#ffffff', 
                fontSize: '1.1rem',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: 2
              }} 
              onClick={scrollToPricing}
            >
              Pricing
            </Button>
            <Button 
              color="inherit" 
              sx={{ 
                color: '#ffffff', 
                fontSize: '1.1rem',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: 2
              }} 
              onClick={() => router.push("/signup?tab=login")}
            >
              Log In
            </Button>
            <Button 
              color="inherit" 
              sx={{ 
                color: '#ffffff', 
                fontSize: '1.1rem',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: 2
              }} 
              onClick={() => router.push("/signup?tab=signup")}
            >
              Sign Up
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Main Tagline */}
        <Box textAlign="center" mb={{ xs: 4, md: 6 }}>
          <Typography variant="h3" fontWeight={900} color="#235FEA" sx={{ 
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
            lineHeight: 1.1,
            fontFamily: 'Horizon, sans-serif',
            textShadow: '0 2px 4px rgba(35, 95, 234, 0.1)',
            letterSpacing: '-0.02em',
            textTransform: 'none'
          }}>
            Transform your Car Photos into Premium Showroom images
          </Typography>
        </Box>
        
        {/* Main Content - Two Panels */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} mb={{ xs: 6, md: 8 }}>
          {/* Upload Panel */}
          <Paper elevation={0} sx={{
            flex: 1,
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            bgcolor: '#fff',
            border: '1px solid #e5eaf2',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400
          }}>
            <Typography variant="h5" fontWeight={600} color="#2563eb" mb={3}>
              Upload Car Photo
            </Typography>
            
            <Button
              component="label"
              variant="outlined"
              sx={{
                mb: 3,
                py: 2,
                px: 4,
                borderRadius: 2,
                borderColor: '#e5eaf2',
                color: '#2563eb',
                fontWeight: 500,
                fontSize: '1rem',
                "&:hover": { borderColor: '#2563eb', bgcolor: '#f0f6ff' }
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
              <Box sx={{ 
                mt: 2, 
                mb: 3, 
                width: '100%', 
                maxWidth: 300,
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e5eaf2',
                borderRadius: 2,
                bgcolor: '#fafbfc',
                overflow: 'hidden'
              }}>
                <Box
                  component="img"
                  src={previews[0].url}
                  alt={previews[0].name}
                  sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </Box>
            )}
            
            <Button
              onClick={handleGenerate}
              disabled={loading || !files.length}
              variant="outlined"
              size="large"
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                color: '#2563eb',
                borderColor: '#2563eb',
                fontSize: '1rem',
                py: 1.5,
                px: 4,
                "&:hover": { bgcolor: '#f0f6ff', borderColor: '#174bbd' },
                "&:disabled": { opacity: 0.6 }
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Generating...
                </>
              ) : (
                <>
                  ✨ Generate Image
                </>
              )}
            </Button>
            
            {error && (
              <Typography mt={2} color="error.main" fontWeight={500} textAlign="center">
                {error}
              </Typography>
            )}
          </Paper>
          
          {/* Preview Panel */}
          <Paper elevation={0} sx={{
            flex: 1,
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            bgcolor: '#fff',
            border: '1px solid #e5eaf2',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400
          }}>
            <Box color="text.disabled" textAlign="center">
              <Typography fontSize={44} mb={2}>🏎️</Typography>
              <Typography fontSize={18} fontWeight={500} mb={1}>
                Your showroom image will appear here
              </Typography>
              <Typography fontSize={14} color="text.secondary">
                Upload a car photo and click &quot;Generate Image&quot;
              </Typography>
            </Box>
          </Paper>
        </Stack>
        
        {/* Feature Cards */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="center" mb={{ xs: 8, md: 10 }}>
          <Paper elevation={0} sx={{ 
            p: { xs: 2, md: 3 }, 
            borderRadius: 3, 
            flex: 1,
            bgcolor: '#fff',
            border: '1px solid #e5eaf2',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <Typography variant="h6" fontWeight={600} color="#2563eb" mb={1}>
              Instant Results
            </Typography>
            <Typography variant="body2" color="#666">
              Get professional showroom images in seconds, not hours.
            </Typography>
          </Paper>
          
          <Paper elevation={0} sx={{ 
            p: { xs: 2, md: 3 }, 
            borderRadius: 3, 
            flex: 1,
            bgcolor: '#fff',
            border: '1px solid #e5eaf2',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <Typography variant="h6" fontWeight={600} color="#2563eb" mb={1}>
              Easy to Use
            </Typography>
            <Typography variant="body2" color="#666">
              Simply upload your photo and let our AI do the work.
            </Typography>
          </Paper>
          
          <Paper elevation={0} sx={{ 
            p: { xs: 2, md: 3 }, 
            borderRadius: 3, 
            flex: 1,
            bgcolor: '#fff',
            border: '1px solid #e5eaf2',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <Typography variant="h6" fontWeight={600} color="#2563eb" mb={1}>
              Sell Faster
            </Typography>
            <Typography variant="body2" color="#666">
              Professional images help you close deals quicker.
            </Typography>
          </Paper>
        </Stack>

        {/* Pricing Section */}
        <Box id="pricing-section" sx={{ mt: { xs: 8, md: 12 } }}>
          <Typography 
            variant="h2" 
            fontWeight={800} 
            textAlign="center" 
            mb={{ xs: 6, md: 8 }} 
            color="#1e40af" 
            sx={{ 
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              lineHeight: { xs: 1.1, md: 1.05 }
            }}
          >
            Choose your plan
          </Typography>
          
          <Stack 
            direction={{ xs: "column", md: "row" }} 
            spacing={{ xs: 4, md: 6 }} 
            justifyContent="center" 
            alignItems="stretch" 
            sx={{ 
              maxWidth: '1400px',
              mx: 'auto'
            }}
          >
            {plans.map((plan) => (
              <Paper
                key={plan.key}
                elevation={plan.highlight ? 8 : 2}
                sx={{
                  flex: "1 1 350px",
                  maxWidth: { xs: '100%', sm: 500, md: 400 },
                  mx: "auto",
                  p: { xs: 4, sm: 5, md: 6 },
                  borderRadius: { xs: 3, md: 5 },
                  bgcolor: plan.highlight ? "#e8f0fe" : "#fff",
                  border: plan.highlight ? "3px solid #1e40af" : "1px solid #e5eaf2",
                  boxShadow: plan.highlight ? "0 8px 32px 0 #1e40af22" : "0 4px 20px 0 #1e40af0a",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: { xs: 'auto', md: 500 },
                  gap: { xs: 3, md: 4 },
                  transform: plan.highlight ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: plan.highlight ? 'scale(1.03)' : 'scale(1.01)',
                    boxShadow: plan.highlight ? "0 12px 40px 0 #1e40af33" : "0 8px 28px 0 #1e40af15"
                  }
                }}
              >
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography 
                    variant="h4" 
                    fontWeight={700} 
                    color={plan.highlight ? "#1e40af" : "#222"} 
                    mb={{ xs: 2, md: 3 }}
                    sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}
                  >
                    {plan.name}
                  </Typography>
                  <Typography 
                    color="text.secondary" 
                    mb={{ xs: 3, md: 4 }} 
                    textAlign="center"
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1.125rem' },
                      lineHeight: { xs: 1.5, md: 1.6 }
                    }}
                  >
                    {plan.desc}
                  </Typography>
                  <Typography 
                    variant="h3" 
                    fontWeight={800} 
                    mb={{ xs: 3, md: 4 }} 
                    color="#1e40af"
                    sx={{ fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3rem' } }}
                  >
                    {plan.price}
                  </Typography>
                </Box>
                
                <Button
                  onClick={() => handleBuyPlan(plan.key)}
                  variant={plan.highlight ? "contained" : "outlined"}
                  color="primary"
                  size="large"
                  fullWidth
                  sx={{
                    fontWeight: 700,
                    borderRadius: 3,
                    px: { xs: 4, md: 6 },
                    py: { xs: 2, md: 2.5 },
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    height: { xs: 56, md: 64 },
                    boxShadow: plan.highlight ? "0 4px 16px 0 #1e40af33" : "none",
                    bgcolor: plan.highlight ? "#1e40af" : undefined,
                    color: plan.highlight ? "#fff" : "#1e40af",
                    borderColor: "#1e40af",
                    borderWidth: "2px",
                    '&:hover': {
                      bgcolor: plan.highlight ? "#1e3a8a" : "#f0f6ff",
                      borderColor: "#1e3a8a",
                      transform: 'translateY(-2px)',
                      boxShadow: plan.highlight ? "0 6px 20px 0 #1e40af44" : "0 4px 12px 0 #1e40af22"
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Buy Now
                </Button>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
