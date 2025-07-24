import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import { Box, Typography, CircularProgress, Button, Paper } from "@mui/material";

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

  const checkSession = useCallback(async () => {
    setLoading(true);
    setError("");
    setAttempts(0);
    let currentAttempts = 0;
    const maxAttempts = 40; // 20 seconds
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
      setError("We couldn't detect your session. This might happen if you were logged out during checkout.");
    }
  }, [router, retryKey]);

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
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7fafd", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Paper elevation={3} sx={{ p: 5, borderRadius: 4, minWidth: 340, maxWidth: 400, textAlign: "center" }}>
        {loading ? (
          <>
            <CircularProgress sx={{ color: "#2563eb", mb: 3 }} />
            <Typography variant="h5" fontWeight={700} color="primary" mb={2}>
              Finalizing your purchase...
            </Typography>
            <Typography color="text.secondary" mb={2}>
              Please wait while we confirm your payment and log you in.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Attempt {attempts}/40
            </Typography>
          </>
        ) : error ? (
          <>
            <Typography variant="h6" color="error" mb={2}>{error}</Typography>
            <Typography color="text.secondary" mb={3}>
              Your payment was successful, but we need to log you in to access your dashboard.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleTryAgain}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleGoToDashboard}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                Go to Dashboard
              </Button>
            </Box>
          </>
        ) : null}
      </Paper>
    </Box>
  );
} 