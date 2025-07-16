import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import { Box, Typography, CircularProgress } from "@mui/material";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PaymentSuccess() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

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
      // Fallback: after 5 seconds, redirect anyway
      timeout = setTimeout(() => {
        clearInterval(interval);
        router.replace("/dashboard");
      }, 5000);
    })();
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: "#f7fafd" }}>
      <CircularProgress sx={{ color: "#2563eb", mb: 4 }} size={48} />
      <Typography variant="h4" fontWeight={700} color="#2563eb" mb={2}>
        Finalizing your purchase...
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Please wait while we activate your plan and credits.
      </Typography>
      {error && <Typography color="error.main">{error}</Typography>}
    </Box>
  );
} 