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
        bgcolor: '#1e40af', 
        color: '#fff', 
        boxShadow: 'none', 
        borderBottom: '1px solid #e5eaf2',
        display: { xs: 'block', md: 'none' }
      }}>
        <Toolbar sx={{ 
          minHeight: '64px !important', 
          px: { xs: 2, sm: 3 },
          gap: 2
        }}>
          <Button 
            color="inherit" 
            size="large"
            sx={{ 
              fontSize: '1.1rem',
              fontWeight: 600,
              px: 3,
              minWidth: 'auto'
            }} 
            onClick={() => router.push("/")}
          >
            Home
          </Button>
          <Button 
            color="inherit" 
            size="large"
            sx={{ 
              fontSize: '1.1rem',
              fontWeight: 600,
              px: 3,
              minWidth: 'auto'
            }} 
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </Button>
          {!loggedIn && (
            <Button 
              color="inherit" 
              variant="outlined" 
              size="large"
              sx={{ 
                fontSize: '1.1rem',
                fontWeight: 600,
                px: 3,
                minWidth: 'auto',
                ml: 'auto',
                borderColor: '#fff',
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }
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
        bgcolor: '#1e40af', 
        color: '#fff', 
        boxShadow: 'none', 
        borderBottom: '1px solid #e5eaf2',
        display: { xs: 'none', md: 'block' }
      }}>
        <Toolbar sx={{ minHeight: '80px !important', px: 4 }}>
          <Button 
            color="inherit" 
            sx={{ 
              mr: 4, 
              fontSize: '1.25rem',
              fontWeight: 600,
              px: 3,
              py: 1.5
            }} 
            onClick={() => router.push("/")}
          >
            Home
          </Button>
          <Button 
            color="inherit" 
            sx={{ 
              mr: 4, 
              fontSize: '1.25rem',
              fontWeight: 600,
              px: 3,
              py: 1.5
            }} 
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </Button>
          {!loggedIn && (
            <Button 
              color="inherit" 
              sx={{ 
                mr: 3, 
                fontSize: '1.25rem',
                fontWeight: 600,
                px: 3,
                py: 1.5
              }} 
              onClick={() => router.push("/signup")}
            >
              Login
            </Button>
          )}
          {!loggedIn && (
            <Button 
              color="inherit" 
              variant="outlined" 
              sx={{ 
                fontSize: '1.25rem',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderColor: '#fff',
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }
              }} 
              onClick={() => router.push("/signup")}
            >
              Sign Up
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        bgcolor: "#f8fafc", 
        minHeight: "100vh",
        pt: { xs: '80px', md: '100px' },
        pb: { xs: 4, md: 8 }
      }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
          <Typography 
            variant="h2" 
            fontWeight={800} 
            textAlign="center" 
            mb={{ xs: 6, md: 10 }} 
            color="#1e40af" 
            sx={{ 
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem', lg: '4.5rem' },
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
                  onClick={() => handleCheckout(plan)}
                  variant={plan.highlight ? "contained" : "outlined"}
                  color="primary"
                  size="large"
                  disabled={loadingPlan === plan.priceId}
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
                  {loadingPlan === plan.priceId ? "Redirecting..." : "Choose Plan"}
                </Button>
              </Paper>
            ))}
          </Stack>
        </Container>
      </Box>
    </>
  );
}
