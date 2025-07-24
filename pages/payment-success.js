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

  const checkSession = useCallback(async () => {
    setLoading(true);
    setError("");
    let attempts = 0;
    const maxAttempts = 40; // 20 seconds
    const interval = 500;
    let found = false;
    while (attempts < maxAttempts) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        found = true;
        router.replace("/dashboard");
        break;
      }
      await new Promise(r => setTimeout(r, interval));
      attempts++;
    }
    if (!found) {
      setLoading(false);
      setError("We couldn't detect your session. Please try again.");
    }
  }, [router, retryKey]);

  useEffect(() => {
    if (!router.isReady) return;
    const fromCheckout = router.query.fromCheckout;
    if (fromCheckout !== "1") {
      router.replace("/dashboard");
      return;
    }
    checkSession();
  }, [router, checkSession, retryKey]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7fafd", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Paper elevation={3} sx={{ p: 5, borderRadius: 4, minWidth: 340, maxWidth: 400, textAlign: "center" }}>
        {loading ? (
          <>
            <CircularProgress sx={{ color: "#2563eb", mb: 3 }} />
            <Typography variant="h5" fontWeight={700} color="primary" mb={2}>
              Finalizing your purchase...
            </Typography>
            <Typography color="text.secondary">
              Please wait while we confirm your payment and log you in.
            </Typography>
          </>
        ) : error ? (
          <>
            <Typography variant="h6" color="error" mb={2}>{error}</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setRetryKey(k => k + 1)}
              sx={{ mt: 2, fontWeight: 700, borderRadius: 2 }}
            >
              Try Again
            </Button>
          </>
        ) : null}
      </Paper>
    </Box>
  );
} 