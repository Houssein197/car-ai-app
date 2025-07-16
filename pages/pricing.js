import { useEffect, useState } from "react";
import {
  Box, Button, Typography, Paper, Stack, AppBar, Toolbar
} from "@mui/material";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const plans = [
  {
    key: "one-time",
    name: "One-time",
    desc: "Perfect for trying out — pay once and get 10 credits.",
    price: "£25",
    priceId: "price_1RknfnCcxLeRC3tnGcqnb9Ft", // Live price ID for one-time
    highlight: false,
  },
  {
    key: "basic",
    name: "Basic",
    desc: "Monthly plan with 100 credits, perfect for small dealerships.",
    price: "£150/mo",
    priceId: "price_1Rkng8CcxLeRC3tneNBlFXmc", // Live price ID for basic
    highlight: true,
  },
  {
    key: "pro",
    name: "Pro",
    desc: "For high-volume sellers — 250 credits each month.",
    price: "£248/mo",
    priceId: "price_1RkngVCcxLeRC3tn3AhFXshU", // Live price ID for pro
    highlight: false,
  },
];

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showPlans, setShowPlans] = useState(false);
  const router = useRouter();
  const [userPlan, setUserPlan] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setLoggedIn(!!user);
      if (!user) {
        router.replace("/signup?redirect=/pricing");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      if (profile && profile.plan) {
        setUserPlan(profile.plan);
        router.replace("/dashboard");
      } else {
        setShowPlans(true);
      }
    })();
  }, [router]);

  const handleCheckout = async (plan) => {
    setLoadingPlan(plan.priceId);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be logged in to choose a plan.");
        setLoadingPlan(null);
        return;
      }
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.id,
          customerEmail: user.email,
          plan: plan.key
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error creating checkout session.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  if (!showPlans) return null;

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: '#fff', color: '#2563eb', boxShadow: 'none', borderBottom: '1px solid #e5eaf2', m: 0, p: 0 }}>
        <Toolbar sx={{ minHeight: '56px !important', p: 0 }}>
          <Button color="inherit" sx={{ mr: 2 }} onClick={() => router.push("/")}>Home</Button>
          <Button color="inherit" sx={{ mr: 2 }} onClick={() => router.push("/dashboard")}>Dashboard</Button>
          {!loggedIn && <Button color="inherit" sx={{ mr: 2 }} onClick={() => router.push("/signup")}>Login</Button>}
          {!loggedIn && <Button color="primary" variant="outlined" onClick={() => router.push("/signup")}>Sign Up</Button>}
        </Toolbar>
      </AppBar>
      <Box sx={{ bgcolor: "#f7fafd", minHeight: "100vh", py: 0, mt: '56px' }}>
        <Typography variant="h3" fontWeight={800} textAlign="center" mb={8} color="#2563eb" sx={{ mt: 14 }}>
          Choose your plan
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={4} justifyContent="center" alignItems="stretch" px={2}>
          {plans.map((plan) => (
            <Paper
              key={plan.key}
              elevation={plan.highlight ? 4 : 1}
              sx={{
                flex: "1 1 250px",
                maxWidth: 340,
                mx: "auto",
                p: 5,
                borderRadius: 4,
                bgcolor: userPlan === plan.key ? "#e8f0fe" : "#fff",
                border: userPlan === plan.key ? "2px solid #2563eb" : plan.highlight ? "2px solid #2563eb" : "1px solid #e5eaf2",
                boxShadow: plan.highlight ? "0 4px 24px 0 #2563eb11" : "0 2px 12px 0 #2563eb08",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h5" fontWeight={700} color={userPlan === plan.key ? "#2563eb" : plan.highlight ? "#2563eb" : "#222"} mb={2}>
                {plan.name}
                {userPlan === plan.key && <span style={{ marginLeft: 8, fontSize: 14, color: '#2563eb' }}>(Current)</span>}
              </Typography>
              <Typography color="text.secondary" mb={3} textAlign="center">
                {plan.desc}
              </Typography>
              <Typography variant="h4" fontWeight={800} mb={3} color="#2563eb">
                {plan.price}
              </Typography>
              <Button
                onClick={() => handleCheckout(plan)}
                variant={plan.highlight ? "contained" : "outlined"}
                color="primary"
                size="large"
                disabled={loadingPlan === plan.priceId}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 4,
                  boxShadow: plan.highlight ? "0 2px 12px 0 #2563eb22" : "none",
                  bgcolor: plan.highlight ? "#2563eb" : undefined,
                  color: plan.highlight ? "#fff" : "#2563eb",
                  borderColor: "#2563eb",
                  '&:hover': {
                    bgcolor: plan.highlight ? "#174bbd" : "#f0f6ff",
                    borderColor: "#174bbd"
                  }
                }}
              >
                {loadingPlan === plan.priceId ? "Redirecting..." : "Choose Plan"}
              </Button>
            </Paper>
          ))}
        </Stack>
      </Box>
    </>
  );
}
