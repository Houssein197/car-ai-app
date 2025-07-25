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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setLoggedIn(!!user));
  }, []);

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh', pb: 8 }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: '#2563eb', boxShadow: 'none', borderBottom: '1px solid #e5eaf2' }}>
        <Toolbar>
          <DirectionsCarFilledIcon sx={{ fontSize: 32, color: '#2563eb', mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: 1, color: '#2563eb' }}>
            autopic.co.uk
          </Typography>
          <Button color="inherit" sx={{ mr: 2, color: '#fff', fontSize: '1.25rem' }} onClick={() => router.push("/pricing")}>Pricing</Button>
          {loggedIn ? (
            <>
              <Button color="inherit" sx={{ mr: 2, color: '#fff', fontSize: '1.25rem' }} onClick={() => router.push("/dashboard")}>Dashboard</Button>
              <Button color="inherit" sx={{ color: '#fff', fontSize: '1.25rem' }} onClick={async () => { await supabase.auth.signOut(); setLoggedIn(false); router.push("/signup"); }}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" sx={{ mr: 2, color: '#fff', fontSize: '1.25rem' }} onClick={() => router.push("/signup?tab=login")}>Login</Button>
              <Button color="primary" variant="outlined" sx={{ color: '#fff', borderColor: '#fff', fontSize: '1.25rem' }} onClick={() => router.push("/signup?tab=signup")}>Sign Up</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        {/* Hero section */}
        <Box textAlign="center" mb={8}>
          <Typography variant="h1" fontWeight={800} color="#2563eb" gutterBottom sx={{ fontSize: { xs: 36, md: 56 } }}>
            Transform your car photos<br />into <Box component="span" color="#2563eb">premium showroom</Box> images
          </Typography>
          <Typography variant="h5" color="#222" mb={5}>
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
              px: 6, py: 2, fontWeight: 700, fontSize: '1.2rem', borderRadius: 3,
              bgcolor: '#2563eb', color: '#fff', boxShadow: 'none',
              '&:hover': { bgcolor: '#174bbd' }
            }}
          >
            Get Started
          </Button>
        </Box>
        {/* Before and After section */}
        <Box textAlign="center" mb={10}>
          <Typography variant="h4" fontWeight={700} color="#2563eb" mb={4}>
            See the Difference
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" gap={8} flexWrap="nowrap">
            <Box>
              <Typography variant="subtitle1" mb={1}>Before</Typography>
              <Box
                sx={{
                  width: 600,
                  height: 375,
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px 0 #2563eb22',
                  border: '2px solid #e5eaf2',
                  mb: 2,
                }}
              >
                <Image src="/before.png" alt="Before" width={600} height={375} style={{ objectFit: 'cover' }} />
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle1" mb={1}>After</Typography>
              <Box
                sx={{
                  width: 600,
                  height: 375,
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px 0 #2563eb22',
                  border: '2px solid #e5eaf2',
                  mb: 2,
                }}
              >
                <Image src="/after.png" alt="After" width={600} height={375} style={{ objectFit: 'cover' }} />
              </Box>
            </Box>
          </Box>
        </Box>
        {/* Features section */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center" alignItems="stretch" mb={8}>
          {[{
            title: 'AI-enhanced quality',
            desc: 'Our AI polishes every detail to give your photos a true professional feel.'
          }, {
            title: 'Fast and effortless',
            desc: 'Upload, process, and download — all in under a minute.'
          }, {
            title: 'Designed for dealerships',
            desc: 'Built to help you stand out and move inventory faster.'
          }].map((f, i) => (
            <Paper key={f.title} elevation={0} sx={{
              flex: '1 1 250px',
              maxWidth: 320,
              mx: 'auto',
              p: 4,
              borderRadius: 3,
              bgcolor: '#fff',
              border: '1px solid #e5eaf2',
              boxShadow: 'none',
              textAlign: 'left',
              minHeight: 180
            }}>
              <Typography variant="h6" mb={1} color="#2563eb" fontWeight={700}>{f.title}</Typography>
              <Typography color="#222" fontSize={16}>
                {f.desc}
              </Typography>
            </Paper>
          ))}
        </Stack>
        {/* Testimonials placeholder */}
        <Box textAlign="center" mb={8}>
          <Typography variant="h4" fontWeight={700} color="#2563eb" mb={2}>
            Loved by dealerships and car sellers
          </Typography>
          <Typography color="#222" fontWeight={500} fontSize={20}>
            “autopic.co.uk helped us increase inquiries by 45% — it really makes listings pop!”
          </Typography>
        </Box>
        {/* Footer */}
        <Box textAlign="center" mt={10} color="#94a3b8" fontSize={16}>
          <Typography variant="body2">
            © {new Date().getFullYear()} <Box component="span" color="#2563eb" fontWeight={700}>autopic.co.uk</Box> — All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
