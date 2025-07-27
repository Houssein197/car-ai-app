import { useEffect, useState } from "react";
import {
  Box, Button, Typography, Paper, Stack, AppBar, Toolbar, Container
} from "@mui/material";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

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
  const [loggedIn, setLoggedIn] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setLoggedIn(!!user);
      if (!user) {
        router.replace("/signup?redirect=/pricing");
        return;
      }
      setShowPlans(true);
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
      {/* Mobile App Bar */}
      <AppBar position="fixed" elevation={0} sx={{ 
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
          <Button 
            color="inherit" 
            size="small"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1, sm: 2 },
              minWidth: 'auto'
            }} 
            onClick={() => router.push("/")}
          >
            Home
          </Button>
          <Button 
            color="inherit" 
            size="small"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1, sm: 2 },
              minWidth: 'auto'
            }} 
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </Button>
          {!loggedIn && (
            <Button 
              color="primary" 
              variant="outlined" 
              size="small"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 },
                minWidth: 'auto',
                ml: 'auto'
              }} 
              onClick={() => router.push("/signup")}
            >
              Sign Up
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Desktop App Bar */}
      <AppBar position="fixed" elevation={0} sx={{ 
        bgcolor: '#fff', 
        color: '#2563eb', 
        boxShadow: 'none', 
        borderBottom: '1px solid #e5eaf2',
        display: { xs: 'none', md: 'block' }
      }}>
        <Toolbar sx={{ minHeight: '64px !important', px: 3 }}>
          <Button color="inherit" sx={{ mr: 2 }} onClick={() => router.push("/")}>
            Home
          </Button>
          <Button color="inherit" sx={{ mr: 2 }} onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
          {!loggedIn && <Button color="inherit" sx={{ mr: 2 }} onClick={() => router.push("/signup")}>
            Login
          </Button>}
          {!loggedIn && <Button color="primary" variant="outlined" onClick={() => router.push("/signup")}>
            Sign Up
          </Button>}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ 
        bgcolor: "#f7fafd", 
        minHeight: "100vh", 
        py: { xs: 2, md: 4 },
        mt: { xs: '56px', md: '64px' }
      }}>
        <Typography 
          variant="h3" 
          fontWeight={800} 
          textAlign="center" 
          mb={{ xs: 4, md: 8 }} 
          color="#2563eb" 
          sx={{ 
            mt: { xs: 2, md: 4 },
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
            lineHeight: { xs: 1.2, md: 1.1 }
          }}
        >
          Choose your plan
        </Typography>
        
        <Stack 
          direction={{ xs: "column", md: "row" }} 
          spacing={{ xs: 3, md: 4 }} 
          justifyContent="center" 
          alignItems="stretch" 
          sx={{ px: { xs: 1, sm: 2, md: 3 } }}
        >
          {plans.map((plan) => (
            <Paper
              key={plan.key}
              elevation={plan.highlight ? 4 : 1}
              sx={{
                flex: "1 1 250px",
                maxWidth: { xs: '100%', sm: 400, md: 340 },
                mx: "auto",
                p: { xs: 3, sm: 4, md: 5 },
                borderRadius: { xs: 2, md: 4 },
                bgcolor: plan.highlight ? "#e8f0fe" : "#fff",
                border: plan.highlight ? "2px solid #2563eb" : "1px solid #e5eaf2",
                boxShadow: plan.highlight ? "0 4px 24px 0 #2563eb11" : "0 2px 12px 0 #2563eb08",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: { xs: 'auto', md: 400 },
                gap: { xs: 2, md: 3 }
              }}
            >
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography 
                  variant="h5" 
                  fontWeight={700} 
                  color={plan.highlight ? "#2563eb" : "#222"} 
                  mb={{ xs: 1, md: 2 }}
                  sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                  {plan.name}
                </Typography>
                <Typography 
                  color="text.secondary" 
                  mb={{ xs: 2, md: 3 }} 
                  textAlign="center"
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: { xs: 1.4, md: 1.5 }
                  }}
                >
                  {plan.desc}
                </Typography>
                <Typography 
                  variant="h4" 
                  fontWeight={800} 
                  mb={{ xs: 2, md: 3 }} 
                  color="#2563eb"
                  sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
                >
                  {plan.price}
                </Typography>
              </Box>
              
              <Button
                onClick={() => handleCheckout(plan)}
                variant={plan.highlight ? "contained" : "outlined"}
                color="primary"
                size="large"
                disabled={loadingPlan === plan.priceId}
                fullWidth={isMobile}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  px: { xs: 3, md: 4 },
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  height: { xs: 48, md: 56 },
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
      </Container>
    </>
  );
}
