import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import {
  Box, Button, TextField, Typography, Paper, Tabs, Tab, InputAdornment, IconButton, AppBar, Toolbar, Container
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AuthPage() {
  const [tab, setTab] = useState(0); // 0 = Login, 1 = Signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dealership, setDealership] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dealershipError, setDealershipError] = useState(false);
  const router = useRouter();
  const { plan, tab: tabParam } = router.query;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (tabParam === 'signup') setTab(1);
    else if (tabParam === 'login') setTab(0);
  }, [tabParam]);

  const handleAuth = async () => {
    setLoading(true);
    setMessage("");
    setDealershipError(false);
    if (tab === 1 && !dealership.trim()) {
      setDealershipError(true);
      setLoading(false);
      setMessage("Please enter your car dealership name.");
      return;
    }
    try {
      if (tab === 1) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Save dealership name to localStorage
        localStorage.setItem("dealership", dealership.trim());
        // Create profile row if not exists (basic user info only)
        if (data?.user?.id) {
          try {
            const { error: insertError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: data.user.id,
                  full_name: "",
                },
              ], { upsert: false });
            if (insertError && !insertError.message.includes("duplicate")) {
              console.error("Failed to create profile:", insertError.message);
            }
          } catch (profileErr) {
            console.error("Profile creation error:", profileErr);
          }
        }
        setMessage("✅ Account created! Redirecting...");
        setTimeout(() => router.push("/pricing"), 1000);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("✅ Logged in! Redirecting...");
        setTimeout(() => router.push("/dashboard"), 1000);
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: { xs: "column", md: "row" },
      bgcolor: "#f7fafd"
    }}>
      {/* Mobile App Bar */}
      <AppBar position="static" elevation={0} sx={{ 
        bgcolor: '#fff', 
        color: '#2563eb', 
        boxShadow: 'none', 
        borderBottom: '1px solid #e5eaf2',
        display: { xs: 'block', md: 'none' }
      }}>
        <Toolbar sx={{ 
          minHeight: '56px !important', 
          px: { xs: 1, sm: 2 },
          gap: 1
        }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push("/")}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {tab === 0 ? 'Login' : 'Sign Up'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Left Panel (Form) */}
      <Box
        sx={{
          width: { xs: "100%", md: "35%" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 2, sm: 3, md: 6 },
          py: { xs: 3, md: 8 },
          bgcolor: "#fff",
          boxShadow: { md: "2px 0 24px 0 rgba(0,0,0,0.03)" },
          minHeight: { xs: 'auto', md: '100vh' }
        }}
      >
        <Paper elevation={0} sx={{ 
          width: "100%", 
          maxWidth: { xs: '100%', sm: 400, md: 380 }, 
          p: { xs: 3, sm: 4, md: 4 }, 
          borderRadius: { xs: 2, md: 4 }, 
          boxShadow: "0 2px 16px 0 rgba(37,99,235,0.04)" 
        }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              mb: { xs: 2, md: 3 },
              ".MuiTabs-indicator": { bgcolor: "#2563eb" },
              ".MuiTab-root": { 
                fontWeight: 600, 
                color: "#2563eb",
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }
            }}
          >
            <Tab label="Login" />
            <Tab label="Sign Up" />
          </Tabs>
          
          <Box component="form" noValidate autoComplete="off" onSubmit={e => { e.preventDefault(); handleAuth(); }}>
            {tab === 1 && (
              <TextField
                label="Car Dealership Name"
                value={dealership}
                onChange={e => setDealership(e.target.value)}
                fullWidth
                margin="normal"
                required
                error={dealershipError}
                helperText={dealershipError ? "This field is required" : ""}
                sx={{
                  bgcolor: "#fafbfc",
                  borderRadius: 2,
                  mb: { xs: 1, md: 2 },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#e5eaf2" },
                    "&:hover fieldset": { borderColor: "#2563eb" },
                    "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: 2 },
                  },
                }}
              />
            )}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: "#fafbfc",
                borderRadius: 2,
                mb: { xs: 1, md: 2 },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#e5eaf2" },
                  "&:hover fieldset": { borderColor: "#2563eb" },
                  "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: 2 },
                },
              }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: "#fafbfc",
                borderRadius: 2,
                mb: { xs: 2, md: 3 },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#e5eaf2" },
                  "&:hover fieldset": { borderColor: "#2563eb" },
                  "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: 2 },
                },
              }}
            />
            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              fullWidth
              size="large"
              sx={{
                mt: { xs: 1, md: 3 },
                mb: { xs: 2, md: 3 },
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: "#2563eb",
                boxShadow: "none",
                height: { xs: 48, md: 56 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                "&:hover": { bgcolor: "#174bbd" }
              }}
            >
              {loading ? "Processing..." : tab === 1 ? "Create account" : "Log in"}
            </Button>
          </Box>
          
          <Typography 
            mt={{ xs: 2, md: 3 }} 
            textAlign="center" 
            color="text.secondary" 
            sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}
          >
            {tab === 0 ? (
              <>
                {"Don&apos;t have an account? "}
                <Button 
                  variant="text" 
                  size="small" 
                  sx={{ 
                    color: "#2563eb", 
                    fontWeight: 600, 
                    minWidth: 0, 
                    p: 0,
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' }
                  }} 
                  onClick={() => setTab(1)}
                >
                  Create one
                </Button>
              </>
            ) : (
              <>
                {"Already have an account? "}
                <Button 
                  variant="text" 
                  size="small" 
                  sx={{ 
                    color: "#2563eb", 
                    fontWeight: 600, 
                    minWidth: 0, 
                    p: 0,
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' }
                  }} 
                  onClick={() => setTab(0)}
                >
                  Log in
                </Button>
              </>
            )}
          </Typography>
          
          {message && (
            <Typography 
              mt={2} 
              color={message.startsWith("✅") ? "success.main" : "error.main"} 
              fontWeight={500}
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              {message}
            </Typography>
          )}
        </Paper>
      </Box>
      
      {/* Right Panel (Image + Promo) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "65%",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: `url('/blue-pattern-bg.jpeg') center center / cover no-repeat`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(37,99,235,0.10)",
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            color: "#fff",
            textAlign: "center",
            width: "100%",
            px: 6,
          }}
        >
          <Typography variant="h3" fontWeight={800} sx={{ color: "#fff", textShadow: "0 2px 16px #2563eb44" }}>
            Transform car photos into <br /> premium showroom images in seconds.
          </Typography>
          <Typography variant="h6" mt={3} sx={{ color: "#e3e9f7", fontWeight: 400 }}>
            AI-powered, professional, and effortless.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
