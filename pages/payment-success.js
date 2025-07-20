import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import { Box, Typography, CircularProgress, Button } from "@mui/material";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PaymentSuccess() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    let interval;
    let timeout;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in.");
        setChecking(false);
        return;
      }
      interval = setInterval(async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan, credits")
          .eq("id", user.id)
          .single();
        if (profile && profile.plan && profile.plan !== "none") {
          clearInterval(interval);
          clearTimeout(timeout);
          router.replace("/dashboard");
        }
      }, 500);
      // Fallback: after 10 seconds, show error
      timeout = setTimeout(() => {
        clearInterval(interval);
        setWaited(true);
        setError("Your payment was received, but your plan is not yet active. Please refresh or contact support if this persists.");
        setChecking(false);
      }, 10000);
    })();
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: "#f7fafd" }}>
      {checking && (
        <>
          <CircularProgress sx={{ color: "#2563eb", mb: 4 }} size={48} />
          <Typography variant="h4" fontWeight={700} color="#2563eb" mb={2}>
            Finalizing your purchase...
          </Typography>
          <Typography color="text.secondary" mb={2}>
            Please wait while we activate your plan and credits.
          </Typography>
        </>
      )}
      {error && (
        <>
          <Typography color="error.main" mb={2}>{error}</Typography>
          {waited && (
            <Button variant="contained" color="primary" onClick={() => router.reload()}>
              Refresh
            </Button>
          )}
        </>
      )}
    </Box>
  );
} 