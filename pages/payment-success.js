import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import { Box, Typography, CircularProgress, Button, Paper, Container } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PaymentSuccess() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const checkSession = useCallback(async () => {
    setLoading(true);
    setError("");
    setAttempts(0);
    let currentAttempts = 0;
    const maxAttempts = 60; // 30 seconds (increased from 20)
    const interval = 500;
    let found = false;
    
    while (currentAttempts < maxAttempts) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        setAttempts(currentAttempts + 1);
        
        if (authError) {
          console.error("Auth error:", authError);
        }
        
        if (user) {
          found = true;
          console.log("✅ User found, redirecting to dashboard...");
          router.replace("/dashboard");
          break;
        }
        
        await new Promise(r => setTimeout(r, interval));
        currentAttempts++;
      } catch (err) {
        console.error("Session check error:", err);
        currentAttempts++;
      }
    }
    
    if (!found) {
      setLoading(false);
      setError("We couldn't detect your session. Please try logging in manually.");
    }
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;
    
    const fromCheckout = router.query.fromCheckout;
    if (fromCheckout !== "1") {
      console.log("❌ Not from checkout, redirecting to dashboard");
      router.replace("/dashboard");
      return;
    }
    
    console.log("🔄 Starting session check...");
    checkSession();
  }, [router, checkSession, retryKey]);

  const handleTryAgain = () => {
    setRetryKey(k => k + 1);
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <Container maxWidth="sm" sx={{ 
      minHeight: "100vh", 
      bgcolor: "#f7fafd", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      py: { xs: 2, md: 4 }
    }}>
      <Paper elevation={3} sx={{ 
        p: { xs: 3, sm: 4, md: 5 }, 
        borderRadius: { xs: 2, md: 4 }, 
        width: '100%',
        maxWidth: { xs: '100%', sm: 400 }, 
        textAlign: "center" 
      }}>
        {loading ? (
          <>
            <CircularProgress sx={{ 
              color: "#2563eb", 
              mb: { xs: 2, md: 3 },
              width: { xs: 40, md: 48 },
              height: { xs: 40, md: 48 }
            }} />
            <Typography 
              variant="h5" 
              fontWeight={700} 
              color="primary" 
              mb={{ xs: 1.5, md: 2 }}
              sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
            >
              Finalizing your purchase...
            </Typography>
            <Typography 
              color="text.secondary" 
              mb={{ xs: 1.5, md: 2 }}
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Please wait while we confirm your payment and log you in.
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Attempt {attempts}/40
            </Typography>
          </>
        ) : error ? (
          <>
            <Typography 
              variant="h6" 
              color="error" 
              mb={{ xs: 1.5, md: 2 }}
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              {error}
            </Typography>
            <Typography 
              color="text.secondary" 
              mb={{ xs: 2, md: 3 }}
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Your payment was successful, but we need to log you in to access your dashboard.
            </Typography>
            <Box sx={{ 
              display: "flex", 
              flexDirection: { xs: "column", sm: "row" }, 
              gap: { xs: 1.5, sm: 2 },
              justifyContent: 'center'
            }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleTryAgain}
                fullWidth={isMobile}
                sx={{ 
                  fontWeight: 700, 
                  borderRadius: 2,
                  height: { xs: 48, md: 56 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleGoToDashboard}
                fullWidth={isMobile}
                sx={{ 
                  fontWeight: 700, 
                  borderRadius: 2,
                  height: { xs: 48, md: 56 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Go to Dashboard
              </Button>
            </Box>
          </>
        ) : null}
      </Paper>
    </Container>
  );
} 