import { useRouter } from "next/router";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import Image from 'next/image';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setLoggedIn(!!user));
  }, []);

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh', pb: 8 }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: '#2563eb', boxShadow: 'none', borderBottom: '1px solid #e5eaf2' }}>
        <Toolbar sx={{ 
          minHeight: { xs: '56px', md: '64px' },
          px: { xs: 1, md: 2 }
        }}>
          <DirectionsCarFilledIcon sx={{ 
            fontSize: { xs: 24, md: 32 }, 
            color: '#2563eb', 
            mr: { xs: 0.5, md: 1 } 
          }} />
          <Typography variant="h6" sx={{ 
            flexGrow: 1, 
            fontWeight: 800, 
            letterSpacing: 1, 
            color: '#2563eb',
            fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
          }}>
            {isMobile ? 'autopic' : 'autopic.co.uk'}
          </Typography>
          
          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button color="inherit" sx={{ color: '#2563eb', fontSize: '1.25rem' }} onClick={() => router.push("/pricing")}>
              Pricing
            </Button>
            {loggedIn ? (
              <>
                <Button color="inherit" sx={{ color: '#2563eb', fontSize: '1.25rem' }} onClick={() => router.push("/dashboard")}>
                  Dashboard
                </Button>
                <Button color="inherit" sx={{ color: '#2563eb', fontSize: '1.25rem' }} onClick={async () => { await supabase.auth.signOut(); setLoggedIn(false); router.push("/signup"); }}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button color="inherit" sx={{ color: '#2563eb', fontSize: '1.25rem' }} onClick={() => router.push("/signup?tab=login")}>
                  Login
                </Button>
                <Button color="primary" variant="outlined" sx={{ color: '#2563eb', borderColor: '#2563eb', fontSize: '1.25rem' }} onClick={() => router.push("/signup?tab=signup")}>
                  Sign Up
                </Button>
              </>
            )}
          </Box>
          
          {/* Mobile Navigation */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 0.5 }}>
            <Button 
              size="small" 
              color="inherit" 
              sx={{ color: '#2563eb', fontSize: '0.75rem', px: 1 }} 
              onClick={() => router.push("/pricing")}
            >
              Pricing
            </Button>
            {loggedIn ? (
              <Button 
                size="small" 
                color="inherit" 
                sx={{ color: '#2563eb', fontSize: '0.75rem', px: 1 }} 
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>
            ) : (
              <Button 
                size="small" 
                color="primary" 
                variant="outlined" 
                sx={{ color: '#2563eb', borderColor: '#2563eb', fontSize: '0.75rem', px: 1 }} 
                onClick={() => router.push("/signup")}
              >
                Sign Up
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 10 } }}>
        {/* Hero section */}
        <Box textAlign="center" mb={{ xs: 6, md: 8 }}>
          <Typography variant="h1" fontWeight={800} color="#2563eb" gutterBottom sx={{ 
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
            lineHeight: { xs: 1.2, md: 1.1 },
            mb: { xs: 2, md: 3 }
          }}>
            Transform your car photos<br />
            into <Box component="span" color="#2563eb">premium showroom</Box> images
          </Typography>
          <Typography variant="h5" color="#222" mb={{ xs: 3, md: 5 }} sx={{
            fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
            lineHeight: { xs: 1.4, md: 1.3 }
          }}>
            Instantly upgrade your listings and sell faster with <Box component="span" color="#2563eb">autopic.co.uk</Box>.
          </Typography>
          <Button
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                router.push("/signup?redirect=/pricing");
                return;
              }
              // Check if user has an active subscription
              const { data: subscription } = await supabase
                .from("subscriptions")
                .select("status")
                .eq("user_id", user.id)
                .eq("status", "active")
                .single();
              if (subscription) {
                router.push("/dashboard");
              } else {
                router.push("/pricing");
              }
            }}
            variant="contained"
            size="large"
            sx={{
              px: { xs: 4, md: 6 }, 
              py: { xs: 1.5, md: 2 }, 
              fontWeight: 700, 
              fontSize: { xs: '1rem', md: '1.2rem' }, 
              borderRadius: 3,
              bgcolor: '#2563eb', 
              color: '#fff', 
              boxShadow: 'none',
              '&:hover': { bgcolor: '#174bbd' }
            }}
          >
            Get Started
          </Button>
        </Box>
        
        {/* Before and After section */}
        <Box textAlign="center" mb={{ xs: 8, md: 10 }}>
          <Typography variant="h4" fontWeight={700} color="#2563eb" mb={{ xs: 3, md: 4 }} sx={{
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
          }}>
            See the Difference
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" gap={{ xs: 2, md: 8 }} flexWrap="wrap">
            <Box sx={{ width: { xs: '100%', sm: '45%', md: 'auto' } }}>
              <Typography variant="subtitle1" mb={1}>Before</Typography>
              <Box
                sx={{
                  width: { xs: '100%', sm: '100%', md: 600 },
                  height: { xs: 200, sm: 250, md: 375 },
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  mb: { xs: 2, md: 0 }
                }}
              >
                <Image
                  src="/before.png"
                  alt="Before - Original car photo"
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </Box>
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '45%', md: 'auto' } }}>
              <Typography variant="subtitle1" mb={1}>After</Typography>
              <Box
                sx={{
                  width: { xs: '100%', sm: '100%', md: 600 },
                  height: { xs: 200, sm: 250, md: 375 },
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <Image
                  src="/after.png"
                  alt="After - Enhanced showroom image"
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* Features section */}
        <Box textAlign="center">
          <Typography variant="h4" fontWeight={700} color="#2563eb" mb={{ xs: 3, md: 4 }} sx={{
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
          }}>
            Why Choose AutoPic?
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 3, md: 4 }} justifyContent="center">
            <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, flex: 1 }}>
              <Typography variant="h6" fontWeight={600} color="#2563eb" mb={1}>
                Instant Results
              </Typography>
              <Typography variant="body2" color="#666">
                Get professional showroom images in seconds, not hours.
              </Typography>
            </Paper>
            <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, flex: 1 }}>
              <Typography variant="h6" fontWeight={600} color="#2563eb" mb={1}>
                Easy to Use
              </Typography>
              <Typography variant="body2" color="#666">
                Simply upload your photo and let our AI do the work.
              </Typography>
            </Paper>
            <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, flex: 1 }}>
              <Typography variant="h6" fontWeight={600} color="#2563eb" mb={1}>
                Sell Faster
              </Typography>
              <Typography variant="body2" color="#666">
                Professional images help you close deals quicker.
              </Typography>
            </Paper>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
